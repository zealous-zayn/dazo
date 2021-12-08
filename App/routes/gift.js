const giftController = require('./../controllers/giftController');

module.exports.setRouter = (app) =>{
    app.get('/get-all-gift', giftController.getAllGifts);

    app.post('/add-gift', giftController.addGift);
}