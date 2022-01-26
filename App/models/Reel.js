'use strict'

const mongoose = require('mongoose');

let reelSchema = mongoose.Schema({
    reelId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        default:""
    },
    profilePic: {
        type: String,
        default: ""
    },
    caption: {
        type: String,
        default: ''
    },
    view: {
        type: Number,
        default: 0
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    downloadPath: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: String,
        required: true
    },
    fileSizeBytes: {
        type: String,
        required: true
    }

}, { timestamps: true })

module.exports = mongoose.model('Reel', reelSchema);
