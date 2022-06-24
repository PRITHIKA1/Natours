const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');


exports.getCheckoutSession = catchAsync(async(req, res, next) => {

    // 1) Get the currently booked tour

    const tour = await Tour.findById(req.params.tourId);

    // 2) Create Checkout session

    const session = await stripe.checkout.sessions.create({ // create returns a promise so use await

        payment_method_types: ['card'], 
        
        // once payment is successful inorder to make a new payment...we are sending data using query 
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,

        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email, // email will be filled by default
        client_reference_id: req.params.tourId,
        line_items: [{
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            amount: tour.price * 100,
            currency: 'usd',
            quantity: 1
        }]
    });

    // 3) Create session as response

    res.status(200).json({
        status: 'success',
        session
    })

});

exports.createBookingCheckout = catchAsync(async(req, res, next) => {


    // This is UNSECURE bcoz everyone can book without paying if they know the query url

    const {tour, user, price} = req.query;

    if(!tour && !user && !price) {
        return next();
    }

    await Booking.create({tour, user, price});

    // since our url aftr payment consists of query which contains some info....inorder
    // to make it secured...we are going to redirect
    // original url : ${req.protocol}://${req.get('host')}/?tours=${req.params.tourId}&user=${req.user.id}&price=${tour.price}

    res.redirect(req.originalUrl.split('?')[0]);

    // once redirected goest to home page ('/') which is defined in viewRoutes now..again createBookCheckout middleware 
    // will be executed but the url will not contain tour user price data...sp if cond will be exected and returns to next middleware

});

// 1. Restriction for users to be able to only review a tour they booked.

exports.checkIfBooked = catchAsync(async(req, res, next) => {

    const booking = await Booking.find({user: req.user.id, tour: req.body.tour});

    if(booking.length === 0) {
        return next(new AppError('You must buy this tour to review it', 401));
    }

    next();
});


exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);






// CHALLENGES API

// - Implement restriction that users can only review a tour that they have actually booked;

// - Implement nested booking routes: /tours/:id/bookings and /users/:id/bookings;

// - Improve tour dates: add a participants and soldOut field to each date. A date then becomes an instance of the tour. Then, when a user boooks, they need to select one of the dates. A new booking will increase the number of participants in the date, until it is booked out(participants > maxGroupSize). So when a user wants to book, you need to check if tour on the selected date is still available;

// - Implement advanced authentication features: confirm user email, keep users logged in with refresh tokens, two-factor authentication, etc.



// CHALLENGES WEBSITE

// - Implement a sign up form, similar to login form;

// - On the tour detail page, if a user has taken a tour, allow them add a review directly on the website. Implement a form for this.

// - Hide the entire booking section on the detail page if current user has already booked the tour(also prevent duplicate bookings on the model);

// - Implement "like tour" functionality, with fav tour page;

// - On the user account page, implement the "My Reviews" page, wehere all reviews are displayed, and a user can edit them. (If you know REACT, this would be an amazing way to use the Natours API and train your skills!);

// - For administrators, implement all the "Manage" pages, where they can CRUD tours, users, reviews and bookings.