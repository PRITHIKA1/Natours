const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');


const router = express.Router({ mergeParams: true });  // /:tourId/reviews  --> to get access to tour id

// POST / tour / 3235579 / reviews
// GET  / tour / 24557f5 / reviews
// GET  / tour / 545fe54 / reviews / 2465fdd 

router.use(authController.protect);   // ingaye potachu so authController.protect keela iruka routes la remove pannirlam

router
    .route('/') 
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourUserIds, bookingController.checkIfBooked, reviewController.createReview);


router
    .route('/:id')
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview);


module.exports = router;