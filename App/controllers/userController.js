const mongoose = require('mongoose');
const nanoid = require('nanoid');
const asyncHandler = require('express-async-handler');

const passwordLib = require('./../libs/generatePasswordLib');
const validateInput = require('./../libs/paramValidation');
const twilioApi = require('../libs/twilioSmsLib');

const UserModel = mongoose.model('User');

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
    const result = await UserModel.findOne({ 'userId': req.params.userId }).select('-password -__v -_id').lean().exec();
    if (!result) {
        let apiResponse = { status: false, description: 'No User Found', statusCode: 404, data: null };
        res.send(apiResponse)
    } else {
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
            let retrievedUserDetailsObj = retrievedUserDetails.toObject()
            delete retrievedUserDetailsObj.password
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
        if (req.body.userId) {
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

module.exports = {
    getAllUser,
    getSingleUser,
    editUser,
    signUpFunction,
    loginFunction,
    generateOtp,
    verifyOtp,
    deleteUser
}