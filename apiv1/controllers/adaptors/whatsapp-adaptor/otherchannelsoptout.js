const request = require("request");
const user_notifications = require("../../../models/user_notifications.js");
const customer_details = require("../../../models/customer_details.js");
const user_request_response = require("../../../models/user_request_response");
const readXlsxFile = require("read-excel-file/node");
const mv = require('mv');
const fs =require("fs");
const twiliAuth = require("../../../config/twilioconfig.json");
const client = require("twilio")(twiliAuth.accountSid, twiliAuth.authToken);
const dir = './apiv1/controllers/adaptors/whatsapp-adaptor/OtherchannelsOptout';
const sendEmailalert= require("./emailAlert.js");
const winston = require('winston');
const logDir = 'log';
const dateTimeController = require('./dateandtime.js');
const cron = require('node-cron');



 const storeRecords = async function (jsonData) {
//cron.schedule('46 20 * * *',async function (req, res) {
console.log(" store records function");
  try{
 if(jsonData.rows.length>0){
        for(let i=0;i<jsonData.rows.length;i++){
          if(jsonData.rows[i].billdisp_method == "10" || jsonData.rows[i].billdisp_method == "11"){
     
      let existingCustomer = await customer_details.findOne({ mobileNumber: jsonData.rows[i].mobileNumber });
      let existingCustomer2 = await user_request_response.findOne({ mobileNumber: jsonData.rows[i].mobileNumber,requested_message:"pdfBill",optOut:true });

      
        if(existingCustomer == null && existingCustomer2 == null){
       console.log("new customer in store records");
         
     let obj={
          mobileNumber: jsonData.rows[i].mobileNumber,
          isOptOut :false,
          isNew_Customer: true,
          whatsappOptIn: true
         
}
let obj1=   {  
  mobileNumber: jsonData.rows[i].mobileNumber,
     requested_message : "pdfBill",
         optOut : true,
         account_no : jsonData.rows[i].account_no,
         service_type :jsonData.rows[i].service_type,
         Other_channal_optIn:"yes"
}    
 

        let customer_details1 = new customer_details(obj);
         await customer_details1.save().then((item) => {
           console.log("stored"); })

          .catch((err) => {

            res.status(400).send
           } );


       var user_request_response1 = new user_request_response(obj1);

       // console.log("botserviceModell is" + botserviceModell);
       await user_request_response1.save().then((item) => {

           console.log("stored user_request_response"); })

         .catch((err) => {

           res.status(400).send
          } );


        }
else if(existingCustomer == null || existingCustomer2 == null){
       
    if(existingCustomer2 == null) {  
      await customer_details.findOneAndUpdate({mobileNumber:jsonData.rows[i].mobileNumber },
        {
          "$set": {
            whatsappOptIn: true,
           
          }
        })
        .then(() => {
          console.log("customer_details model Updataed successfully with optout field"); 
        })
        .catch(err => {
          console.log("err while Updataed optout field in customer_details model"+err); 
        });
        let obj1=  {  
          mobileNumber: jsonData.rows[i].mobileNumber,
             requested_message : "pdfBill",
                 optOut : true,
                 account_no : jsonData.rows[i].account_no,
                 service_type :jsonData.rows[i].service_type,
                 Other_channal_optIn:"yes"
        }    
       var user_request_response1 = new user_request_response(obj1);
       await user_request_response1.save()
  
          .then((item) => {
  
            console.log("stored user_request_response"); })
  
          .catch((err) => {
  
            res.status(400).send
           } );
  
        } else{
      console.log("Ignore");
    
        }
    
       }

   }

  else{
console.log("not optin store records");
  }
         }
        
        }  
       
        // res.send({ 'status': '200','message':'Successfully sent notifications'});
          } catch(err){
            console.log("error in service",err);
            res.send(err);
          }
           
        }
        //)
        
module.exports.storeRecords = storeRecords;




