const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var user_request_responseSchema = new Schema({
   
    mobileNumber: String,
    requested_date: Date,
   // account_no: String,//Date,
    messageType: String,
    requested_message:String,
    optOut:Boolean,
    optIn:Boolean,
    account_no: Number,
    service_type: String,
    //request_time: String,//Date,
    messageType: String,
    sent_date:Date,
    //sent_time:Date,
    messageSent: String,
    whatsapp_msgid: String,
    ErrorMessage:String,
    Other_channal_optIn: String,
    message_body: String
},
    {
        versionKey: false
    });


module.exports = mongoose.model('user_request_responseModel', user_request_responseSchema, 'user_request_response');