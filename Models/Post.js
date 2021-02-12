const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true
    },
    article: {
        type: String,
        required: true,
        trim: true
    },
    summery: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true,
        default: '/images/postImages/defaultImage/defaultImage.jpg'
    },
    articleKeys: {
        type: Array,
        default: ["سفر"]
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
