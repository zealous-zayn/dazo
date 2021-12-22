const mongoose = require('mongoose');
const nanoid = require('nanoid');
const asyncHandler = require('express-async-handler');

const utils = require('../utils/uploadS3');

const PackageModel = mongoose.model('Package');
const UserModel = mongoose.model('User')

let nanoId = nanoid.customAlphabet('0123456789ABCDEFGabcdefg_', 8);

let addPackage = asyncHandler(async(req,res)=>{
    await new Promise(asyncHandler(async(resolve)=>{
        let packageDetails = await PackageModel.findOne({numberOfCoins:req.body.numberOfCoins})
        if(!packageDetails){
            let id = nanoId()
            let newPackage = await new PackageModel({
                packageId: id,
                type: req.body.type,
                packageImage: req.file ? (await utils.uploadFile(req.file, `packagepic/${id}`)).Location : "",
                amount: req.body.amount,
                numberOfCoins: req.body.numberOfCoins
            })

            await newPackage.save()
            let packageObj = newPackage.toObject();
            let apiResponse = { status: true, description: 'package created', statusCode: 200, data: packageObj };
            res.send(apiResponse);
        } else {
            let apiResponse = { status: false, description: 'Package Already Present With this number of coins', statusCode: 403, data: null };
            res.send(apiResponse);
        }
    }));
});

let getAllPackages = asyncHandler(async(req,res)=>{
    const result = await PackageModel.find().select(' -__v -_id').lean().exec()

    if (!result) {
        let apiResponse = { status: false, description: 'No Package Found', statusCode: 404, data: null }
        res.send(apiResponse)
    } else {

        let apiResponse = { status: true, description: 'All Package Details Found', statusCode: 200, data: result }
        res.send(apiResponse)
    }
});

let buyPackage = asyncHandler(async(req,res)=>{
    let retrievedUserDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.userId) {
            let userDetails = await UserModel.findOne({ userId: req.body.userId }).select('-password -__v -_id').lean()
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No Details Found or Your have not registered yet', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(userDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"userId" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }));

    let retrievedPackageDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.packageId) {
            let packageDetails = await PackageModel.findOne({ packageId: req.body.packageId }).lean()
            if (!packageDetails) {
                let apiResponse = { status: false, description: 'No Such Package Exist', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(packageDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"packageId" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }));

    await new Promise(asyncHandler(async(resolve)=>{
       let newUserDetails = await UserModel.findOneAndUpdate({userId:retrievedUserDetails.userId}, {$inc:{totalCoins:retrievedPackageDetails.numberOfCoins}}, {new:true}).select('-password -__v -_id')
       if (!newUserDetails) {
        let apiResponse = { status: false, description: 'Some Error occured please try again', statusCode: 404, data: null };
        res.send(apiResponse)
    } else {
        let apiResponse = { status: false, description: 'Package has been added successfully', statusCode: 200, data: newUserDetails };
        res.send(apiResponse)
    }
    }))
})

module.exports = {
    addPackage,
    getAllPackages,
    buyPackage
}