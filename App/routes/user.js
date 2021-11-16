const userController = require('./../controllers/userController');
const { upload } = require('./../middlewares/multer');

module.exports.setRouter = (app) => {
    app.get('/get-all-users', userController.getAllUser);

    app.get('/get-single-user/:getUserId/:fromUserId', userController.getSingleUser);

    app.post('/edit-user', userController.editUser);

    app.post('/sign-up', userController.signUpFunction);

    app.post('/login', userController.loginFunction);

    app.get('/generate-otp/:mobileNumber', userController.generateOtp);

    app.post('/verify-otp', userController.verifyOtp);

    app.get('/delete-user/:userId', userController.deleteUser);

    app.post('/upload-profile-pic', upload.single('profilePic'), userController.uploadProfilePic);

    app.post('/add-follower', userController.addFollower)
}