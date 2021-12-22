const packageController = require('./../controllers/packageController');
const { upload } = require('./../middlewares/multer');

module.exports.setRouter = (app) =>{
    app.get('/get-all-package', packageController.getAllPackages);

    app.post('/add-package', upload.single('packageImage') ,packageController.addPackage);

    app.post('/buy-package',packageController.buyPackage)
}