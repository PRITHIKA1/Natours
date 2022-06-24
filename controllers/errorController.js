const AppError = require('./../utils/appError');
const mongoose = require('mongoose');

const handleCastErrorDB = err => {
    // console.log('Heloooooooooooooooooo');
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
};

const handleDuplicateFielsDB = err => {
    const value = err.keyValue[Object.keys(err.keyValue)[0]];
    // const value = err.keyValue.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: "${value}". Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJsonWebTokenErrorDB = err => {
    return new AppError('Invalid token...Please login again!!!', 401);
};

const handleTokenExpiredErrorDB = err => {
    return new AppError('Your token has expired...Please login again');
};

// while using postman   (in api)
const sendErrorDev = (err, req, res) => {  

    if(req.originalUrl.startsWith('/api')) {
            return res.status(err.statusCode).json({
                status: err.status,
                error: err,
                message: err.message,
                stack: err.stack
        });

    } 
// in rendered website
        // else {  
            // console.error('ERROR 💥', err);
            return res.status(err.statusCode).render('error', {  // error --> template name
            title: 'Something went wrong!',
            msg: err.message
        });

    // }
}


const sendErrorProd = (err, req, res) => {

    // A) IN API

    if(req.originalUrl.startsWith('/api')) {

    
        // Operational, trusted error: send message to client

        if (err.isOperational) {
            console.log(err.message);
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });

        // Programming or other unknown error: don't leak any other details

        } 
        
        // else {

            // 1) Log error
            // console.error('ERROR', err);

            // 2) Send generic message
            // console.error('ERROR 💥', err);
            return res.status(err.statusCode).render('error', {  // error --> template name
            title: 'Something went wrong!',
            msg: err.message
        });
        // }
    }

    // IN RENDERED WEBSITE

    if (err.isOperational) {
        console.log(err.message);
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });

    // Programming or other unknown error: don't leak any other details

    } 
    
    // else {

        // 1) Log error
        console.error('ERROR', err);

        // 2) Send generic message
        console.error('ERROR 💥', err);
            return res.status(err.statusCode).render('error', {  // error --> template name
            title: 'Something went wrong!',
            msg: err.message
        });
}


module.exports = (err, req, res, next) => {

    // console.log(err);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        //console.log(err.stack);
         
        sendErrorDev(err, req, res);
    } else {
        console.log('Into production mode.............');

        let error = Object.assign(err);

        if (error.name === "CastError") {
            error = handleCastErrorDB(error);
        }

         if (error.code === 11000) {
            error = handleDuplicateFielsDB(error);
        }

        if (error.name === "ValidationError") {
            error = handleValidationErrorDB(error);
        }

        if (error.name === "JsonWebTokenError") {
            error = handleJsonWebTokenErrorDB(error);
        }
        
        if (error.name === "TokenExpiredError") {
            error = handleTokenExpiredErrorDB(error);
        }

        sendErrorProd(error, req, res);

      }

};