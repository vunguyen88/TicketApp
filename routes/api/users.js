const express = require('express');
const { check, validationResult } = require('express-validator/check');
const router = express.Router();
const chalk = require('chalk');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const error = chalk.bold.red;
const log = console.log;

const User = require('../../models/User');

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post('/', [
    // Validate req body with express-validator
    check('firstName', 'First name is require').not().isEmpty(),
    check('lastName', 'Last name is require').not().isEmpty(),
    check('email', 'Email is not valid').isEmail(),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').matches(/\d/).withMessage('must contain a number').custom(password => {
        if (password.toLowerCase() === password) {
            throw new Error('Password must contain uppercase')
        }
        return true;
    }),
], async (req, res) => {
    // Validate req.body
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }]});
        }
        // Get users gravatar
        const avatar = gravatar.url(email, {
            size: '200',
            rating: 'pg',
            default: 'mm'
        })
        user = new User({
            name: firstName + ' ' + lastName,
            email,
            avatar,
            password
        })
        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Return jsonwebtoken
        const payload= {
            user: {
                id: user.id,
                name: user.name
            }
        }
        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 36000 }, 
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