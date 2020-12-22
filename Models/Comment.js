const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post'
    }
},
{
    timestamps: true
});
module.exports  = mongoose.model('Comment', CommentSchema);
