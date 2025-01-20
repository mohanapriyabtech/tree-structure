import { responseHandler } from "../../../../../utils/response-handler";
import { User } from "../../../user/models/user-model";
import { RefTree } from "../../models/ref-tree-model";
import { ReferralTree } from "../../models/referral-tree-model";

class GetReferralTreeController {
    async processAndUpdateReferralTree(req,res) {
        try {
            const referralTrees = await ReferralTree.find(); 
            for (const tree of referralTrees) {

                console.log(tree, "tree")
                const rootUser = tree.user;

                // Update root user
                await updateUser(rootUser, "root", rootUser, null);

                // Process Generation 1
                let generation1Users = await processGeneration(
                    tree.generation_1,
                    rootUser,
                    "generation_1",
                    2
                );

                // Update Generation 1 users
                for (const userId of generation1Users.selectedUsers) {
                    updateUser(userId, "generation_1", rootUser, rootUser);
                }

                // Process Generation 2
                let generation2Users = [];
                for (const userId of generation1Users.selectedUsers) {
                    const referredUsers = await getReferredUsers(userId);

                    console.log(referredUsers, "referredUsers")
                    const gen2Result = await processGeneration(
                        referredUsers,
                        rootUser,
                        "generation_2",
                        2,
                        userId
                    );
                    generation2Users.push(...gen2Result.selectedUsers);

                    // Update Generation 2 users
                    for (const gen2UserId of gen2Result.selectedUsers) {
                        updateUser(gen2UserId, "generation_2", rootUser, userId);
                    }
                }

                // Process Generation 3
                let overflowUsers = tree.generation_1.filter(
                    (userId) => !generation1Users.selectedUsers.includes(userId)
                );
                let generation3Users = [];
                for (const userId of generation2Users) {
                    const referredUsers = await getReferredUsers(userId);

                    console.log(referredUsers,"referredUsers")
                    const gen3Result = await processGeneration(
                        referredUsers,
                        rootUser,
                        "generation_3",
                        2,
                        userId
                    );
                    generation3Users.push(...gen3Result.selectedUsers);

                    // Update Generation 3 users
                    for (const gen3UserId of gen3Result.selectedUsers) {
                        await updateUser(gen3UserId, "generation_3", rootUser, userId);
                    }
                }

                // Handle overflow users into generation 3
                for (const overflowUserId of overflowUsers) {
                    await updateUser(overflowUserId, "generation_3", rootUser, null);
                }
            }

            console.log("Referral tree processing and user updates completed.");
        } catch (error) {
            console.error("Error processing referral tree:", error);
            throw error;
        }
    }

   
}

export default new GetReferralTreeController();

 /**
     * Process a specific generation with prioritization and overflow handling
     * @param {Array} userIds - User IDs for the generation
     * @param {String} rootUser - Root user ID
     * @param {String} generationType - Current generation type
     * @param {Number} maxUsers - Max users allowed in the generation
     * @param {String} refBy - Referrer ID
     * @returns {Object} Selected and overflow users for the generation
     */
 const processGeneration = async (userIds, rootUser, generationType, maxUsers, refBy = null) => {
    const selectedUsers = [];

    // Step 1: Prioritize users who referred others
    const priorityUsers = [];
    for (const userId of userIds) {
        const referralCount = await User.countDocuments({ referred_by: userId });
        if (referralCount > 0) {
            priorityUsers.push(userId);
        }
    }

    // Step 2: Select up to maxUsers from priority users
    selectedUsers.push(...priorityUsers.slice(0, maxUsers));

    // Step 3: Fill remaining slots with non-priority users
    if (selectedUsers.length < maxUsers) {
        const nonPriorityUsers = userIds.filter((userId) => !priorityUsers.includes(userId));
        const remainingSlots = maxUsers - selectedUsers.length;
        selectedUsers.push(...nonPriorityUsers.slice(0, remainingSlots));
    }

    // Store the selected users in the ReferralTree
    await updateReferralTree(generationType, rootUser, selectedUsers, refBy);

    return { selectedUsers };
};

const updateReferralTree = async (generationType, rootUser, selectedUsers, refBy) => {
    const updateData = {};

    // Set the selected users in the corresponding generation field
    if (generationType === "generation_1") {
        updateData.generation_1 = selectedUsers;
    } else if (generationType === "generation_2") {
        updateData.generation_2 = selectedUsers;
    } else if (generationType === "generation_3") {
        updateData.generation_3 = selectedUsers;
    } else if (generationType === "generation_4") {
        updateData.generation_4 = selectedUsers;
    } else if (generationType === "generation_5") {
        updateData.generation_5 = selectedUsers;
    }

    // Set root user and referrer if not already set
    if (!updateData.root_user) {
        updateData.root_user = rootUser;
    }
    if (refBy && !updateData.ref_by) {
        updateData.ref_by = refBy;
    }

    // Update the ReferralTree document
    await RefTree.updateOne(
        { user: rootUser },
        { $set: updateData },
        { upsert: true } // Create a new document if none exists
    );
};

/**
 * Fetch users referred by a specific user
 * @param {String} userId - User ID
 * @returns {Array} Referred users
 */
const getReferredUsers = async (userId) => {
    return await User.find({ referred_by: userId }).select("_id").lean();
};

/**
 * Update a user with referral details
 * @param {String} userId - User ID
 * @param {String} userType - User type (e.g., generation_1, generation_2, etc.)
 * @param {String} rootUser - Root user ID
 * @param {String} refBy - Referrer ID
 */
const  updateUser = async (userId, userType, rootUser, refBy) => {
    await User.updateOne(
        { _id: userId },
        {
            $set: {
                user_type: userType,
                root_user: rootUser,
                ref_by: refBy,
            },
        }
    );
}