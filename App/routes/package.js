const packageController = require('./../controllers/packageController');

module.exports.setRouter = (app) =>{
    app.get('/get-all-package', packageController.getAllPackages);

    app.post('/add-package', packageController.addPackage);
}