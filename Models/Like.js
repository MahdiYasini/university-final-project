const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
    counted: {
        type: Number,
        required: true,
        default: 0
    },
    users: {
        type: Array,
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post'
    }
},
{
    timestamps: true
});
module.exports  = mongoose.model('Like', LikeSchema);
