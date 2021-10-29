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
    password: {
        type: String
    },
    email: {
        type: String
    },
    mobileNumber: {
        type: Number
    }
}, { timestamps: true })


module.exports = mongoose.model('User', userSchema);