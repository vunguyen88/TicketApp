const mongoose = require('mongoose');
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
    console.log("Something went wrong in CACH JS" + err);
});

client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || '');
    return this;
}

mongoose.Query.prototype.exec = async function() {
    if (!this.useCache) {
        return exec.apply(this, arguments);
    }
    console.log(' QUERY IS ABOUT TO RUN ');

    const key =  JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }))
    console.log('key ', key)
    console.log('this haskey ', this.hashKey)
    // Check if there is a value for key in redis
    const cacheValue = await client.hget(this.hashKey, key);
    console.log('cache value ', cacheValue)
    // If value exists, return value
    if (cacheValue) {
        console.log('CACHE VALUE FIND')
        const doc = JSON.parse(cacheValue);
        
        // Print out cache value for testing
        //Array.isArray(doc) ? console.log(doc.map(d => new this.model(d))) : new this.model(doc);

        return Array.isArray(doc) 
            ? doc.map(d => new this.model(d))
            : new this.model(doc);
    }

    // If not, issue the query and store the result in redis
    console.log('CACHE VALUE NOT FOUND, EXECUTE THE QUERY SEARCH')

    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result));
    client.expire(this.hashKey, 10);
    return result;

};

module.exports = {
    clearHash(hashKey) {
        console.log('clearing key...', JSON.stringify(hashKey));
        client.del(JSON.stringify(hashKey))
    }
};