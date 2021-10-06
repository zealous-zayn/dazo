const { upload } = require('./../middlewares/multer');
const reelConroller = require('./../controllers/reelController');

module.exports.setRouter = (app) => {
    app.post('/upload-reel', upload.single('reelName'), reelConroller.uploadReel);

    app.get('/download-reel/:reelId', reelConroller.downloadReel);

    app.get('/get-all-reel', reelConroller.getReels);

    app.get('/reel-by-user/:userId', reelConroller.getReelsByUser)
}