// const util = require('util');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const crypto = require('crypto');


// Token creation

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) => {

    const token = signToken(user._id); 

    const cookieOptions = {

        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 ),  // days to seconds
        //secure: true, // cookiee will be sent only in encrypted connection (https)
        httpOnly: true  // cookie cannot be accessed/modified by the browser

    };

    if(process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    // to remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {

    // const newUser = await User.create(req.body);

    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role 
    });

    const url = `${req.protocol}://${req.get('host')}/me`;                    // 'http://127.0.0.1:3000/me';
    await new Email(newUser, url).sendWelcome();
    console.log(url);
    createSendToken(newUser, 201, res);


    // jwt.io
    // const token = signToken(newUser._id);

    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // });
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exists

    if(!email || !password) {
        return next(new AppError('Please provide email and password !!', 400));
    }


    // 2) Check if user exists && password is correct

    // since password is unselected in userModel...inorder to mention it explicitly for checking we use select and +

    const user = await User.findOne({email: email}).select('+password');  //    const user = User.findOne({email});
    //const correct = await user.correctPassword(password, user.password);

    if(!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email id or password', 401));
    }

    // console.log(user);

    // 3) If everything is ok, send token to client

    createSendToken(user, 200, res);

    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token,
    // });
});



//----------------------------------------------------------------------------------------------//




exports.logout = (req, res) => {

    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });

};






//----------------------------------------------------------------------------------------------//







// middleware to check whether the user is logged in...before executing get all tours

exports.protect = catchAsync(async(req, res, next) => {

    let token;

    // 1) Getting token and check if token exists
    // Bearer ldasalkamdkgnkdalsaand

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {  // using cookies(jwt token) to login 
        token = req.cookies.jwt;
    }
    //console.log(token);  //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxZjQxYmIyNzBmYjMxMjFhODliNWYwZiIsImlhdCI6MTY0MzQzNzQyOSwiZXhwIjoxNjUxMjEzNDI5fQ.ehyKuEFcSVevnCC8oE_EBVTrCTp_daoEGd_UtU8A780

    if(!token) {
        return next(new AppError('You are not logged in..Please login to get access', 401));
    }

    // 2) Validate token (Verification of Token)  --> see to that the token is not expired
    // payload is the user _id
    // "verify" function used here is an asynchronous function so await is used
    // inorder to make it to return a promise we use util(promisify)

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //console.log(decoded);  //{ id: '61f41bb270fb3121a89b5f0f', iat: 1643437429, exp: 1651213429 }

    // 3) Check user if still exists (token may not be expired..but the user would have deleted his account)

    const currentUser = await User.findById(decoded.id);
    if(!currentUser) {
        return next(new AppError('The user belonging to the token does no longer exists', 401));
    }

    // 4) Check if user changed password after the token was issued
    // method going to be available in all documents (instance methods)  --> will be in userModels

    if(currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password!!...Please login again', 401));
    }

    // grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser  // res.locals.anyvariable  // for rendering

    next();
});






//-----------------------------------------------------------------------------------------------------------------------//




// protect middleware is only for protected routes...but this will run for each and every single request
// only for rendered pages    --->  no error in this middleware

exports.isLoggedIn = async(req, res, next) => {

    if (req.cookies.jwt) {  // using cookies(jwt token) to login 
        
        try {
            // 1) verify token

            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            // 2) Check user if still exists (token may not be expired..but the user would have deleted his account)

            const currentUser = await User.findById(decoded.id);
            if(!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            // method going to be available in all documents (instance methods)  --> will be in userModels

            if(currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // There is a logged in user

            res.locals.user = currentUser  // res.locals.anyvariable
            return next();
        } catch (err) {
        return next();

        }
    } 

    next();  // if no cookie

};




//-----------------------------------------------------------------------------------------------------------------------//









// Authorisation

exports.restrictTo = (...roles) => {  //...roles --> creates an array of all arguments that are specified
    
    return (req, res, next) => {
        // roles ['admin', 'lead-guide]
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have the permission to perform this action', 403));  // 403 -> forbidden
        }

        next();
    };
};

// password resetting

exports.forgotPassword = catchAsync(async(req, res, next) => {

// 1) Get user based on POSTED email

    const user = await User.findOne({ email: req.body.email });

    if(!user) {
        return next(new AppError('There is no user with this email address', 404)); //404 --> not found     
    }

// 2) Generate the random reset token

    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    // 3) Send it to the user's email

    // req.protocol  --->   http  or  https
    // req.get('host') --->  127.0.0.1

    try {    
        
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!!`;

        // await sendEmail ({
        //     email: user.email,
        //     subject: 'Your password reset token (Valid for 10 minutes)',
        //     message
        // });

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        });
    } catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the mail...Try again later!!!', 500));
    }
});


exports.resetPassword = catchAsync(async(req, res, next) => {
    
    // 1) Get user...based on the token

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    // 2) If token has not expired, and there is user, set the new password

    if(!user) {
        return next(new AppError('Token is invalid or expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();  // here validator is necessary to confirm the passwords

    // 3) Update changedPasswordAt property for the user

    //user.passwordChangedAt = Date.now();

    // 4) Log the user in, send JWT

    createSendToken(user, 200, res);

    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });

});


//----------------------------------------------------------------------------------//


// Updating password (MY CODE)

// exports.updatePassword = catchAsync(async(req, res, next) => {

//     // 1) Get user from collection

//     let user = await User.findOne({ email: req.body.email });

//     const { email, password } = req.body;

//     // 1) Check if email and password exists

//     if(!email || !password) {
//         return next(new AppError('Please provide email and password !!', 400));
//     }

//     // 2) Check if POSTED current password is correct
//     //  Check if user exists && password is correct
//     // since password is unselected in userModel...inorder to mention it explicitly for checking we use select and +

//     user = await User.findOne({email: email}).select('+password');  //    const user = User.findOne({email});
//     //const correct = await user.correctPassword(password, user.password);

//     if(!user || !await user.correctPassword(password, user.password)) {
//         return next(new AppError('Incorrect email id or password', 401));
//     }
    
//      // 3) If so, update password

//     if(req.body.passwordUpdate === req.body.passwordUpdateConfirm) {
//         user.password = req.body.passwordUpdate;
//         user.passwordConfirm = req.body.passwordUpdateConfirm;
//         user.passwordUpdate = undefined;
//         user.passwordUpdateConfirm = undefined;
//         await user.save(); 
//     } else {
//         return next(new AppError('Enter the password correctly'));
//     }

//     // 4) Log user in, send JWT

//     createSendToken(user, 200, res);

// });


//----------------------------------------------------------------------------------//




// Update password (according to lecture)

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
  
    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
      return next(new AppError('Your current password is wrong.', 401));
    }
  
    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!
  
    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  });
  





//--------------------------------------------------------------------------------//
