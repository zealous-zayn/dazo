const config = require('../../config')
const clinet = require('twilio')(config.accountSid, config.authToken);

module.exports.createTwilioOtp = async (mobileNumber) => {
    let verifyDetails = await clinet.verify.services.create({ friendlyName: 'Dazo Live OTP' })
    let createOtp = await clinet.verify.services(verifyDetails.sid)
        .verifications
        .create({ to: mobileNumber, channel: 'sms' })
    return createOtp
}


module.exports.verifyTwilioOtp = async (mobileNumber, otp, twilioSid) => {
    console.log(twilioSid)
    let verifyOtp = await clinet.verify.services(twilioSid.toString())
        .verificationChecks
        .create({ to: mobileNumber, code: otp })
    return verifyOtp
}
