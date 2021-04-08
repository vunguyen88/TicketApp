const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const chalk = require('chalk');
const util = require('util');
const redis = require('redis');
require('dotenv').config('../.env');

// const redisUrl = 'redis://127.0.0.1:6379';
// const client = redis.createClient(redisUrl);
const client = redis.createClient({
    url: process.env.url,
    password: process.env.password,
});
client.on('connect', function() {
    console.log('Redis client connected');
});
client.on("error", function (err) {
    console.log("Something went wrong in TICKETS JS" + err);
});
client.keys = util.promisify(client.keys);
client.lrange = util.promisify(client.lrange);
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Ticket = require('../../models/Ticket');
const { clearHash } = require('../../middleware/cache');

            //===========================*===========================//
// @route   GET api/tickets
// @desc    Get all tickets
// @access  Public
router.get('/', async (req, res) => {
    try {
        let onCheckoutTickets = [];
        const tickets = await Ticket.find().where('onCheckout').equals(false).where('isSold').equals(false);
        let newtic = tickets.map(ticket => ticket._id)
        console.log('ticket from mongo ', newtic)
        const avaiKeys = await client.keys('cart*');
        console.log('avaikeys ', avaiKeys)
        // async function readingPendTickets(keys) {
        //     for (const key of keys) {
        //         const keyTickets = await client.lrange(key, 0, -1);
        //         console.log('keytickekts ', keyTickets)
        //         onCheckoutTickets = [...onCheckoutTickets, ...keyTickets]
        //         // for (const ticket of keyTickets) {
        //         //     onCheckoutTickets.push(ticket)
        //         //     console.log('on checkoutticket inside loop ', onCheckoutTickets)
        //         // }
        //         //keyTickets.forEach(ticket => onCheckoutTickets.push(ticket))
        //     }
        // }
        //readingPendTickets(avaiKeys);
        if (avaiKeys) {
            await Promise.all(avaiKeys.map(async (key) => {
                const keyTickets = await client.lrange(key, 0, -1);
                onCheckoutTickets = [...onCheckoutTickets, ...keyTickets]
                
            }))
            console.log('onCheckoutTicket ', onCheckoutTickets)
        }
        
        
        // const avaiKeys = client.keys('cart*', (err, keys) => {
        //     if (err) return console.log(err);
        //     console.log('keys is ', keys)
        //     keys.forEach(key => {
        //         client.lrange(key, 0, -1, (err, items) => {
        //             if (err) console.log(err);
        //             items.forEach((item, i) => {
        //                 console.log('ticketID from redis ', item)
        //                 onCheckoutTickets.push(item);
        //             })
        //         } )
        //     })
        // })
        // const avaiKeys = client.keys('cart*', (err, keys) => {
        //     if (err) return console.log(err);
        //     console.log('keys is ', keys)
        //     keys.forEach(key => {
        //         client.lrange(key, 0, -1, (err, items) => {
        //             if (err) console.log(err);
        //             items.forEach((item, i) => {
        //                 console.log('ticketID from redis ', item)
        //                 onCheckoutTickets.push(item);
        //             })
        //         } )
        //     })
        // })
        //console.log('onCheckoutTicket ', onCheckoutTickets)
        const resTickets = tickets.filter(ticket => !onCheckoutTickets.includes(ticket._id.toString()))
        console.log('Number of item', resTickets.length)
        //console.log('response ticket ', resTickets)
        //return res.json(resTickets)
        //const cacheValue = client.hget(this.hashKey, key);
        return res.json(resTickets)
        // if (tickets.length > 0) {
        //     //console.log('ticket return ', tickets)
        //     return res.json(onCheckoutTickets)
        // }
        // res.json({ msg: 'No ticket to show'});
    } catch(err) {
        console.log('ERROR ', err);
        res.status(500).send('Server error')
    }
});

            //===========================*===========================//
// @route   GET api/tickets/mytickets
// @desc    Get all tickets that user upload
// @access  Private
router.get('/mytickets', auth, async (req, res) => {
    console.log('running route my tickets')
    // const redis = require('redis');
    // const redisUrl = 'redis://127.0.0.1:6379'
    // const client = redis.createClient(redisUrl);
    // client.get = util.promisify(client.get);
    // // Check data in cached 
    // const cachedMyTickets = await client.get(req.user.id);
    // if find cache, response the value
    // if (cachedMyTickets) {
    //     console.log('SERVING FROM CACHE')
    //     return res.send(JSON.parse(cachedMyTickets));
    // }
    // console.log('SERVING FROM MONGODB')
    // if no update the cache to store data


    //
    try {
        const tickets = await Ticket.find({ sellerId: req.user.id}).cache({ key: req.user.id })
        //if (tickets.length > 0) {
            console.log('ticket return ', tickets)
            // set cached data
            //client.set(req.user.id, JSON.stringify(tickets))
            return res.json(tickets)
        //}
        res.json({ msg: 'No ticket to show'});
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});

            //===========================*===========================//
// @route   DELETE api/tickets/mytickets/ticketId
// @desc    Delete my ticket with ticket ID
// @access  Private
// router.delete('/mytickets/:ticketId', auth, async (req, res) => {
//     console.log('HIT')
//     console.log('ticket id ', req.params)
//     try {
//         const tickets = await Ticket.find({ _id: req.body.ticketId})
//         if (tickets.length > 0) {
//             console.log('found ticket to delete ', tickets)
//             return res.json(tickets)
//         }
//         res.json({ msg: 'No ticket to show'});
//     } catch(err) {
//         console.error(err.message);
//         res.status(500).send('Server error')
//     }
// });


            //===========================*===========================//
// @route   POST api/tickets
// @desc    Add ticket
// @access  Private
router.post('/', [auth, [
    check('title', 'Title is require').not().isEmpty(),
    check('location', 'Location is require').not().isEmpty(),
    check('description', 'Email is not valid').not().isEmpty(),
    check('type', 'Type is not valid').not().isEmpty(),
    check('eventDate', 'Event date is not valid').not().isEmpty(),
    check('amount', 'Amount is not valid').not().isEmpty(),
    // check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').matches(/\d/).withMessage('must contain a number').custom(password => {
    //     if (password.toLowerCase() === password) {
    //         throw new Error('Password must contain uppercase')
    //     }
    //     return true;
    // })
]],async (req, res) => {
    //console.log('body ', req.user.id)
    try {
        const { location, description, type, name, amount, date, photoUrl, price } = req.body;
        ticket = new Ticket({
            type,
            price,
            location,
            name,
            sellerId: req.user.id,
            photoUrl,
            description,
            date,
            amount,
            onCheckout: false,
            isSold: false 
        })
        console.log('REQUEST BODY ', req.body)
        console.log('ticket ', ticket)
        await ticket.save();
        //clearHash(req.user.id);
        return res.json(ticket);
    } catch (err) {
        console.error(chalk.yellow(err.message));
        res.status(500).send('Server error');
    }
})

router.delete('/mytickets/:id', auth, async (req, res) => {
    console.log('param ', req.params)
    try {
        await Ticket.findOneAndRemove({ _id: req.params.id})
        // if (tickets.length > 0) {
        //     console.log('ticket found ', tickets)
        //     return res.json(tickets)
        // }
        clearHash(req.user.id);
        res.json({ msg: 'Ticket deleted'});
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});

module.exports = router;

