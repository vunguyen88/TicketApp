const express = require('express');
const router = express.Router();
const redis = require('redis');
const util = require('util');
require('dotenv').config('../.env');

const client = redis.createClient({
    url: process.env.url,
    password: process.env.password,
});
client.on('connect', function() {
    console.log('Redis client connected');
});
client.on("error", function (err) {
    console.log("Something went wrong in CHECKOUT JS" + err);
});
client.rpush = util.promisify(client.rpush);
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const chalk = require('chalk');
// const util = require('util');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Ticket = require('../../models/Ticket');
const { clearHash } = require('../../middleware/cache');

           //===========================*===========================//
// @route   PUT api/tickets
// @desc    Update tickets after checkout
// @access  Private
router.put('/', auth, async (req, res) => {
    console.log('HIT')
    console.log('body ticket ', req.body.tickets)
    try {
        // const returnTickets = await Ticket.updateMany({ _id: req.body.tickets}, {onCheckout: true})//.cache({ key: req.user.id })
        // console.log('return ticket ', returnTickets)
        const key = 'cart:' + req.user.id;
        console.log('key ', key)
        async function addTicket(tick) {
            for (const tic of tick) {
                await client.rpush(key, tic)
            }
        }
        addTicket(req.body.tickets)
        // req.body.tickets.forEach(ticket => {
        //     client.rpush(key, ticket)
        // });
        client.expire(key, 25)
        console.log("SUCCESS ADD");
        // if (tickets.length > 0) {
        //     //console.log('ticket return ', tickets)
        //     return res.json(tickets)
        // }
        //await returnTickets.save();
        res.json({ msg: 'No ticket to show'});
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});

module.exports = router;