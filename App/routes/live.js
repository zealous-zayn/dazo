const { upload } = require('./../middlewares/multer');
const liveController = require('./../controllers/liveController');

module.exports.setRouter = (app) =>{
    app.post('/go-live', upload.fields([{name: 'liveImage', maxCount: 1},{ name: 'sponserBanner', maxCount: 1}]), liveController.goLive)

    app.post('/end-live',liveController.endLive)

    app.get('/get-all-live-users', liveController.getAllLiveUsers)

    app.get('/get-followed-live-users', liveController.getFollowedLiveUsers)
}