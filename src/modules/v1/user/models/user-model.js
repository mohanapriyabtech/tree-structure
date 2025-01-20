import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/**
 * UserSchema
 * @description User model
 */

const UserSchema = new Schema({

    first_name: {
        type: String,
        required: true
    },
    last_name: {
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
    trust_wallet_address: {
        type: String
    },
    receiving_wallet_address: {
        type: String
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
    contributor_level: {
        type: String,
        default: "Not Contributed yet"
    },
    contributor_level_fr: {
        type: String,
        default: "Not Contributed yet"
    },
    profile_image: {
        type: String
    },
    phone_number: {
        type: String,
        required: true
    },
    country_code: {
        type: String,
    },
    city : {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    otp_verified: {
        type: Number
    },
    otp: {
        type: Number,
    },
    signup_status: {
        type: Boolean
    },
    kyc_documents: {
        type: Array
    },
    kyc_verified: {
        type: Number,
        default: 0
    },
    language: {
        type: String
    },
    influencer_status: {
        type: Boolean,
        required: true
    },
    telegram: {
        type: String,
        required: function () { return this.influencer_status == true},
    },
    twitter: {
        type: String,
        required: function () { return this.influencer_status == true },
    },
    instagram: {
        type: String
    },
    tiktok: {
        type: String
    },
    youtube: {
        type: String
    },
    facebook: {
        type: String
    },
    language: {
        type: String
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    is_whitelisted: {
        type: Boolean,
        default: false
    },
    status: {
        type: Number,
        default: 1
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
    created_at: {
        type: Date,
        default: Date.now
    }

}, { versionKey: false });
  
UserSchema.plugin(mongoosePaginate);

UserSchema.index({ influencer_status: 1, is_deleted: 1, wallet_address: 1, email: 1, phone_number: 1, telegram: 1, twitter: 1, instagram: 1, tiktok: 1, youtube: 1, facebook: 1 });
UserSchema.index({ is_deleted: 1, wallet_address: 1, email: 1, phone_number: 1, telegram: 1, twitter: 1, instagram: 1, tiktok: 1, youtube: 1, facebook: 1 });
UserSchema.index({ is_deleted: 1 }); 
UserSchema.index({ country: 1, city: 1, phone_number: 1, email: 1, full_name: 1 }); 


export const User = mongoose.model('user', UserSchema);