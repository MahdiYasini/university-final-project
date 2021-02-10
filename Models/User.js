const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        required: true,
        default: '/images/profileImages/defaultImage/profile.png'
    },
    description: {
        type: String,
        default: "یه ماجرا جو"
    },
    lastActivity: {
        type : Date, 
        default: Date.now
    },
    suspend: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
});
module.exports = mongoose.model('User', UserSchema);
