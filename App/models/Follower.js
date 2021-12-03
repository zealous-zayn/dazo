'use strict'

const mongoose = require('mongoose');

let FollowerSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    followerId: {
        type: String,
        required: true
    }, 
    followerName: {
        type: String,
        default: ''
    },
    followerPic: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Follower', FollowerSchema);