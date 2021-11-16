const userController = require('./../controllers/userController');

module.exports.setRouter = (app) => {
    app.post("/make-payment", userController.makePayment),

    app.post("/payment/success", userController.successPayment)

    app.post("/payment/fail", (req,res)=>{
        res.send({status: false, decription: "payment fail", statusCode: 500, data: null})
    })

}