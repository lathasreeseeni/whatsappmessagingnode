const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var detailed_twilio_summarySchema = new Schema({
     account_no: Number,
    service_type: String,
    invoiceNumber: Number,
    statementDate:Date,
   // paymentDuedate: Date,
    excelDate: Date,
    billdisp_method: String,
    notificationType:String,
   reconnection_amount:Number,
   customerName : String,
    billAmount: String,
    dueDate:String,
    mobileNumber: String,
    messageType: String,
    sentDate: Date,
    //sentTime: String,//Date,
    messageSent: String,
    whatsapp_msgid: String,
    twilioStatus: String,
    updateDate: Date,
    //updateTime: Date,
    pdf_url:String,
    template:String,
    suspendDate:Date,
    ErrorMessage:String,
    ErrorCode:String

},
    {
        versionKey: false
    });

// whatsappSchema.pre('save', function (next) {
//     now = new Date();
//     this.updated_at = now;
//     if (!this.created_date) {
//         this.created_date = now
//     }
//     next();
// });
module.exports = mongoose.model('detailed_twilio_summaryModel', detailed_twilio_summarySchema, 'detailed_twilio_summary');