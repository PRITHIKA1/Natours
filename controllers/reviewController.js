const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');


// exports.getAllReviews = catchAsync( async (req, res) => {

//     let filter = {};
//     if (req.params.tourId) {
//         filter = {
//             tour: req.params.tourId
//         };
//     }

//     const reviews = await Review.find(filter);

//         //SEND RESPONSE
//         res.status(200).json({
//         status: 'success',
//         results: reviews.length,
//         data: {
//             reviews
//         }
//     });
// });

// exports.getReview = catchAsync(async (req, res, next) => {

//     const review = await Review.findById(req.params.id); 

//     if (!review) {
//         return next(new AppError('No review found with that ID', 404));  // whenever sees next with parameter jumps directly to global handling middleware
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             review
//         }
//     });
// });


exports.setTourUserIds = (req, res, next) => {

    if(!req.body.tour) {
        req.body.tour = req.params.tourId;
    }

    if(!req.body.userr) {
        req.body.user = req.user.id;
    }

    next();

}


// exports.createReview = catchAsync(async (req, res, next) => {

//     // Allow nested routes

//     if(!req.body.tour) {
//         req.body.tour = req.params.tourId;
//     }

//     if(!req.body.userr) {
//         req.body.user = req.user.id;
//     }

//     const newReview = await Review.create(req.body);

//         res.status(201).json({
//             status: 'success',
//             data: {
//                 newReview
//             }
//         });
// });




exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);

    
