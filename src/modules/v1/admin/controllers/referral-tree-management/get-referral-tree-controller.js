import { responseHandler } from "../../../../../utils/response-handler";
import { User } from "../../../user/models/user-model";
import { RefTree } from "../../models/ref-tree-model";
import { ReferralTree } from "../../models/referral-tree-model";
import mongoose from 'mongoose'

class GetReferralTreeController {
    async processAndUpdateReferralTree(req,res) {
        try {
            const referralTrees = await ReferralTree.find(); 
            for (const tree of referralTrees) {

           
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
                console.log("======================")
                const refTrees = await RefTree.findOne({ user: rootUser }); 
                // Check and process Generation 2
                const isGen2Completed = await processAndCheckGeneration2(refTrees, rootUser);
                console.log("======================")

                if (isGen2Completed) {
                    // Proceed with next steps if Generation 2 is completed
                    console.log("Proceeding with next steps...");
                   

                    // Handle Overflow for Generation 2
                    await handleOverflow(
                        refTrees.generation_1_overflow,
                        "generation_1_overflow",
                        refTrees.generation_2,
                        rootUser
                    );

                    const isGen3Completed = await processAndCheckGeneration3(refTrees, rootUser);
                    console.log("======================")

                    if (!isGen3Completed) {
                        // Proceed with next steps if Generation 2 is completed
                        console.log("Proceeding with next steps...");
                    
                        await handleGeneration2Overflow(
                            refTrees.generation_2_overflow,
                            "generation_2_overflow",
                            refTrees.generation_3,
                            rootUser
                        );
                        return responseHandler.successResponse(res, [], "Referral tree created successfully", 200);
                    } else {
                         return responseHandler.successResponse(res, [], "Referral tree created successfully", 200);
                    }
                    
                } else {
                    console.log("Stopping further processing as Generation 2 is not completed.");
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
        // const referralCount = await User.countDocuments({ referred_by: userId });
        // if (referralCount > 0) {
            priorityUsers.push(userId);
        // }
    }

    // Step 2: Select up to maxUsers from priority users
    selectedUsers.push(...priorityUsers.slice(0, maxUsers));

    // Step 3: Fill remaining slots with non-priority users
    let overflowUsers = []; // To store users who are not selected
    if (selectedUsers.length < maxUsers) {
        const nonPriorityUsers = userIds.filter((userId) => !priorityUsers.includes(userId));
        const remainingSlots = maxUsers - selectedUsers.length;
        selectedUsers.push(...nonPriorityUsers.slice(0, remainingSlots));
        overflowUsers = nonPriorityUsers.slice(remainingSlots); // Store the remaining users
    } else {
        overflowUsers = userIds.filter((userId) => !selectedUsers.includes(userId)); // If slots are full, all others are overflow
    }

    console.log(selectedUsers, "selectedUsers")

    // Store the selected users in the ReferralTree
    await updateReferralTree(generationType, rootUser, selectedUsers, refBy);

    // Optionally store the overflow users in the ReferralTree or another structure
    await updateOverflowUsers(generationType, rootUser, overflowUsers);

    return { selectedUsers };
};

const updateReferralTree = async (generationType, rootUser, selectedUsers, refBy) => {
    const updateData = {};
    const pushField = {};

    // Use the $push operator to add users to the generation field
    if (generationType === "generation_1") {
        pushField.generation_1 = { $each: selectedUsers };
    } else if (generationType === "generation_2") {
        pushField.generation_2 = { $each: selectedUsers };
    } else if (generationType === "generation_3") {
        pushField.generation_3 = { $each: selectedUsers };
    } else if (generationType === "generation_4") {
        pushField.generation_4 = { $each: selectedUsers };
    } else if (generationType === "generation_5") {
        pushField.generation_5 = { $each: selectedUsers };
    }

    // Ensure the root_user and ref_by are set correctly (optional, for completeness)
    if (!updateData.root_user) {
        updateData.root_user = rootUser;
    }
    if (refBy && !updateData.ref_by) {
        updateData.ref_by = refBy;
    }

    // Update the ReferralTree document
    await RefTree.updateOne(
        { user: rootUser },
        {
            $push: pushField, // Push to the generation array
            $set: updateData, // Set root_user and ref_by if needed
        },
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



const updateOverflowUsers = async (generationType, rootUser, overflowUsers) => {
    if (!overflowUsers || overflowUsers.length === 0) return;

    const updateData = {};
    const field = `${generationType}_overflow`;

    // Add overflow users to a separate field for tracking
    updateData[field] = overflowUsers;

    await RefTree.updateOne(
        { user: rootUser },
        { $set: updateData },
        { upsert: true }
    );
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


/**
 * Handle Overflow Users
 * @param {Object} tree - ReferralTree document
 * @param {String} overflowSource - Overflow field (e.g., generation_1_overflow)
 * @param {String} targetGeneration - Target generation (e.g., generation_2)
 * @param {String} rootUser - Root user ID
 */
const handleGeneration2Overflow = async (overflowUsers, overflowSource, generation_3, rootUser) => {
    if (!overflowUsers.length) return;
    console.log(overflowUsers, "overflowUsers");

    const maxUsers = 2; 
    const completedUsers = []; 
    const result = []

    for (const userId of generation_3) {
        const referredUsers = await User.find({ referred_by: userId });
        const newReferredUsers = await User.find({ ref_by: userId });

        // Check if this user has referred the maximum number of users
        if (referredUsers.length >= maxUsers) {
            completedUsers.push(userId); 
        } else {
            while (referredUsers.length < maxUsers && overflowUsers.length > 0) {
                const overflowUserId = overflowUsers.shift(); 
                console.log(overflowUserId, "overflowUserId -1")
                await User.updateOne(
                    { _id: overflowUserId },
                    { ref_by: userId } 
                );
                
              
                const overflowUserIdObject = new mongoose.Types.ObjectId(overflowUserId); // Use 'new' to create an ObjectId instance

                console.log(overflowUserIdObject,"overflowUserIdObject")

                const a= await RefTree.updateOne(
                    { user: rootUser },
                    { $pull: { generation_2_overflow: overflowUserIdObject } } // Remove user from the array
                );

                console.log(overflowUserId,"overflowUserId")

                result.push(overflowUserId);
                console.log(`Assigned overflow user ${overflowUserId} to ${userId} and removed from generation_1_overflow.`);
            }
        }
        
    }

    for (const userId of generation_3) {
        const referredUsers = await User.find({ referred_by: userId });
        const newReferredUsers = await User.find({ ref_by: userId });

    // Check if this user has referred the maximum number of users
        if (newReferredUsers.length >= maxUsers) {
            completedUsers.push(userId); 
        } else {
            while (newReferredUsers.length < maxUsers && overflowUsers.length > 0) {
                const overflowUserId = overflowUsers.shift(); 
                console.log(overflowUserId, "overflowUserId -1")
                await User.updateOne(
                    { _id: overflowUserId },
                    { ref_by: userId } 
                );
                
            
                const overflowUserIdObject = new mongoose.Types.ObjectId(overflowUserId); // Use 'new' to create an ObjectId instance

                console.log(overflowUserIdObject,"overflowUserIdObject")

                const a= await RefTree.updateOne(
                    { user: rootUser },
                    { $pull: { generation_2_overflow: overflowUserIdObject } } // Remove user from the array
                );

                console.log(overflowUserId,"overflowUserId")

                result.push(overflowUserId);
                console.log(`Assigned overflow user ${overflowUserId} to ${userId} and removed from generation_1_overflow.`);
            }
        }
        }
    await RefTree.updateOne(
        { user: rootUser },
        { $push: { generation_3:  result} }
    );

    
    console.log(completedUsers, "Users who completed generation 2");

    if (completedUsers.length === generation_3.length) {
        console.log("All users in generation_3 have completed their referrals.");
    } else {
        console.log("Not all users in generation_3 have completed their referrals. Remaining overflow users:",overflowUsers);
    }

    // Handle any remaining overflow users
    if (overflowUsers.length > 0) {
        console.log("Remaining overflow users:", overflowUsers);
    }
};

const handleOverflow = async (overflowUsers, overflowSource, generation_2, rootUser) => {
    if (!overflowUsers.length) return;
    console.log(overflowUsers, "overflowUsers");

    const maxUsers = 2; 
    const completedUsers = []; 
    const result = []

    for (const userId of generation_2) {
        const referredUsers = await User.find({ referred_by: userId });

        // Check if this user has referred the maximum number of users
        if (referredUsers.length >= maxUsers) {
            completedUsers.push(userId); 
        } else {
            while (referredUsers.length < maxUsers && overflowUsers.length > 0) {
                const overflowUserId = overflowUsers.shift(); 
                console.log(overflowUserId, "overflowUserId -1")
                await User.updateOne(
                    { _id: overflowUserId },
                    { ref_by: userId } 
                );
                
              
                const overflowUserIdObject = new mongoose.Types.ObjectId(overflowUserId); // Use 'new' to create an ObjectId instance

                console.log(overflowUserIdObject,"overflowUserIdObject")

                const a= await RefTree.updateOne(
                    { user: rootUser },
                    { $pull: { generation_1_overflow: overflowUserIdObject } } // Remove user from the array
                );

                console.log(overflowUserId,"overflowUserId")

                result.push(overflowUserId);
                console.log(`Assigned overflow user ${overflowUserId} to ${userId} and removed from generation_1_overflow.`);
            }
        }
    }
    await RefTree.updateOne(
        { user: rootUser },
        { $push: { generation_3:  result} }
    );

    
    console.log(completedUsers, "Users who completed generation 2");

    if (completedUsers.length === generation_2.length) {
        console.log("All users in generation_2 have completed their referrals.");
    } else {
        console.log("Not all users in generation_2 have completed their referrals. Remaining overflow users:",overflowUsers);
    }

    // Handle any remaining overflow users
    if (overflowUsers.length > 0) {
        console.log("Remaining overflow users:", overflowUsers);
    }
};





const isGenerationCompleted = async (generationUsers, requiredReferrals) => {

    // Check if generationUsers is an empty array
    if (!generationUsers || generationUsers.length === 0) {
        return false; // No users to check, generation not completed
    }
    
    for (const userId of generationUsers) {
        const referralCount = await User.countDocuments({ referred_by: userId });
        const referCount = await User.countDocuments({ ref_by: userId });
     
        if (referralCount < requiredReferrals) {
            return false; 
        } else  if (referCount < requiredReferrals) {
            return false;
        }
    }
    return true; 
};

const processAndCheckGeneration2 = async (tree, rootUser) => {
    const generation2Users = tree.generation_1 || [];
    const requiredReferrals = 2; // Referrals required per user

    // Check if generation 2 is completed
    const isCompleted = await isGenerationCompleted(generation2Users, requiredReferrals);

    console.log(isCompleted,"isCompleted")

    if (isCompleted) {
        console.log("Generation 2 is completed.");
        return true; // Proceed to the next step
    } else {
        console.log("Generation 2 is not completed.");
        // Optionally, log incomplete users for debugging
        for (const userId of generation2Users) {
            const referralCount = await User.countDocuments({ referred_by: userId });
            if (referralCount < requiredReferrals) {
                console.log(`User ${userId} has only ${referralCount} referrals.`);
            }
        }
        return false; 
    }
};

const processAndCheckGeneration3 = async (tree, rootUser) => {
    const generation3Users = tree.generation_2 || [];
    const requiredReferrals = 2; // Referrals required per user

    // Check if generation 3 is completed
    const isCompleted = await isGenerationCompleted(generation3Users, requiredReferrals);

    console.log(isCompleted,"isCompleted")

    if (isCompleted) {
        console.log("Generation 3 is completed.");
        return true; // Proceed to the next step
    } else {
        console.log("Generation 3 is not completed.");
        // Optionally, log incomplete users for debugging
        for (const userId of generation3Users) {
            const referralCount = await User.countDocuments({ referred_by: userId });
            const referCount = await User.countDocuments({ ref_by: userId });
            if (referralCount < requiredReferrals) {
                console.log(`User ${userId} has only ${referralCount} referrals.`);
            } else if (referCount < requiredReferrals) {
                console.log(`User ${userId} has only ${referCount} referrals.`);
            }
        }
        return false; 
    }
};

