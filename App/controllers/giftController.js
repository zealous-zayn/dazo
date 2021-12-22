const mongoose = require('mongoose');
const nanoid = require('nanoid');
const asyncHandler = require('express-async-handler');

const utils = require('../utils/uploadS3');

const GiftModel = mongoose.model('Gift');
const UserModel = mongoose.model('User');
const UserGiftCollection = mongoose.model('UserGiftCollection')

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

let sendGift = asyncHandler(async(req,res)=>{
    let retrievedSenderDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.senderId) {
            let userDetails = await UserModel.findOne({ userId: req.body.senderId }).select('-password -__v -_id').lean()
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No Details Found of sender', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(userDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"senderId" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }));

    let retrievedReceiverDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.receiverId) {
            let userDetails = await UserModel.findOne({ userId: req.body.receiverId }).select('-password -__v -_id').lean()
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No Details Found of receiver', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(userDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"receiverId" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }));

    let retrievedGiftDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.giftId) {
            let giftDetails = await GiftModel.findOne({ giftId: req.body.giftId }).lean()
            if (!giftDetails) {
                let apiResponse = { status: false, description: 'No Details Found For gift', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(giftDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"giftId" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }));

    await new Promise(asyncHandler(async(resolve)=>{
        let newUserGiftCollection = await new UserGiftCollection({
            collectionId: nanoId(),
            senderId: retrievedSenderDetails.userId,
            receiverId: retrievedReceiverDetails.userId,
            giftId: retrievedGiftDetails.giftId,
            giftName: retrievedGiftDetails.giftName,
            giftType: retrievedGiftDetails.giftType,
            giftPrice: retrievedGiftDetails.giftPrice,
            giftImage: retrievedGiftDetails.giftImage
        })

        await newUserGiftCollection.save();
        if(retrievedSenderDetails.totalCoins >= retrievedGiftDetails.giftPrice){
        let coinsDetails = await UserModel.findOneAndUpdate({userId:req.body.senderId},{$inc:{totalCoins: -retrievedGiftDetails.giftPrice}},{new:true}).select('-_id totalCoins');
        let apiRespponse = {status: true, description: 'sender remaining coins', statusCode: 200, data: {numbeOfCoins:coinsDetails}};
        res.send(apiRespponse)
        } else {
            let apiRespponse = {status: true, description: 'sender do not have enough balance', statusCode: 200, data: {numbeOfCoins:retrievedSenderDetails.totalCoins}};
        res.send(apiRespponse)
        }

    }))
    
})

module.exports = {
    addGift,
    getAllGifts,
    sendGift
}