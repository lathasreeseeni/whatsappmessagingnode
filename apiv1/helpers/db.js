 /* //const config = require('config.json');
const mongoose = require('mongoose');
//var process.env.MONGODB_URI = "mongodb://localhost:28057/";
mongoose.connect('mongodb://localhost:28057/whatsapp_solution-Prod', { useCreateIndex: true, useNewUrlParser: true });
mongoose.Promise = global.Promise;

module.exports = {
  
    User: require('../models/organizationProfile')
 
}; */

//const config = require('config.json');
const mongoose = require('mongoose');
//var process.env.MONGODB_URI = "mongodb://localhost:27017/";
mongoose.connect('mongodb://localhost:27017/whatsapp_solution', { useCreateIndex: true, useNewUrlParser: true });
mongoose.Promise = global.Promise;

module.exports = {
  
    User: require('../models/organizationProfile')
 
};