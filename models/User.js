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
       trim: true
   },
   avatar: {
       type: String,
       default: '/avatar/noProfilePicture.png'
   }
});

module.exports = mongoose.model('User', UserSchema);