const AppError = require('../utils/AppError')

const handleCastErrorDB = (err) => {
    const message = `Invalid query at "${err.path}: ${err.value}"`
    return new AppError(message, 400)
}

// Only email is unique
const handleDuplicateFieldsDB = (err) => {
    let message

    if (err.keyValue.email) {
        message = `${err.keyValue.email} has already been used`
    } else
        message =
            'Some property exishas already been used but could not be handled'

    return new AppError(message, 400)
}

const sendErrorInDevelopmentEnv = function (err, res) {
    res.status(err.statusCode).json({
        status: 'error',
        data: {
            error: err,
            errorName: err.name,
            message: err.message,
            stack: err.stack,
        },
    })
}

const sendErrorInProductionEnv = function (err, res) {
    if (err.code === 11000 && err.name === 'MongoServerError')
        err = handleDuplicateFieldsDB(err)
    else if (err.name === 'CastError') err = handleCastErrorDB(err)

    res.status(err.statusCode).json({
        status: 'error',
        data: {
            message: err.message,
        },
    })
}

exports.globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.message = err.message || 'Internal server error'

    if (process.env.NODE_ENV === 'development')
        sendErrorInDevelopmentEnv(err, res)
    else sendErrorInProductionEnv(err, res)
}

exports.invalidUrlHandler = (req, res, next) => {
    next(new AppError('Invalid request url', 404))
}
