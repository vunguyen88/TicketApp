const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    location: {
        type: String,
    },
    isActive: {
        type: Boolean,
        require: true
    },
    tickets: {
        type: [String],
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    cart: {
        type: [String],
    }
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);