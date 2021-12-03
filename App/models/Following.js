'use strict'

const mongoose = require('mongoose');

let FollowingSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    followingId: {
        type: String,
        required: true
    }, 
    followingName: {
        type: String,
        default: ''
    },
    followingPic: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Following', FollowingSchema);