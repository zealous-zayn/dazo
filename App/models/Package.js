'use strict'

const mongoose = require('mongoose');

let packageSchema = mongoose.Schema({
    packageId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true
    }, 
    amount: {
        type: Number,
        required: true
    },
    numberOfCoins: {
        type: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);