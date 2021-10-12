'use strict'

const mongoose = require('mongoose');

let likeSchema = mongoose.Schema({
    reelId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true
    },
    liked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Like', likeSchema);
