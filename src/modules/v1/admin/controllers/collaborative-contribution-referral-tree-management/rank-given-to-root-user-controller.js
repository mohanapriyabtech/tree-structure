import { User } from "../../../user/models/user-model";
import { ReferralTree } from "../../models/referral-tree-model";

class GetReferralTreeController {
    async processAndUpdateReferralTree(req, res) {
        try {
            const referralTrees = await ReferralTree.find(); // Fetch all referral trees
            let rootUserGenerations = []; // Array to store root user generation fills

            // Process each referral tree
            for (const tree of referralTrees) {
                const rootUser = tree.user;
                let generationsFilled = 0;

                // // Update root user
                // await updateUser(rootUser, "root", rootUser, null);

                // Process Generation 1
                let generation1Users = await processGeneration(
                    tree.generation_1,
                    rootUser,
                    "generation_1",
                    2
                );
                generationsFilled += generation1Users.selectedUsers.length;

                // // Update Generation 1 users
                // for (const userId of generation1Users.selectedUsers) {
                //     updateUser(userId, "generation_1", rootUser, rootUser);
                // }

                // Process Generation 2
                let generation2Users = [];
                for (const userId of generation1Users.selectedUsers) {
                    const referredUsers = await getReferredUsers(userId);
                    const gen2Result = await processGeneration(
                        referredUsers,
                        rootUser,
                        "generation_2",
                        2,
                        userId
                    );
                    generation2Users.push(...gen2Result.selectedUsers);
                    generationsFilled += gen2Result.selectedUsers.length;

                    // // Update Generation 2 users
                    // for (const gen2UserId of gen2Result.selectedUsers) {
                    //     updateUser(gen2UserId, "generation_2", rootUser, userId);
                    // }
                }

                // Process Generation 3
                let overflowUsers = tree.generation_1.filter(
                    (userId) => !generation1Users.selectedUsers.includes(userId)
                );
                let generation3Users = [];
                for (const userId of generation2Users) {
                    const referredUsers = await getReferredUsers(userId);
                    const gen3Result = await processGeneration(
                        referredUsers,
                        rootUser,
                        "generation_3",
                        2,
                        userId
                    );
                    generation3Users.push(...gen3Result.selectedUsers);
                    generationsFilled += gen3Result.selectedUsers.length;

                    // // Update Generation 3 users
                    // for (const gen3UserId of gen3Result.selectedUsers) {
                    //     await updateUser(gen3UserId, "generation_3", rootUser, userId);
                    // }
                }

                // // Handle overflow users into generation 3
                // for (const overflowUserId of overflowUsers) {
                //     await updateUser(overflowUserId, "generation_3", rootUser, null);
                // }

                // Add root user to the generations filled array
                rootUserGenerations.push({
                    rootUserId: rootUser,
                    generationsFilled
                });
            }

            // Rank root users based on the number of generations filled (descending order)
            rootUserGenerations.sort((a, b) => b.generationsFilled - a.generationsFilled);

            // Update ranks for root users based on the sorting
            for (let i = 0; i < rootUserGenerations.length; i++) {
                const { rootUserId, generationsFilled } = rootUserGenerations[i];
                // You can update rank or assign rank based on the number of generations filled
                await updateRootUserRank(rootUserId, generationsFilled, i + 1);
            }

            console.log("Referral tree processing and user updates completed.");
            res.status(200).json({
                success: true,
                message: 'Referral tree processed and root users ranked by generations filled.',
            });

        } catch (error) {
            console.error("Error processing referral tree:", error);
            res.status(500).json({
                success: false,
                message: 'Error processing referral tree.',
                error: error.message,
            });
        }
    }
}

export default new GetReferralTreeController()

/**
 * Update root user rank based on generations filled
 * @param {String} rootUserId - Root user ID
 * @param {Number} generationsFilled - Number of generations filled
 * @param {Number} rank - Rank to assign
 */
const updateRootUserRank = async (rootUserId, generationsFilled, rank) => {

    console.log(rootUserId, generationsFilled, rank, "asdgsd")
    await User.updateOne(
        { _id: rootUserId },
        {
            $set: {
                rank: rank,
                generations_filled: generationsFilled,
            },
        }
    );
    await ReferralTree.updateOne(
        { user: rootUserId },
        {
            $set: {
                rank: rank,
                generations_filled: generationsFilled,
            },
        }
    );
};


const processGeneration = (userIds, rootUser, generationType, maxUsers, refBy = null)=> {
    const selectedUsers = [];

    // Step 1: Prioritize users who referred others
    const priorityUsers = userIds.filter(async (userId) => {
        const referralCount = await User.countDocuments({ referred_by: userId });
        return referralCount > 0;
    });

    // Step 2: Select up to maxUsers from priority users
    selectedUsers.push(...priorityUsers.slice(0, maxUsers));

    // Step 3: Fill remaining slots with non-priority users
    if (selectedUsers.length < maxUsers) {
        const nonPriorityUsers = userIds.filter((userId) => !priorityUsers.includes(userId));
        const remainingSlots = maxUsers - selectedUsers.length;
        selectedUsers.push(...nonPriorityUsers.slice(0, remainingSlots));
    }

    // Return selected users for this generation
    return { selectedUsers };
}


const getReferredUsers = async (userId) => {
    return await User.find({ referred_by: userId }).select("_id").lean();
};