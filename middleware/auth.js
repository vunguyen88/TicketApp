const jwt = require('jsonwebtoken');
//const config = require('config');
require('dotenv').config('../.env');

module.exports = (req, res, next) => {
    let token;
    // Get token from header with authorization key and value 'Bearer' + token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('No token found');
        return res.status(403).json({ msg: 'Unauthorized' })
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.jwtSecret);
        req.user = decoded.user;
        console.log('req usesr ', req.user);
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid '});
    }
}