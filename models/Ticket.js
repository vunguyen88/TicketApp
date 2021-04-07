const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    price: {
        type: Number,
        require: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    location: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    type: {
        type: String,
        require: true
    },
    date: {
        type: String,
        require: true
        // default: Date.now
    },
    photoUrl: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    onCheckout: {
        type: Boolean,
        require: true
    },
    isSold: {
        type: Boolean,
        require: true
    }
});

module.exports = Ticket = mongoose.model('ticket', TicketSchema);