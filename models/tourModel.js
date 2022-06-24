//schema
const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'], // validator
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less than or equal to 40 characters'],
        minlength: [10, 'A tour name must have more or equal to 10 characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a number']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {  // only for strings
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either easy, medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val*10) / 10   // 4.666666  -> 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {   // (DOESNOT WORK FOR UPDATE...BCOZ WE USED THIS...WHICH POINTS TO CURRENT DOC)
        type: Number,
        validate: {
            validator: function(val) {   // val --> discount value 
            return val < this.price;
            },
            message: 'Discount price ({VALUE}) must be less than the regular price'
        }
    },
    summary: {
        type: String,
        trim: true,   //removes all white space at the beginning and end of string
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String], //array of strings
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false     //to hide when get request is executed
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },

    startLocation: {
        // GeoJsON --> to specify Geospatial info
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],    // 1st lat nxt long
        address: String,
        description: String
    },

    locations: [    
    {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],    // 1st long nxt lat
        address: String,
        description: String,
        day: Number
    }
    ],

    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'        
        }
    ]
        
    },

    {
        toJSON: { virtuals: true },   // mentioned explicitly
        toObject: { virtuals: true }
    }
);


// INDEX

tourSchema.index({price: 1, ratingsAverage: 1});
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});


// virtual functions will not be displayed...inorder to display it...
// it must be mentioned explicitly 

tourSchema.virtual('durationWeeks').get(function() {   // virtual properties (durationWeeks) cannot be used in query
    return this.duration / 7;
});


// to make reviews visible in the tours   ---->   Virtual populate

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',  // how ids are stored in review model
    localField: '_id'      // how ids are stored in tour(current) model
});



// middleware
// ( runs before .save() and .create() )

// Document middleware
tourSchema.pre('save', function(next) {   // pre save hook   save --> hook
    this.slug = slugify( this.name, { lower: true } );  // this points to currently processed document
    next();
});


// Embedding

// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id)); // result of this is promises
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });


// Child Referencing



// tourSchema.pre('save', function(next) {
//     console.log('Will save document.....');
//     next();
// });

// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// });



//middleware
// ( before query gets executed   (for find) )

// tourSchema.pre('find', function(next) {
//     this.find({ secretTour: { $ne: true } });
//     next();
// });

// tourSchema.pre('findOne', function(next) {
//     this.find({ secretTour: { $ne: true } });
//     next();
// });

// inorder to make it for all find ( hides secret tour for find )

tourSchema.pre(/^find/, function(next) {  // works find findOne findUpdate findDelete etc
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});


// to replace the referenced users with user data

tourSchema.pre(/^find/, function(next) {

    this.populate({     // --> populate is to replace the references with the user data
        path: 'guides',
        select: '-__v -passwordChangedAt'  // -->  removes(-) these fields while adding user data
    });

    next();
});



tourSchema.post(/^find/, function(doc, next) {  // works for find findOne findUpdate findDelete etc          
    console.log(`Query took ${Date.now() - this.start} milliseconds`);
    // console.log(doc);
    next();
});


// Aggregation middleware

// tourSchema.pre('aggregate', function(next) {

//     // unshift is used to add element in the beginning of the array
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     // console.log(this.pipeline());
//     next();
// });





//creating model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;





