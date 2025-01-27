import { responseHandler } from "../../../../../utils/response-handler";
import { User } from "../../../user/models/user-model";
import { CollaborativeContribution } from "../../models/collaborative-contribution-model";
import { ContributedUser } from "../../models/new-contributed-user-model";
import { ReferralTree } from "../../models/referral-tree-model";

class ReferralTreeCreateController {
  
    /**
      * @description   API to create referral tree
      * @param {*} req /api/v1/create-referral-tree
      * @param {*} res 
      */

    async update(req, res) {

        try {
            console.log("===============================")
            const result = [];

            // Step 1: Fetch direct users (those with no referred_by data)
            const directUsers = await User.find({ referred_by: null });

            for (const user of directUsers) {
                let referralTree = new ReferralTree({
                    user: user._id,
                    generation_1: [],
                    generation_2: [],
                    generation_3: [],
                    generation_4: [],
                    generation_5: [],
                    total_referrals: 0,
                });

               
               // Step 2: Fetch generation1 and generation1Collaboration data
                const generation1users = await User.find({ referred_by: user._id }).sort({ created_at: 1 });
                const generation1Collaboration = await ContributedUser.find({ referred_by: user._id }).sort({ contribute_date: 1 });

                // Step 3: Combine both datasets into a single array
                const combinedData = [...generation1users.map((user) => ({ 
                    type: 'user', 
                    id: user._id, 
                    createdAt: user.created_at 
                })), 
                ...generation1Collaboration.map((collab) => ({ 
                    type: 'collaboration', 
                    id: collab._id, 
                    createdAt: collab.contribute_date 
                }))];

                // Step 4: Sort the combined array by priority (earliest `createdAt` date first)
                const generation1 = combinedData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                // Step 5: Optionally group results by type for clarity (users and collaborations separately)
                // const prioritizedGeneration1 = prioritizedData.filter((entry) => entry.type === 'user');
                // const prioritizedCollaborations = prioritizedData.filter((entry) => entry.type === 'collaboration');


                for (const gen1User of generation1) {
                    referralTree.generation_1.push(gen1User._id);
                    referralTree.total_referrals++;

                    // // Step 3: Find users referred by Generation 1 users (Generation 2)
   
                    // const generation2users = await User.find({ referred_by: gen1User._id }).sort({ created_at: 1 });
                    // const generation2Collaboration = await ContributedUser.find({ referred_by: gen1User._id }).sort({ contribute_date: 1 });

                    // // Step 3: Combine both datasets into a single array
                    // const combinedData = [...generation2users.map((user) => ({ 
                    //     type: 'user', 
                    //     id: user._id, 
                    //     createdAt: user.created_at 
                    // })), 
                    // ...generation2Collaboration.map((collab) => ({ 
                    //     type: 'collaboration', 
                    //     id: collab._id, 
                    //     createdAt: collab.contribute_date 
                    // }))];
                    // // Step 4: Sort the combined array by priority (earliest `createdAt` date first)
                    // const generation2 = combinedData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));


                    // for (const gen2User of generation2) {
                    //     referralTree.generation_2.push(gen2User._id);
                    //     referralTree.total_referrals++;

                    //     // Step 4: Find users referred by Generation 2 users (Generation 3)
                    //     const generation3users = await User.find({ referred_by: gen2User._id }).sort({ created_at: 1 });
                    //     const generation3Collaboration = await ContributedUser.find({ referred_by: gen2User._id }).sort({ contribute_date: 1 });
    
                    //     // Step 3: Combine both datasets into a single array
                    //     const combinedData = [...generation3users.map((user) => ({ 
                    //         type: 'user', 
                    //         id: user._id, 
                    //         createdAt: user.created_at 
                    //     })), 
                    //     ...generation3Collaboration.map((collab) => ({ 
                    //         type: 'collaboration', 
                    //         id: collab._id, 
                    //         createdAt: collab.contribute_date 
                    //     }))];
                    //     // Step 4: Sort the combined array by priority (earliest `createdAt` date first)
                    //     const generation3 = combinedData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    //     for (const gen3User of generation3) {
                    //         referralTree.generation_3.push(gen3User._id);
                    //         referralTree.total_referrals++;

                    //         // Step 5: Repeat for Generation 4
                             
                    //         const generation4users = await User.find({ referred_by: gen3User._id }).sort({ created_at: 1 });
                    //         const generation4Collaboration = await ContributedUser.find({ referred_by: gen3User._id }).sort({ contribute_date: 1 });
        
                    //         // Step 3: Combine both datasets into a single array
                    //         const combinedData = [...generation4users.map((user) => ({ 
                    //             type: 'user', 
                    //             id: user._id, 
                    //             createdAt: user.created_at 
                    //         })), 
                    //         ...generation4Collaboration.map((collab) => ({ 
                    //             type: 'collaboration', 
                    //             id: collab._id, 
                    //             createdAt: collab.contribute_date 
                    //         }))];
                    //         // Step 4: Sort the combined array by priority (earliest `createdAt` date first)
                    //         const generation4 = combinedData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    //         for (const gen4User of generation4) {
                    //             referralTree.generation_4.push(gen4User._id);
                    //             referralTree.total_referrals++;

                    //             // Step 6: Repeat for Generation 5
                    //             const generation5users = await User.find({ referred_by: gen4User._id }).sort({ created_at: 1 });
                    //             const generation5Collaboration = await ContributedUser.find({ referred_by: gen4User._id }).sort({ contribute_date: 1 });
            
                    //             // Step 3: Combine both datasets into a single array
                    //             const combinedData = [...generation5users.map((user) => ({ 
                    //                 type: 'user', 
                    //                 id: user._id, 
                    //                 createdAt: user.created_at 
                    //             })), 
                    //             ...generation5Collaboration.map((collab) => ({ 
                    //                 type: 'collaboration', 
                    //                 id: collab._id, 
                    //                 createdAt: collab.contribute_date 
                    //             }))];
                    //             // Step 4: Sort the combined array by priority (earliest `createdAt` date first)
                    //             const generation5 = combinedData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    //             for (const gen5User of generation5) {
                    //                 referralTree.generation_5.push(gen5User._id);
                    //                 referralTree.total_referrals++;
                    //             }
                    //         }
                    //     }
                    // }
                }

                // Save the fully populated referral tree to the database
                await referralTree.save();

                result.push(referralTree);
                console.log("Saved referral tree:", referralTree);
            }

            console.log('Referral tree has been created for all users.');
            return responseHandler.successResponse(res, result, "Referral tree created successfully", 200);

        } catch(err) {
            console.error(err);
            return responseHandler.errorResponse(res, err);
        }
    }
}

export default new ReferralTreeCreateController();
