const bcrypt = require("bcrypt")
const saltRounds = 10

let hashpassword = (myPlaintextPassword) => {
    let salt = bcrypt.genSaltSync(saltRounds)
    let hash = bcrypt.hashSync(myPlaintextPassword, salt)
    return hash
}
let comparePassword = async (oldPassword, hashpassword) => {
    let res = await bcrypt.compare(oldPassword, hashpassword)
    try {

        return (res)

    } catch (err) {
        return err
    }
}

let comparePasswordSync = (myPlaintextPassword, hash) => {
    return bcrypt.compareSync(myPlaintextPassword, hash)
}
module.exports = {
    hashpassword: hashpassword,
    comparePassword: comparePassword,
    comparePasswordSync: comparePasswordSync
}