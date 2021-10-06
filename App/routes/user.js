const userController = require('./../controllers/userController');

module.exports.setRouter = (app) => {
    app.get('/get-all-users', userController.getAllUser);

    app.get('/get-single-user', userController.getSingleUser);

    app.post('/edit-user', userController.editUser);

    app.post('/sign-up', userController.signUpFunction);

    app.post('/login', userController.loginFunction);

    app.get('/generate-otp/:mobileNumber', userController.generateOtp);

    app.post('/verify-otp', userController.verifyOtp);
}