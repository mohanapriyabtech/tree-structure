import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/**
 * RefBalanceSchema
 * @description 
 */

const RefBalanceSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  
    user_type: { type: String, required: true },
    rank: { type: String, required: true },  
    ref_type: { type: String, required: true },
    balance: { type: Number, default: 0 }, 
    created_at: { 
        type: Date, 
        default: Date.now 
    },
}, { versionKey: false });

export const RefBalance = mongoose.model('RefBalance', RefBalanceSchema);
