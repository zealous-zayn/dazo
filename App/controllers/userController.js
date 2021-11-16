const mongoose = require('mongoose');
const nanoid = require('nanoid');
const asyncHandler = require('express-async-handler');

const passwordLib = require('./../libs/generatePasswordLib');
const validateInput = require('./../libs/paramValidation');
const twilioApi = require('../libs/twilioSmsLib');
const utils = require('../utils/uploadS3');
const paymentService = require('./../services/payu');

const UserModel = mongoose.model('User');
const PackageModel = mongoose.model('Package');
const FollowerModel = mongoose.model('Follower');
const FollowingModel = mongoose.model('Following')

let nanoId = nanoid.customAlphabet('0123456789ABCDEFGabcdefg_', 8);

let otpGenerator = () => {
    let otp = '';
    let digits = '0123456789';

    for (let i = 1; i <= 4; i++) {
        let index = Math.floor(Math.random() * (digits.length));
        otp = otp + digits[index];
    }

    return parseInt(otp)
}

let getAllUser = asyncHandler(async (req, res) => {
    const result = await UserModel.find().select(' -password -__v -_id').lean().exec()

    if (!result) {
        let apiResponse = { status: false, description: 'No User Found', statusCode: 404, data: null }
        res.send(apiResponse)
    } else {

        let apiResponse = { status: true, description: 'All User Details Found', statusCode: 200, data: result }
        res.send(apiResponse)
    }

})// end get all users

let getSingleUser = asyncHandler(async (req, res) => {
    const result = await UserModel.findOne({ 'userId': req.params.getUserId }).select('-password -__v -_id -totalCoins -mobileNumber -email').lean().exec();
    if (!result) {
        let apiResponse = { status: false, description: 'No User Found', statusCode: 404, data: null };
        res.send(apiResponse)
    } else {
        let followerCount = await FollowerModel.countDocuments({userId : req.params.getUserId});
        let followingCount = await FollowingModel.countDocuments({userId: req.params.getUserId});
        result.totalFollower = followerCount;
        result.totalFollowing = followingCount;
        result.isFollowing = await FollowingModel.findOne({userId:req.params.fromUserId, followingId: req.params.getUserId}) ? true : false;
        let apiResponse = { status: true, description: 'User Details Found', statusCode: 200, data: result }
        res.send(apiResponse)
    }
})// end get single user

let editUser = asyncHandler(async (req, res) => {

    let options = req.body;
    const result = await UserModel.findOneAndUpdate({ 'userId': req.body.userId }, options).exec()
    if (!result) {
        let apiResponse = { status: false, description: 'No User Found', statusCode: 404, data: null }
        res.send(apiResponse);
    } else {
        let apiResponse = { status: true, description: 'User details edited', statusCode: 200, data: result }
        res.send(apiResponse);
    }

})// end edit user


let signUpFunction = asyncHandler(async (req, res) => {
    await new Promise(asyncHandler(async (resolve) => {
        if (req.body.email) {
            if (!validateInput.Email(req.body.email)) {
                let apiResponse = { staus: false, description: 'Email Does not meet the requirement', statusCode: 400, data: null }
                res.send(apiResponse);
            } else if (!req.body.password) {
                let apiResponse = { status: false, description: 'password parameter is missing', statusCode: 400, data: null }
                res.send(apiResponse);
            } else {
                resolve(req);
            }
        } else {
            let apiResponse = { status: false, description: 'One or More Parameter(s) is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }))
    await new Promise(asyncHandler(async () => {
        let retrievedUserDetails = await UserModel.findOne({ "$or": [{ email: req.body.email }, { mobileNumber: req.body.mobileNumber }] }).exec();
        if (!retrievedUserDetails) {
            let newUser = new UserModel({
                userId: nanoId(),
                firstName: req.body.firstName,
                lastName: req.body.lastName || '',
                gender: req.body.gender.toLowerCase(),
                email: req.body.email.toLowerCase(),
                mobileNumber: req.body.mobileNumber.length == 10 ? req.body.mobileNumber :
                    (function () { throw new Error("invalid mobile nummber ") }()),
                password: passwordLib.hashpassword(validateInput.Password(req.body.password))
            })
            newUser.save()
            let newUserObj = newUser.toObject();
            delete newUserObj.password;
            let apiResponse = { status: true, description: 'User created', statusCode: 200, data: newUserObj };
            res.send(apiResponse);
        } else {
            let apiResponse = { status: false, description: 'User Already Present With this Email or Mobile number', statusCode: 403, data: null };
            res.send(apiResponse);
        }
    }))

})// end user signup function 


let loginFunction = asyncHandler((async (req, res) => {
    let retrievedUserDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.email) {
            let userDetails = await UserModel.findOne({ email: req.body.email })
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No Details Found or Your email might not be registered', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(userDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"email" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }))
    let userDetails = await new Promise(asyncHandler(async (resolve) => {
        let isMatch = await passwordLib.comparePassword(req.body.password, retrievedUserDetails.password)

        if (isMatch) {
            let followerCount = await FollowerModel.countDocuments({userId : retrievedUserDetails.userId});
            let followingCount = await FollowingModel.countDocuments({userId: retrievedUserDetails.userId});
            let retrievedUserDetailsObj = retrievedUserDetails.toObject();
            retrievedUserDetailsObj.totalFollower = followerCount;
            retrievedUserDetailsObj.totalFollowing = followingCount;
            delete retrievedUserDetailsObj._id
            delete retrievedUserDetailsObj.otp
            delete retrievedUserDetailsObj.__v
            resolve(retrievedUserDetailsObj)
        } else {
            let apiResponse = { statuus: false, description: 'Wrong Password.Login Failed', statusCode: 400, data: null };
            res.send(apiResponse)
        }
    }))
    let apiResponse = { status: true, description: 'Login Successful', statusCode: 200, data: userDetails }
    res.send(apiResponse)
}))

let generateOtp = asyncHandler(async (req, res) => {
    await new Promise(asyncHandler(async (resolve) => {
        if (req.params.mobileNumber) {
            let userDetails = await UserModel.findOne({ mobileNumber: req.params.mobileNumber })
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No Details Found or Your mobile number not registered', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(userDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"mobile number" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }))

    let details = await new Promise(asyncHandler(async (resolve) => {
        let userDetails = await UserModel.findOne({ mobileNumber: req.params.mobileNumber }).select('-__v -password -_id');
        let createOtp = await twilioApi.createTwilioOtp(`+91${req.params.mobileNumber}`)
        let userDetailsObj = userDetails.toObject()
        userDetailsObj.twilioSid = createOtp.serviceSid;
        resolve(userDetailsObj)
    }))
    let apiResponse = { status: true, description: 'OTP sent succesfully', statusCode: 200, data: details }
    res.send(apiResponse)

})

let verifyOtp = (asyncHandler(async (req, res) => {
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
    }))
    let otpVerifyDetails = await twilioApi.verifyTwilioOtp(`+91${retrievedUserDetails.mobileNumber}`, req.body.otp, req.body.twilioSid)
    console.log(otpVerifyDetails)
    if (otpVerifyDetails.status === 'approved') {
        let apiResponse = { status: true, description: 'OTP verified succesfully', statusCode: 200, data: retrievedUserDetails }
        res.send(apiResponse)
    } else {
        let apiResponse = { status: false, description: 'Incorrect OTP or OTP may expire', statusCode: 200, data: null }
        res.send(apiResponse)
    }

}))

let deleteUser = asyncHandler(async (req, res) => {
    let retrievedUserDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.params.userId) {
            let userDetails = await UserModel.findOne({ userId: req.params.userId }).select('-password -__v -_id').lean()
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
    }))

    let details = await UserModel.findOneAndDelete({ userId: retrievedUserDetails.userId })
    let apiResponse = { status: true, description: 'user deleted successfully', statusCode: 200, data: details };
    res.send(apiResponse)
})

let uploadProfilePic = asyncHandler(async (req, res) => {
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
    }))

    await new Promise(asyncHandler(async () => {
        let uploadDetails = await utils.uploadFile(req, res)
        let result = await UserModel.findOneAndUpdate({ 'userId': retrievedUserDetails.userId }, { profilePic: uploadDetails.Location }, { new: true }).exec()
        if (!result) {
            let apiResponse = { status: false, description: 'No User Found', statusCode: 404, data: null }
            res.send(apiResponse);
        } else {
            let apiResponse = { status: true, description: 'User details edited', statusCode: 200, data: result }
            res.send(apiResponse);
        }
    }))
})

let makePayment = asyncHandler(async(req,res)=>{
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

    await new Promise(asyncHandler(async(resolve)=>{
        let packageDetails = await PackageModel.findOne({packageId:req.body.packageId});
        let data = {
            firstName: retrievedUserDetails.firstName,
            email: retrievedUserDetails.email,
            phone: retrievedUserDetails.mobileNumber,
            amount: packageDetails.amount,
            userId: retrievedUserDetails.userId,
            packageId: packageDetails.packageId
        };
        let paymentLink = await paymentService.paymentMethod(data);
        let apiResponse = {status: true, description: "payment link generated", statusCode: 200, link: paymentLink};
        res.send(apiResponse);
    }));
});

let successPayment = asyncHandler(async(req,res)=>{
    let packageDetails = await PackageModel.findOne({packageId: req.query.packageId});
    let userDetails = await UserModel.findOneAndUpdate({userId: req.query.userId},{$inc : {totalCoins: packageDetails.numberOfCoins}}, {new: true});
    let apiResponse = {status: true, description: "payment success response", statusCode: 200, data: {totalNumberOfCoins: userDetails.totalCoins}}
    res.send(apiResponse)
})

let addFollower = asyncHandler(async(req,res)=>{
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

    let retrievedToFollowUserDetails = await new Promise(asyncHandler(async (resolve) => {
        if (req.body.toFollowUserId) {
            let userDetails = await UserModel.findOne({ userId: req.body.toFollowUserId }).select('-password -__v -_id').lean()
            if (!userDetails) {
                let apiResponse = { status: false, description: 'No Details Found for user to whom you want to follow', statusCode: 404, data: null };
                res.send(apiResponse)
            } else {
                resolve(userDetails)
            }
        } else {
            let apiResponse = { status: false, description: '"userId" parameter is missing', statusCode: 400, data: null }
            res.send(apiResponse)
        }
    }));

    await new Promise(asyncHandler(async (resolve)=>{
        let newFollowerDetails = new FollowerModel({
            userId: req.body.toFollowUserId,
            followerId: retrievedUserDetails.userId,
            followerName: retrievedUserDetails.firstName + ' ' + retrievedUserDetails.lastName,
            followerPic: retrievedUserDetails.profilePic 
        })

        await newFollowerDetails.save();

        let newFollowingDetails = new FollowingModel({
            userId: req.body.userId,
            followingId: retrievedToFollowUserDetails.userId,
            followingName: retrievedToFollowUserDetails.firstName + ' ' + retrievedToFollowUserDetails.lastName,
            followingPic: retrievedToFollowUserDetails.profilePic
        })

        await newFollowingDetails.save();
        let obj = retrievedToFollowUserDetails;
        obj.isFollowing = true;
        delete obj.password
            delete obj._id
            delete obj.otp
            delete obj.__v
            let apiResponse = { status: true, description: 'followed successfully', statusCode: 200, data: obj };
            res.send(apiResponse);
    }))
})

module.exports = {
    getAllUser,
    getSingleUser,
    editUser,
    signUpFunction,
    loginFunction,
    generateOtp,
    verifyOtp,
    deleteUser,
    uploadProfilePic,
    makePayment,
    successPayment,
    addFollower
}