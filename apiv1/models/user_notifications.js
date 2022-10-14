const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var user_notificationsSchema = new Schema({
    
    account_no: Number,
    service_type: String,
    customerName: String,
    mobileNumber: String,
    invoiceNumber: Number,
    statementDate: Date,
    paymentDuedate: Date,
    amount: Number,
    pdfURL: String,
    isSent: String,
    messageType: String,
    sentDate: Date,
    excelDate: Date,
   // sentTime: Date,
    messageSent: String,
    whatsapp_msgid: String,
    twilioStatus:String,
    updateDate: Date,
    //updateTime: Date,
    ErrorMessage:String,
    ErrorCode:String,
    template:String,
    billdisp_method:String,
    notificationType:String,
    suspendDate:Date,
    reconnection_amount:Number


},
    {
        versionKey: false
    });

module.exports = mongoose.model('user_notificationsModel', user_notificationsSchema, 'user_notifications');