const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ArticleSchema = new Schema ({
    title: {
        type: String,
        required: true,
        trim: true
    },
    summary: {
        type: String,
        required: true,
        minlength: [50, 'Summary is too short']
    },
    text: {type: String},
    date: {
        type: Date,
        default: Date.now
    },
    views: {
        type: Number,
        default: 0
    }
}) 


module.exports = mongoose.model('User', UserSchema);