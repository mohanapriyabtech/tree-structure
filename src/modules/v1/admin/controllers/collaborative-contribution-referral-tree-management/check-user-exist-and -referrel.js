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

            const result = [];

            const collaborativeContributionList = await CollaborativeContribution.find({});

            for (const user of collaborativeContributionList) {

                const userExist = await User.findOne({ wallet_address: user.contributor_wallet })
                console.log("===========userExist============")
                if (userExist) {
            
                    if (user.contributed_user.length > 0) {

                        for (const contributedUser of user.contributed_user) {

                            console.log("contributedUser", contributedUser.wallet_address)
                            
                            const collaborationUserExist = await User.findOne({ wallet_address: contributedUser.wallet_address });

                            if (collaborationUserExist) {
                                console.log("User exist");
                                
                            } else {
                               
                                const contributedUserExist = await ContributedUser.findOne({ wallet_address: contributedUser.wallet_address });
                              
                                if (!contributedUserExist) {
                                    console.log("Contributed User not exist");
                                    await ContributedUser.create({
                                        wallet_address: contributedUser.wallet_address,
                                        email: contributedUser.email,
                                        phone_number: contributedUser.phone_number,
                                        country: contributedUser.country,  
                                        name: contributedUser.name,
                                        contribute_date: contributedUser.created_at,
                                        referred_by: userExist._id
                                    });

                                } else {
                                    console.log("Contributed User exist");
                                }
                            }
                        }
                    }
                } else {
                    console.log("User not exist")
                }
            }


            console.log('Referral tree has been created for collaborative contributors.');
            return responseHandler.successResponse(res, [], "Referral tree created successfully", 200);

        } catch(err) {
            console.error(err);
            return responseHandler.errorResponse(res, err);
        }
    }
}

export default new ReferralTreeCreateController();
