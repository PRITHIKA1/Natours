const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


exports.getOverview = catchAsync(async(req, res, next) => {

    // 1) Get tour data from collections

    const tours = await Tour.find();

    // 2) Build Template
    // 3) Render that template using tour data from step 1

    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async(req, res, next) => {

    // 1) Get the data, for the requested tour (including reviews and guides)

    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if(!tour) { 
      return next(new AppError('There is no tour with that name.', 404));
    }

    // 2) Build Template

    // 3) Render template using data from step 1

    res
    .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    // )
    .render('tour', {  // tour --> template name
      title: `${tour.name}`,
      tour,
    });
});

exports.getLoginForm = catchAsync(async(req, res, next) => {
    res
    .status(200)
    .render('login', {  // tour --> template name
        title: 'Login into your account'
      });
});

exports.getAccount = catchAsync(async(req, res, next) => {
  res
  .status(200)
  .render('account', {  // tour --> template name
      title: 'Your account'
    });
});

exports.getMyTours = catchAsync(async(req, res, next) => {

  // 1) Find all bookings

  // contains all booking documents of the current user (only gives the tour id)
  const bookings = await Booking.find({ user: req.user.id});

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });

});

exports.updateUserData = catchAsync(async(req, res, next) => {

  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  },{
    new: true,
    runValidators: true
  });
  res
  .status(200)
  .render('account', {  // account --> template name
      title: 'Your account',
      user: updatedUser
    });
});

