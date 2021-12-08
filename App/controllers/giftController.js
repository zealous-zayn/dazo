const mongoose = require('mongoose');
const nanoid = require('nanoid');
const asyncHandler = require('express-async-handler');

const utils = require('../utils/uploadS3');

const GiftModel = mongoose.model('Gift');

let nanoId = nanoid.customAlphabet('0123456789ABCDEFGabcdefg_', 8);

let addGift = asyncHandler(async (req,res)=>{
    await new Promise(asyncHandler(async(resolve)=>{
        let giftDetails = await GiftModel.findOne({giftName:req.body.giftName})
        if(!giftDetails){
            let id = nanoId()
            let newGift = await new GiftModel({
                giftId: id,
                giftName: req.body.giftName,
                giftType: req.body.giftType,
                giftPrice: req.body.giftPrice,
                giftImage: req.file ? (await utils.uploadFile(req.file, `giftpic/${id}`)).Location : ""
            })

            await newGift.save()
            let giftObj = newGift.toObject();
            let apiResponse = { status: true, description: 'package created', statusCode: 200, data: giftObj };
            res.send(apiResponse);
        } else {
            let apiResponse = { status: false, description: 'Gift Already Present With this name', statusCode: 403, data: null };
            res.send(apiResponse);
        }
    }));
})

let getAllGifts = asyncHandler(async(req,res)=>{
    const result = await GiftModel.find().select(' -__v -_id').lean().exec()

    if (!result) {
        let apiResponse = { status: false, description: 'No Gift Found', statusCode: 404, data: null }
        res.send(apiResponse)
    } else {

        let apiResponse = { status: true, description: 'All Gift Details Found', statusCode: 200, data: result }
        res.send(apiResponse)
    }
});

module.exports = {
    addGift,
    getAllGifts
}