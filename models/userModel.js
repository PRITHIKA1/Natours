const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'], // validator
        // unique: true,
        // trim: true,
        //maxlength: [25, 'A user name must have less than or equal to 25 characters'],
        //minlength: [4, 'A user name must have more or equal to 10 characters']
    },

    email: {
        type: String,
        required: [true, 'A user must have an email id'],
        unique: true,
        lowercase: true,   // transforms upper to lower case
        validate: [validator.isEmail, 'Please provide a valid email']
    },

    photo: {
        type: String,
        default: 'default.jpg'
        //required: [true, 'A user must have a photo']
    },

    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },

    password: {
        type: String,
        required: [true, 'Please enter the password'],
        minlength: 8,
        select: false // will not be visible in the response
    },

    passwordConfirm: {
        type: String,
        required: [true, 'Please enter the password again'],
        validate: {
            // This works only on create & save
            validator: function(el) {  // cannot put err fxn since 'this' is used
                return el === this.password;
            },
            message: 'Passwords are not same'
        }
    },

    passwordChangedAt: Date,

    passwordResetToken: String, 

    passwordResetExpires: Date,

    passwordUpdate: String,

    passwordUpdateConfirm: String,

    active: {
        type: Boolean,
        default: true,
        select: false
    }

});

// Query Middlewares

userSchema.pre('save', async function(next) {

    // only runs if the password is modified

    if(!this.isModified('password'))  // this --> current user
    {
        return next();
    }

    // Hash the password with cost of 12

    // encryption    hash --> asynchronous version
    this.password = await bcrypt.hash(this.password, 12);  // 12 --> cpu intensive factor (directly proportional)


    // Delete the passwordConfirm field as it is required only when the account is newly created

    this.passwordConfirm = undefined;
    next();

});

userSchema.pre('save', function(next) {

    if(!this.isModified('password') || this.isNew) {
        return next();
    }

    this.passwordChangedAt = Date.now() - 1000;
    next();

});

// to display documents that does not have active property false (deleted user)

userSchema.pre(/^find/, function(next) {  // we use regular function to get access to this keyword

    // this poits to the current query
    this.find({ active: { $ne: false } });
    next();
});


// instance method to check the entered password = encrypted password

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};   // candidate -> original userPAss -> encrypted (hashed)


// instance method
// JWTTimestamp --> when the token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    //console.log(this.passwordChangedAt);

    if(this.passwordChangedAt) {

        //1643414400000   --> so divide by 1000 and parse to int 1643443447   

        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        //console.log(changedTimeStamp, JWTTimestamp);

        return JWTTimestamp < changedTimeStamp;  // password changed
    }

    // false -> not changed
    return false;
};

userSchema.methods.createPasswordResetToken = function() {

    const resetToken = crypto.randomBytes(32).toString('hex');
    //encryption
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({resetToken}, this.passwordResetToken);
    //{
    //   resetToken: 'fe5402827856c8cee2c2668a3c87685a22dd92b34929cfd5d4dc41188441b082'
    // } badc283b679657a33c1cf29860c9bdcc159824453f01d5777e99e0d00103a86a  

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}


const User = mongoose.model('User', userSchema);

module.exports = User;
