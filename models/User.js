const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
   firstName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
   },
   lastName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
   },
   email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
   },
   password: {
    type: String,
    required: true
   },
   sex: {
       type: String,
       required: true,
       enum: ['male', 'female']
   },
   mobileNumber: {
       type: String,
       unique: [true, "This phone number has been registered earlier!"],
       required: true,
       minlength: 8, //because admin has an ability to change users' passwords into their mobile numbers
       trim: true
   },
   avatar: {
       type: String,
       default: '/images/noProfilePicture.png'
   },
   role: {
       type: String,
       enum: ['blogger', 'admin'],
       default: 'blogger'
   }
});

module.exports = mongoose.model('User', UserSchema);