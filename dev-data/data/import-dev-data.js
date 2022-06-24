const fs = require('fs');

const Tour = require('./../../models/tourModel');

const User = require('./../../models/userModel');

const Review = require('./../../models/reviewModel');

const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({path: './config.env'});



//connecting database
 
const DB = process.env.DATABASE_LOCAL;

mongoose
.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(console.log('DB Connection Successful....!'));

//READ JSON FILE

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));  // array of javascript objects
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));  // array of javascript objects
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));  // array of javascript objects



const importData = async () => {

    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data Successfully Imported');

    } catch (err) {
        console.log(err);
    }

    process.exit();

};

//DELETE ALL DATA FROM DB

const deleteData = async () => {

    try {
        await Tour.deleteMany(); //no param deletes fully
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data Successfully Deleted');

    } catch (err) {
        console.log(err);
    }

    process.exit();

};

if (process.argv[2] === '--import'){  // node ./dev-data/data/import-dev-data.js --import
    importData();

} else if (process.argv[2] === '--delete') {  // node ./dev-data/data/import-dev-data.js --delete
    deleteData();
}
