// review  / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty!!']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
},
    {
        toJSON: { virtuals: true },   // mentioned explicitly
        toObject: { virtuals: true }
    }
);


// Index

reviewSchema.index({ tour:1, user: 1}, { unique: true });

// reviews kooda tour name user name and photo varum

reviewSchema.pre(/^find/, function(next) {

    // this.populate({     // --> populate is to replace the references with the tour data
    //     path: 'tour',
    //     select: 'name'  
    // }).populate({     // --> populate is to replace the references with the user data
    //     path: 'user',
    //     select: 'name photo'  
    // });

    this.populate({     
        path: 'user',
        select: 'name photo'  
    });

    next();
    
});


reviewSchema.statics.calcAverageRatings = async function(tourId) {

    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    console.log(stats);   // [ { _id: 61f8d252f10a3d0974e851df, nRating: 2, avgRaiting: 4 } ]

    if(stats.length > 0){

        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
       
        });

    } else {

        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 0
        });
    }
};

reviewSchema.post('save', function(next) {

    // This points to current review

    this.constructor.calcAverageRatings( this.tour );
    //next();

});

// LECTURE (168)

reviewSchema.pre(/^findOneAnd/, async function(next) {

    this.r = await this.findOne();
    //console.log(this.r);
    next();

});

reviewSchema.post(/^findOneAnd/, async function() {

    await this.r.constructor.calcAverageRatings(this.r.tour);
    
});


//creating model 
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;