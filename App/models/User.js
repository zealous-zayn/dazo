'use strict'

const mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    userId: {
        type: String,
        index: true,
        unique: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    gender: {
        type: String,
    },
    profilePic: {
        type: String
    },
    userTitle: {
       type: String,
       default: 'newbee' 
    },
    userFrame:{
        type: String,
        default:''
    },
    password: {
        type: String
    },
    email: {
        type: String
    },
    mobileNumber: {
        type: Number
    },
    isLive: {
        type: Boolean,
        default: false
    },
    lifeTimeExperiance: {
        type: Number,
        default:0
    },
    totalCoins: {
        type: Number,
        default: 0
    }
}, { timestamps: true })


module.exports = mongoose.model('User', userSchema);