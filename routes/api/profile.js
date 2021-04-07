const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

            //===========================*===========================//
// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try{
        // Get user profile by id then add name and avatar
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user '})
        }

        res.json(profile)
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error')
    }
});

            //===========================*===========================//
// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post('/', auth, async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()})
    }
    console.log('req ', req.body)
    let profile = {
        userId: req.user.id,
        location: req.body.location,
        isActive: true,
        tickets: [],
        carts: [],
        createdOn: new Date().toISOString()
    }
    try {
        console.log('user Id ', req.user.id)
        let findResult = await Profile.findOne({ userId: req.user.id });
        console.log('find result...', findResult)
        if(findResult) {
            // Update
            console.log('Updating profile...');
            findResult = await Profile.findOneAndUpdate(     
                { user: req.user.id },
                { $set: profile },
                { new: true }
            );
            return res.json(profile);
        }
        // Create
        console.log('Creating new profile...');
        findResult = new Profile(profile);
        await findResult.save();
        res.json(profile)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
})
module.exports = router;