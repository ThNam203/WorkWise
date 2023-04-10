const jwt = require('jsonwebtoken')

const User = require('../models/User')
const JWTBlacklist = require('../models/JWTBlacklist')
const AppError = require('../utils/AppError')
const asyncCatch = require('../utils/asyncCatch')

const getJWTToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7 days',
    })

const verifyAndGetJWTToken = (req, next) => {
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer')
    )
        return next(new AppError('Missing authorization header', 401))

    const token = req.headers.authorization.split(' ')[1]
    if (!token) next(new AppError('Missing JWT token', 401))

    jwt.verify(token, process.env.JWT_SECRET)
    return token
}

exports.signUp = asyncCatch(async (req, res, next) => {
    const newUser = await User.createNewUser(req)

    res.status(200).json({
        status: 'success',
        data: `created a new user with id ${newUser.id}`,
    })
})

exports.logIn = asyncCatch(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password)
        next(new AppError('Missing email or password', 400))

    const freshUser = await User.findOne({ email }).select('+password')
    if (!freshUser) next(new AppError('Email not found', 400))

    if (!(await freshUser.checkPassword(password, freshUser.password)))
        next(new AppError('Wrong password', 400))

    const jwtToken = getJWTToken(freshUser.id)
    res.status(200).json({
        status: 'success',
        data: {
            jwtToken: jwtToken,
        },
    })
})

exports.logOut = asyncCatch(async (req, res, next) => {
    const token = verifyAndGetJWTToken(req, next)

    const freshToken = await JWTBlacklist.findOne({ jwtData: token })

    if (freshToken)
        return next(
            new AppError(
                'Invalid request! Already logged out the user with this token',
                400
            )
        )

    await JWTBlacklist.create({ jwtData: token })
    const tokenData = jwt.decode(token)

    res.status(200).json({
        status: 'success',
        data: {
            message: `Logged out user with id ${tokenData.id}`,
        },
    })
})

// exports.changePassword = asyncCatch(async (req, res, next) => {
//     const token = verifyAndGetJWTToken(req, next)
//     const oldPassword = req.body.oldPassword

// })
