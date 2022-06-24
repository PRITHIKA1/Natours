class AppError extends Error {  // since we want all appError objects to inherit from builtin error class
    constructor(message, statusCode) {

        super(message); // parent constructor

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';  // 4 -> fail 5 -> error

        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);  // points where error occurs
    }
}

module.exports = AppError;