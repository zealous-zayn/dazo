const { upload } = require('./../middlewares/multer');
const reelConroller = require('./../controllers/reelController');

module.exports.setRouter = (app) => {
    app.post('/upload-reel', upload.single('reelName'), reelConroller.uploadReel);

    app.get('/download-reel/:reelId', reelConroller.downloadReel);

    app.get('/get-all-reel', reelConroller.getReels);

    app.get('/reel-by-user/:userId', reelConroller.getReelsByUser);

    app.post('/like-reel', reelConroller.likeReels);

    app.get('/get-reels-like-by-user', reelConroller.getReelLikeByUser);

    app.get('/view-reel', reelConroller.viewReels);

    app.post('/comment-reel', reelConroller.commentReel);

    app.get('/get-comment-by-reel/:reelId', reelConroller.getAllCommentsByReel)
}