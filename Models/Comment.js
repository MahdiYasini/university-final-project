const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true,
        trim: true
    },
    userName: {
        type: String,
        required: true,
    },
    post: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post'
    }
},
{
    timestamps: true
});
module.exports  = mongoose.model('Comment', CommentSchema);
