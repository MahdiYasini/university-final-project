const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
    counted: {
        type: String,
        required: true,
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
