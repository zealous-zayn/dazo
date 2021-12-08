'use strict'

const mongoose = require('mongoose');

let giftSchema = mongoose.Schema({
    giftId: {
        type: String,
        required: true,
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

module.exports = mongoose.model('Gift', giftSchema);