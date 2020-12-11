const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    article: {
        type: String,
        required: true
    },
    summery: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
        default: '/images/postImages/defaultIamge'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }
},
{
    timestamps: true
});
module.exports  = mongoose.model('Post', PostSchema);
