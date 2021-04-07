const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');
const chalk = require('chalk');
// const config = require('config');
require('dotenv').config('../.env');

            //===========================*===========================//
// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get('/', auth, async (req, res) => {
    console.log('req from middleware ', req.user)
    try {
        // return user document except password field
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

            //===========================*===========================//
// @route   POST api/auth
// @desc    Authenticate signed in user and get token
// @access  Public
router.post('/', [
    check('email', 'Email is not valid').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    // Validate req.body
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }]});
        }

        // Check if encypt password is match
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }]});
        }

        // Return jsonwebtoken
        const payload= {
            user: {
                id: user.id,
                name: user.name
            }
        }
        jwt.sign(
            payload, 
            process.env.jwtSecret,
            { expiresIn: 360000 }, 
            (err, token) => {
                if(err) throw err;
                res.json({ token })
            }); 

    } catch (err) {
        console.error(chalk.red(err.message));
        res.status(500).send('Server error')
    }
});

module.exports = router;