const mongoose = require('mongoose');
const User = require('./User');
const Schema = mongoose.Schema;

const ArticleSchema = new Schema ({
    title: {
        type: String,
        required: true,
        maxlength: 200,
        trim: true
    },
    summary: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        index: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    views: {
        type: Number,
        default: 0
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}) 


module.exports = mongoose.model('Article', ArticleSchema);