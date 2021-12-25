const clinet = require('twilio')(process.env.accountSid, process.env.authToken);
console.log(process.env.accountSid, process.env.authToken)
module.exports.createTwilioOtp = async (mobileNumber) => {
    let verifyDetails = await clinet.verify.services.create({ friendlyName: 'Dazo Live OTP', codeLength: 4 })
    let createOtp = await clinet.verify.services(verifyDetails.sid)
        .verifications
        .create({ to: mobileNumber, channel: 'sms' })
    return createOtp
}


module.exports.verifyTwilioOtp = async (mobileNumber, otp, twilioSid) => {
    let verifyOtp = await clinet.verify.services(twilioSid)
        .verificationChecks
        .create({ to: mobileNumber, code: otp })
    return verifyOtp
}
