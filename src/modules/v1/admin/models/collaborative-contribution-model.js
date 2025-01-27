import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
const Schema = mongoose.Schema;

// Subschema for contributed users
const UserSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    country_code: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    wallet_address: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    }

}, { _id: false, versionKey: false });

/**
 * Collaborative Schema
 * @description 
 */

const CollaborativeContributionSchema = new Schema({

    transaction_hash: {
        type: String,
        required: true,
        unique: true
    },
    contributor_wallet: {
        type: String
    },
    amount: {
        type: String
    },
    date_of_transaction: {
        type: String
    },
    // sponsor_id: {
    //     type: String
    // },
    contributed_user: [UserSchema],
    network: {
        type: String
    },
    status: {
        type: Number,
        default: 1
    },
    
    created_at: {
        type: Date,
        default: Date.now
    }

}, { versionKey: false });

CollaborativeContributionSchema.plugin(mongoosePaginate);

export const CollaborativeContribution = mongoose.model('collaborative-contribution', CollaborativeContributionSchema);