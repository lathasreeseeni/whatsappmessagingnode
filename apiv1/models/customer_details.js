const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var customer_detailsSchema = new Schema({
   
    mobileNumber:String,
    isOptOut: Boolean,
    isNew_Customer: Boolean,
    whatsappOptIn: Boolean
    
},
    {
        versionKey: false
    });

module.exports = mongoose.model('customer_detailsModel', customer_detailsSchema, 'customer_details');