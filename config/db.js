const mongoose = require('mongoose');
const config = require('config');
const chalk = require('chalk');
//const db = config.get('mongoURI');
require('dotenv').config('../.env');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.mongoURI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false
        });
        console.log(chalk.green('MongoDB is connected...'));
    } catch(err) {
        console.error(err.message);
        // Exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;