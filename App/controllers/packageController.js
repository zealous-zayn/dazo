const mongoose = require('mongoose');
const nanoid = require('nanoid');
const asyncHandler = require('express-async-handler');

const PackageModel = mongoose.model('Package');

let nanoId = nanoid.customAlphabet('0123456789ABCDEFGabcdefg_', 8);

let addPackage = asyncHandler(async(req,res)=>{
    await new Promise(asyncHandler(async(resolve)=>{
        let packageDetails = await PackageModel.findOne({numberOfCoins:req.body.numberOfCoins})
        if(!packageDetails){
            let newPackage = new PackageModel({
                packageId: nanoId(),
                type: req.body.type,
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

module.exports = {
    addPackage,
    getAllPackages
}