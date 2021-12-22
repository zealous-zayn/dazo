'use strict'

const mongoose = require('mongoose');

let userGiftCollectionSchema = mongoose.Schema({
    collectionId: {
        type: String,
        required: true,
    },
    senderId: {
        type: String,
        required: true
    },
    receiverId: {
        type: String,
        required: true
    },
    giftId: {
        type: String,
        required: true
    },
    giftName: {
        type: String,
        default:""
    },
    giftType: {
        type: String,
        default:""
    },
    giftPrice: {
        type: Number,
        default: 0
    },
    giftImage: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model('UserGiftCollection', userGiftCollectionSchema);