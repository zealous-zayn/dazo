'use strict'

const mongoose = require('mongoose');

let commentSchema = mongoose.Schema({
    commentId: {
        type: String,
        required: true,
        unique: true
    },
    reelId: {
        type: String,
        required: true
    }, userId: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);