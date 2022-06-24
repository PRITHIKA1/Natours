const express = require('express');
// const multer = require('multer');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// const upload = multer({ dest: 'public/img/users' });

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware

router.use(authController.protect);   // ingaye potachu so authController.protect keela iruka routes la remove pannirlam

router.patch('/updatePassword', authController.updatePassword);
router.get('/getMe', userController.getMe, userController.getUser);  //  --> getting current user details
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);  // single --->  only one image   photo --> field in the form where we want to upload the image
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router 
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router