import { responseHandler } from "../../../../../utils/response-handler";
import { User } from "../../../user/models/user-model";
import { ReferralTree } from "../../models/referral-tree-model";

class ReferralTreeCreateController {
  
    /**
      * @description   API to create referral tree
      * @param {*} req /api/v1/create-referral-tree
      * @param {*} res 
      */

    async update(req, res) {

        try {

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

                // Step 2: Find users referred by this direct user (Generation 1)
                const generation1 = await User.find({ referred_by: user._id });

                for (const gen1User of generation1) {
                    referralTree.generation_1.push(gen1User._id);
                    referralTree.total_referrals++;

                    // Step 3: Find users referred by Generation 1 users (Generation 2)
                    const generation2 = await User.find({ referred_by: gen1User._id });

                    for (const gen2User of generation2) {
                        referralTree.generation_2.push(gen2User._id);
                        referralTree.total_referrals++;

                        // Step 4: Find users referred by Generation 2 users (Generation 3)
                        const generation3 = await User.find({ referred_by: gen2User._id });

                        for (const gen3User of generation3) {
                            referralTree.generation_3.push(gen3User._id);
                            referralTree.total_referrals++;

                            // Step 5: Repeat for Generation 4
                            const generation4 = await User.find({ referred_by: gen3User._id });

                            for (const gen4User of generation4) {
                                referralTree.generation_4.push(gen4User._id);
                                referralTree.total_referrals++;

                                // Step 6: Repeat for Generation 5
                                const generation5 = await User.find({ referred_by: gen4User._id });

                                for (const gen5User of generation5) {
                                    referralTree.generation_5.push(gen5User._id);
                                    referralTree.total_referrals++;
                                }
                            }
                        }
                    }
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
