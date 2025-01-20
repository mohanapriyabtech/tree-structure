import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

/**
 * RefTreeSchema
 * @description 
 */

const RefTreeSchema = new Schema({
    user: { 
        type: ObjectId, 
        ref: 'user', 
        required: true
    },
    generation_1: [{
        type: ObjectId,
        ref: 'user'
    }],
    generation_2: [{
        type: ObjectId,
        ref: 'user'
    }],
    generation_3: [{
        type: ObjectId,
        ref: 'user'
    }],
    generation_4: [{
        type: ObjectId,
        ref: 'user'
    }],
    generation_5: [{
        type: ObjectId,
        ref: 'user'
    }],
    rank: {
        type: Number
    },
    total_referrals: { 
        type: Number, 
        default: 0 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    },
}, { versionKey: false });

export const RefTree = mongoose.model('RefTree', RefTreeSchema);
