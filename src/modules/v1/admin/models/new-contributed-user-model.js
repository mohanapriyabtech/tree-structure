import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/**
 * ContributedUserSchema
 * @description Contributed User model
 */

const ContributedUserSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    wallet_address: {
        type: String,
        unique: true
    },
    referral_code: {
        type: String
    },
    refer_count : {
        type: Number,
        default:0
    },
    referred_by :{
        type: ObjectId,
        ref: 'user'
    },   
    phone_number: {
        type: String,
        required: true
    },
    country_code: {
        type: String,
    },
    country: {
        type: String,
        required: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    amount: {
        type: String
    },
    user_type: {
        type: String
    },
    root_user: {
        type: ObjectId,
        ref: 'user'
    }, 
    ref_by: {
        type: ObjectId,
        ref: 'user'
    }, 
    rank: {
        type: Number
    },
    contribute_date: {
        type: Date,
        default: Date.now
    },
    created_at: {
        type: Date,
        default: Date.now
    }

}, { versionKey: false });
  
ContributedUserSchema.plugin(mongoosePaginate); 


export const ContributedUser = mongoose.model('contributed-user', ContributedUserSchema);