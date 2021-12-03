'use strict'

const mongoose = require('mongoose');

let liveSchema = mongoose.Schema({
    liveId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    invitePkList: [],
    liveTitle: {
        type: String,
        default:''
    },
    liveImage: {
        type: String,
        default:''
    },
    sponserBanner: {
        type: String,
        default:''
    },
    totalExperiance: {
        type: Number,
        default: 0
    },
    totalUserView: {
        type: Number,
        default: 0
    },
    totalLike: {
        type: Number,
        default: 0
    },
    totalComments: {
        type: Number,
        default: 0
    },
    totalGifts: {
        type: Number,
        default: 0
    },
    totalDuration: {
        type: Number,
        default: 0
    },
    startTime: {
        type: Number,
        default: null
    },
    endTime: {
        type: Number,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Live', liveSchema);