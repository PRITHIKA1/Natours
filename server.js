const mongoose = require('mongoose');

const dotenv = require('dotenv');

// uncaught exceptions

process.on('unhandledException', err => {
    console.log('UNHANDLED EXCEPTION!......Shutting down.........')
    console.log(err);
    process.exit(1);
});


dotenv.config({path: './config.env'});

const app = require('./app');

//connecting database
 
const DB = process.env.DATABASE_LOCAL;

mongoose
.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(console.log('DB Connection Successful....!'));
//   .catch(err => console.log('ERROR'));



//---------------TESTING----------------//

// const testTour = new Tour({
//     name: 'The Park Camper',
//     // rating: 4.7,
//     price: 497
// });

// testTour
// .save()
// .then(doc => {
//     console.log(doc);
// })
// .catch(err => {
//     console.log('ERROR:(:', err);
// });

//---------------------------------------//


//starting the server

const port = process.env.PORT;
const server = app.listen(port, () => {
    console.log(`App running on ${port}....`);
});


//unhandled exceptions
// allows to handle errors in asynchronous code

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION!......Shutting down.........')
    console.log(err.name, err.message);  // err displays fully ---- err.name err.message displays only name and message
    server.close(() => {
        process.exit(1);
    });  // to shut down  0 -> SUCCESS  1 -> uncalled exception
});




