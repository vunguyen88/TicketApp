const express = require('express');
const cors = require('cors');
const redis = require('redis');
const connectDB = require('./config/db');
const app = express();
// require('dotenv').config();

const PORT = process.env.PORT || 5000;
// const REDIS_PORT = process.env.PORT || 6379;
// console.log(redis)
// const client = redis.createClient(REDIS_PORT);
const client = redis.createClient({
    //port: 13881,
    url: process.env.url,
    password: process.env.password,
});
client.on('connect', function() {
    console.log('Redis client connected');
});
client.on("error", function (err) {
    console.log("Something went wrong in APP JS" + err);
});
client.set('WELCOME', 'HI FROM REDISLAB ', function(err) {
    if(err) throw err;
    client.get('WELCOME', function(err, welcomeMessage) {
        if (err) throw err;
        console.log(welcomeMessage);
    })
})

require('./middleware/cache');

// Connect Database
connectDB();

// Init Middleware for Body Parser
app.use(express.json({ extended: false }));
app.use(cors());
app.get('/', (req, res) => res.send('API running'))

// Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/tickets', require('./routes/api/tickets'));
app.use('/api/checkout', require('./routes/api/checkout'));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));