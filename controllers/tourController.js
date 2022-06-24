//route handlers
const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/apiFeatures');
const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');


const multerStorage = multer.memoryStorage();


// to check whether the document is an image

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image !! Please upload only image', 400), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount:1},
    {name: 'images', maxcount: 3}
]);


// OTHER METHOD
// upload.single('image')  --> req.file
// upload.array('images', 5) --> req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    // console.log(req.files);

    if(!req.files.imageCover || !req.files.images) {
        return next();
    }

    // 1) Cover image

    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90}) // reading img in memory and resizing it
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Images

    req.body.images = [];

    await Promise.all( // await all of them using prome.all
        req.files.images.map(async(file, i) => {  // map is use to save promises
            const fileName = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
            await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({quality: 90}) // reading img in memory and resizing it
            .toFile(`public/img/tours/${fileName}`);

            req.body.images.push(fileName);
            
        }));

    next();

});

// imageCover: [
//     {
//       fieldname: 'imageCover',
//       originalname: 'new-tour-1.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       buffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 48 00 48 00 00 ff e1 00 8c 
// 45 78 69 66 00 00 4d 4d 00 2a 00 00 00 08 00 05 01 12 00 03 00 00 00 01 00 01 ... 1857218 more bytes>,
//       size: 1857268
//     }



//127.0.0.1:3000/api/v1/tours?limit=5&sort=-ratingAverage,price
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//     console.log(`Tour id is: ${val}`);
//     if(req.params.id > tours.length){
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID'
//         });
//     }
//     next();
// }

// exports.checkBody = (req, res, next) => {
//     if(!req.body.name || !req.body.price){
//         return res.status(400).json({
//             status: 'fail',
//             message: 'Missing name or price'
//         });        
//     }
//     next();
// }



//--------------------------------------------------------//


exports.getAllTours = factory.getAll(Tour);


//--------------------------------------------------------//



// exports.getAllTours = catchAsync(async (req, res, next) => {
//     // console.log(req.requestTime);
//     // try {
//     // (maximise panni paar ) const tours = await Tour.find();  //no parameters means takes all tours


//     // 1A) FILTERING
//     //BUILD QUERY   ( VIDEO : 94 )
    
//     // const queryObj = { ...req.query };
//     // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//     // excludedFields.forEach( el => delete queryObj[el]);

//     // // 1B) ADVANCED FILTERING ( VIDEO : 95 )
//     // let queryStr = JSON.stringify(queryObj);
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//     // // console.log(JSON.parse(queryStr));

//     // // const query = Tour.find(JSON.parse(queryStr)); ( METHOD 1B )

//     // // 2) SORTING
//     // let query = Tour.find(JSON.parse(queryStr));

//     // if(req.query.sort) {
//     //     const sortBy = req.query.sort.split(',').join(' ');
//     //     // console.log(sortBy);
//     //     // query = query.sort(req.query.sort);
//     //     query = query.sort(sortBy);
//     //     // sort{'price ratingAverage}
//     // }

//     // else {
//     //     query = query.sort('-createdAt');  //newest one appears first
//     // }

//     // // const query = Tour.find(queryObj);  ( METHOD 1 )

//     // // 3) FIELD LIMITIMG

//     // if(req.query.fields) {
//     //     const fields = req.query.fields.split(',').join(' ');
//     //     query = query.select(fields);
//     // } else {
//     //     query = query.select('-__v'); // '-' excludes __v
//     // }


//     // // 4) PAGINATION 

//     // const page = req.query.page * 1 || 1;   // to convert string to number
//     // const limit = req.query.limit * 1 || 100;
//     // const skip =  (page - 1) * limit;

//     // // page=2&limit=10 resuls from 1 to 10 in page 1 and the 11 to 20 in page 2 and so on
    
//     // query = query.skip(skip).limit(limit)  // limit --> amount of result that we want in the query  skip --> amount of result to be skipped before querying the data

//     // if(req.query.page) {
//     //     const numTours = await Tour.countDocuments();
//     //     if(skip >= numTours) throw new Error('This page does not exist');
//     // }

//     //EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();
//     const tours = await features.query;

//     //SEND RESPONSE
//     res.status(200).json({
//     status: 'success',
//     // requestedAt: req.requestTime,
//     results: tours.length,
//     data: {
//         tours
//     }
// });
// // } catch (err) {
// //     res.status(404).json({
// //         status: 'fail',
// //         message: err
// //     });
// // }
// });


//--------------------------------------------------------//


exports.getTour = factory.getOne(Tour, { path: 'reviews' });  // path -> fields that we want to populate


//--------------------------------------------------------//




// exports.getTour = catchAsync(async (req, res, next) => {
// try {

    // Populate is used here bcoz...its not necessary to show all reviews in Get all tours
    // Its enough to be Get a tour

        // const tour = await Tour.findById(req.params.id).populate('reviews');  
    
    // console.log(req.params);

    // const id = req.params.id*1;  //string ah convert panna *1
    // const tour = tours.find(el => el.id == id);

    // if(id > tours.length){
    //     return res.status(404).json({
    //         status: 'fail',
    //         message: 'Invalid ID'
    //     });
    // }

    // if (!tour) {
    //     return next(new AppError('No tour found with that ID', 404));  // whenever sees next with parameter jumps directly to global handling middleware
    // }

    // res.status(200).json({
    //     status: 'success',
    //     data: {
    //         tour
    //     }
    // });

// } catch (err) {
//     res.status(404).json({
//         status: 'fail',
//         message: err
//     });
// }
// });

// const catchAsync = fn => {
//     return (req, res, next) => {
//         fn(req, res, next).catch(next);  // goes to global handling middleware
//     };
// };



//--------------------------------------------------------//


exports.createTour = factory.createOne(Tour);


//--------------------------------------------------------//




// exports.createTour = catchAsync(async (req, res, next) => {
//     // try {

//     const newTour = await Tour.create(req.body);

//         res.status(201).json({
//             status: 'success',
//             data: {
//                 tour: newTour
//             }
//         });
//     // } catch (err) {
//     //     res.status(400).json({
//     //         status: 'fail',
//     //         message: err
//     //     });
//     // }
// });





//--------------------------------------------------------//


exports.updateTour = factory.updateOne(Tour);


//--------------------------------------------------------//



// exports.updateTour = catchAsync(async (req, res, next) => {
// try {

    //     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    //     new: true, // to return the new updated document
    //     runValidators: true
    // });

    // if (!tour) {
    //     return next(new AppError('No tour found with that ID', 404));  // whenever sees next with parameter jumps directly to global handling middleware
    // }

    // res.status(200).json({
    //     status: 'success',
    //     data: {
    //         tour
    //     }
    // });

// } catch (err) {
//     res.status(400).json({
//         status: 'fail',
//         message: err
//     });
// }
// });



//---------------------------------------------------------------------------//


exports.deleteTour = factory.deleteOne(Tour);


//---------------------------------------------------------------------------//


// exports.deleteTour = catchAsync(async (req, res, next) => {
// try {

//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//         return next(new AppError('No tour found with that ID', 404));  // whenever sees next with parameter jumps directly to global handling middleware
//     }

//     res.status(204).json({
//     status: 'success',
//     data: null
// });



// } catch (err) {
//     res.status(400).json({
//         status: 'fail',
//         message: err
//     });
// }
// }); 


//----------------------------------------------------------------------//


// AGGREGATION

exports.getTourStats = catchAsync(async (req, res, next) => {
    // try {
        const stats = await Tour.aggregate ([ //returns an obj
            {
                $match: { ratingsAverage: { $gte: 4.5 } }
            },
            {
                $group: {
                    // _id: null, //for all tours so null
                    _id: '$difficulty', 
                    // _id: { $toUpper: '$difficulty' },
                    numTours: { $sum: 1 },  //no of tours
                    numRatings: { $sum:'$ratingsQuantity'},  //no of ratings
                    avgRating: { $avg: '$ratingsAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                }
            },
            {
                $sort: { avgPrice: 1 }  // 1 ---> ascending
            },
            // {
            //     $match: { _id: { $ne: 'EASY' } }  //MATCHING CAN BE DONE MULTIPLE TYMS
            // }
        ])

        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        });

    // } catch (err) {
    //     res.status(400).json({
    //     status: 'fail',
    //     message: err
    //     });
    // }
});


exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    // try {

        const year = req.params.year * 1;

        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'   // 9 * 3 = 27  one doc for onr date so array of 3 bcomes 9 * 3
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`), 
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$startDates' },
                    numTourStarts: {$sum: 1},
                    tours: { $push: '$name' }
                }
            },
            {
                $addFields: { month: '$_id' }
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: {
                    numTourStarts: -1
                }
            },
            // {
            //     $limit: 6  // only 6 documents will be displayed
            // }
        ]);
        
        res.status(200).json({
            status: 'success',
            data: {
                plan
            }
        });

    // } catch (err) {
    //     res.status(400).json({
    //     status: 'fail',
    //     message: err
    //     });
    // }
});


//   /tours-within/:distance/center/:latlng/unit/:unit
//   /tours-within/233/center/34.111745,-118.113491/unit/mi



// Tours available from given loc(latlng) with radius(distance)

exports.getToursWithin = catchAsync(async(req, res, next) => {

    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;  // will get in radians


    if(!lat || !lng) {
        next(new AppError('Please provide lattitude and longitude in the format lat,lng', 400));
    }

    //console.log(distance, lat, lng, unit);

    const tours = await Tour.find({ 
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } 
    });

    res.status(200).json({
       status: 'success',
       results: tours.length,
       data: {
           data: tours
       }
    });

});


// 

exports.getDistances = catchAsync(async (req, res, next) => {


    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;  // miles to km


    if(!lat || !lng) {
        next(new AppError('Please provide lattitude and longitude in the format lat,lng', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {   // this shd always be the 1st field
                near: {     // pt from which you have to calculate the distances
                    type: 'point',
                    coordinates: [lng * 1, lat * 1] // * 1 is to convert to numbers
                },
                distanceField: 'distance',  // all the calculated distance will be stored in distanceField
                distanceMultiplier:  multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
     });

});




