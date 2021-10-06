let errorHandler = (err, req, res, next) => {
    console.log("application error handler called");
    console.log(err);

    let apiResponse = { status: false, description: err.message, statusCode: 404, data: null }
    res.send(apiResponse)

}// end request ip logger function 

let notFoundHandler = (req, res, next) => {

    console.log("Route not found in the application");
    let apiResponse = { status: false, description: 'Route not found in the application', statusCode: 404, data: null }
    res.status(404).send(apiResponse)

}// end not found handler


module.exports = {
    globalErrorHandler: errorHandler,
    globalNotFoundHandler: notFoundHandler
}