const request = require("request");
const user_notifications = require("../../../models/user_notifications.js");
const customer_details = require("../../../models/customer_details.js");
const user_request_response = require("../../../models/user_request_response");
const otherchannels_optIns = require("../../../controllers/adaptors/whatsapp-adaptor/otherchannelsoptout.js");
const whatsappTwowaydata = require("../../../controllers/adaptors/whatsapp-adaptor/whatsappTwowaychat.js");
const readXlsxFile = require("read-excel-file/node");
const mv = require('mv');
const fs =require("fs");
const twiliAuth = require("../../../config/twilioconfig.json");
const client = require("twilio")(twiliAuth.accountSid, twiliAuth.authToken);
const dir = './apiv1/controllers/adaptors/whatsapp-adaptor/Processingfile';
const sendEmailalert= require("./emailAlert.js");
const winston = require('winston');
const logDir = 'log';
const dateTimeController = require('./dateandtime.js');
const cron = require('node-cron');

const scheduleJson= require("../../../config/jobSchedulingConfig.json");

const moment = require('moment-timezone');
const detailed_twilio_summaryModel = require("../../../models/detailed_twilio_summary.js");

const tempexceldataModel = require("../../../models/tempexceldata.js");
const reader = require('xlsx');
const process = require('process');

const Logger = require('../../../helpers/logger-new.js')
const logger = new Logger('notificationsinfo')
// present let count=0;
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

//  present const date= new Date().getTime();
 /*const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    // new winston.transports.File({ filename: `${logDir}/error${date}.log`, level: 'error' }),
    new winston.transports.File({ filename: `${logDir}/notificationsinfo${date}.log`,level:'info' }),
  ],
}); */



const sendWhatsappNotifications = async function (req, res) {
     //cron.schedule('21 21 * * *',async function (req, res) {

  console.log("Cron job started ");
   
  try{
  logger.info('Job Started at '+moment(new Date()).format('DD/MM/YYYY HH:mm:ss'));
 
    fs.readdir(dir, async(err, files) => {
      console.log("After file read ");
   if(files.length>0){
    console.log("if file length>0 ");
    for(let i=0;i<files.length;i++){
      console.log(" file read ");
      let filePath =dir+"/"+files[i];
      let source='./apiv1/controllers/adaptors/whatsapp-adaptor/Processingfile/'+files[i];
      let newfile_name=files[i].replace(".xls","");
      let destination='./apiv1/controllers/adaptors/whatsapp-adaptor/Completedfiles/'+newfile_name+'_'+Date.now()+'.xls';
     // let jsonData = await readXlsxFile(filePath, { schema })
/**New Code to read more than 1 lakh records from xlsfile*/
     let jsonDataxls = await getDataAfterFileRead(filePath);
    await deleteUndelivered();
   let jsonData = await checkMonthSent(jsonDataxls);
   if(jsonData.rows.length>0){

      await otherchannels_optIns.storeRecords(jsonData);
      let jsonArrayData = [];
      console.log("before if");
      if(jsonData.rows[0].notificationType=="INITIAL_BILL_MESSAGE"){
        console.log("INITIAL_BILL_MESSAGE");
        jsonArrayData = await getcustomerInfo(jsonData.rows);
        
      }else{
        jsonArrayData = await getfollowupcustomerInfo(jsonData.rows);
        console.log("Followup messages");
      }
         if(jsonArrayData.length>0){
          logger.info('NO.of records in file '+jsonArrayData.length);
         //await user_notifications.insertMany(jsonData.rows).then(function(){
          await tempexceldataModel.insertMany(jsonArrayData).then(function(){
          console.log("Data inserted");
            fs.access("./apiv1/controllers/adaptors/whatsapp-adaptor/Completedfiles", function(error) {
              if (error) {
                fs.mkdir("./apiv1/controllers/adaptors/whatsapp-adaptor/Completedfiles", '0777', function(err) {
                  if(err) console.log("New folder created");
                  moveFile(source,destination);
                });
              }else{
                console.log("folder exists");
                moveFile(source,destination);     
              }
            })
            
           }).catch(function(error){
          console.log(error);      
         });
        
   
        //  let customers=[];
      /*  let i = 0;
     while((customers = await getPendingrecords(i)).length > 0){
      
      logger.info('NO.of records triggered successfully '+i);
      i = i+8;
      
    let previousMobilenumber;
     for(let i=0;i<customers.length;i++){
     if(previousMobilenumber != undefined && customers[i].mobileNumber == previousMobilenumber){
          await sleep(30000);
        }
        
         let customer= customers[i];
      
      if (customer.mobileNumber!== "" && customer.mobileNumber !== undefined ) {
       let message = await formMessage(customer);
      
       await sendwhatsappNotification(message, customer);  
    } 
      else {
        console.log("Mobile number empty ");
        let dateObj = await dateTimeController.getDateAndTime();
        let twiliostatus = {
          "account_no" : customer.account_no,
          "service_type" : customer.service_type,
          "customerName" : customer.customerName,
          "mobileNumber" :  customer.mobileNumber,
          "invoiceNumber" : customer.invoiceNumber,
          "dueDate": customer.statementDate,
          "statementDate" : customer.statementDate,
          "billAmount" : customer.amount,
          "pdfURL" : customer.pdfURL,
          "billdisp_method": customer.billdisp_method,
          "isSent" : "Yes",
          "excelDate" : customer.excelDate,
          "messageSent" : "failed",
          "messageType" : "Invoice",
          "sentDate" : dateObj.date,
          "updateDate" : dateObj.date,
          "template":customer.template,
          "amount": customer.amount,
          "notificationType":customer.notificationType,
          "reconnection_amount":customer.reconnection_amount
         
        };
        let twiliostatusModel1 = new user_notifications(twiliostatus);
        await twiliostatusModel1.save()
        .then((twiliostatus) => {
         // console.log("detailed twilio summary model saved successfully" + twiliostatus);
         console.log("user_notifications model saved successfully" + twiliostatus);
        })
        .catch((err) => {
          console.log("unable to save to database");
        });
        
      }
     }
  //  await sleep(scheduleJson.sleepTime);
}
*/
logger.info('Job Ended at'+moment().tz('America/Guyana').format('DD/MM/YYYY HH:mm:ss'));

}

else{
    console.log("XLS file Is Empty");
    fs.access("./apiv1/controllers/adaptors/whatsapp-adaptor/Completedfiles", function(error) {
        if (error) {
          fs.mkdir("./apiv1/controllers/adaptors/whatsapp-adaptor/Completedfiles", '0777', function(err) {
            if(err) console.log("error");
            moveFile(source,destination);
          });
        }else{
          console.log("file errror");
          moveFile(source,destination); 
        }
      })
      
  }
}
else{
console.log("No New records in the Excel file");
let info ={
"subject":"There is No New records in a excel file",
 "message":" There is No New records in a excel file. Please check."
   }
   sendEmailalert.sendEmails(info);
   }    
}
   }
else{
  console.log("There is no Files In Processing folder");
   let info ={
     "subject":"Empty Folder alert to send whatspp Notifications",
     "message":" There is no file to send whatspp notifications. Please check."
   }
    sendEmailalert.sendEmails(info);
}

});
// res.send({ 'status': '200','message':'Successfully sent notifications'});
  } catch(err){
    console.log("error in service",err);
    res.send(err);
  }
   
}
  // );

  async function sendWhatsappNotificationsPhase2 () {	
    let i = 0;	
    while((customers = await getPendingrecords(i)).length > 0){	
       
     logger.info('NO.of records triggered successfully '+i);	
     console.log("customers::::::::::::::::++",customers[i]);	
     i = i+8;	
       
   let previousMobilenumber;	
    for(let i=0;i<customers.length;i++){	
    if(previousMobilenumber != undefined && customers[i].mobileNumber == previousMobilenumber){	
         await sleep(30000);	
       }	
         
        let customer= customers[i];	
       
     if (customer.mobileNumber!== "" && customer.mobileNumber !== undefined ) {	
      let message = await formMessage(customer);	
       
      await sendwhatsappNotification(message, customer);  	
   } 	
     else {	
       console.log("Mobile number empty ");	
       let dateObj = await dateTimeController.getDateAndTime();	
       let twiliostatus = {	
         "account_no" : customer.account_no,	
         "service_type" : customer.service_type,	
         "customerName" : customer.customerName,	
         "mobileNumber" :  customer.mobileNumber,	
         "invoiceNumber" : customer.invoiceNumber,	
         "dueDate": customer.statementDate,	
         "statementDate" : customer.statementDate,	
         "billAmount" : customer.amount,	
         "pdfURL" : customer.pdfURL,	
         "billdisp_method": customer.billdisp_method,	
         "isSent" : "Yes",	
         "excelDate" : customer.excelDate,	
         "messageSent" : "failed",	
         "messageType" : "Invoice",	
         "sentDate" : dateObj.date,	
         "updateDate" : dateObj.date,	
         "template":customer.template,	
         "amount": customer.amount,	
         "notificationType":customer.notificationType	,
         "reconnection_amount":customer.reconnection_amount
          
       };	
       let twiliostatusModel1 = new user_notifications(twiliostatus);	
       await twiliostatusModel1.save()	
       .then((twiliostatus) => {	
        // console.log("detailed twilio summary model saved successfully" + twiliostatus);	
        console.log("user_notifications model saved successfully" + twiliostatus);	
       })	
       .catch((err) => {	
         console.log("unable to save to database");	
       });	
         
     }	
    }	
  //  await sleep(scheduleJson.sleepTime);	
  }	
  }


 async function formMessage(customer){

   let dueDate=moment(customer.paymentDuedate).format('DD/MM/YYYY');    
    let monthName = await getMonthNameFromDate(); 
    let message = "";
    console.log("monthName is in fallback  "+monthName);
	let currentyear = new Date().getFullYear();
 console.log("currentyear is in fallback  "+currentyear );

  if(customer.template == "t1"){
  // message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance due before *"+dueDate+"*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp.";    
message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance due before *"+dueDate+"*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp."; 
}
      else if(customer.template == "t2"){
      
 //message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* is ready.\n\nPlease enter your selection on your keypad:\n\n1.Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp.";       
 message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* is ready.\n\nPlease enter your selection on your keypad:\n\n1.Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp.";
}
      else if(customer.template == "t3"){
      
     //message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. The balance of *$"+customer.amount.toFixed(2)+"* is due on *"+dueDate+"*. Pay this amount to stay connected.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";    
message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. The balance of *$"+customer.amount.toFixed(2)+"* is due on *"+dueDate+"*. Pay this amount to stay connected.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service."; 
}
      else if(customer.template == "t4"){
     
    // message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Your balance is *$"+customer.amount.toFixed(2)+"*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nThank you for choosing our WhatsApp Billing service.";    
  message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Your balance is *$"+customer.amount.toFixed(2)+"*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nThank you for choosing our WhatsApp Billing service."; 
}
      else if(customer.template == "t5"){
      
   //message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance due before *"+dueDate+"*.\n\nPlease enter your selection on your keypad:\n\n1. Downlowd your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";     
message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance due before *"+dueDate+"*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."; 
}
      else if(customer.template == "t6"){
     
   //message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* is ready.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";    
message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* is ready.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
}
    else if(customer.template == "t7"){
    
     //message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. The balance of *$"+customer.amount.toFixed(2)+"* is due on *"+dueDate+"*. Pay this amount to stay connected.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";  
message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. The balance of *$"+customer.amount.toFixed(2)+"* is due on *"+dueDate+"*. Pay this amount to stay connected.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
}
    else if(customer.template == "t8"){
    
    //message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Your balance is *$"+customer.amount.toFixed(2)+"*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
 message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Your balance is *$"+customer.amount.toFixed(2)+"*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."; 
}
    else if(customer.template == "ft1"){
     
    //  message="Dear *"+customer.customerName+"*,\n\nHere is a reminder that Your *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"*, *"+currentyear+"* is ready. Pay the balance of *$"+customer.amount.toFixed(2)+"* before the due date *"+dueDate+"* to stay connected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
  message="Dear *"+customer.customerName+"*,\n\nHere is a reminder that Your *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance of *$"+customer.amount.toFixed(2)+"* before the due date *"+dueDate+"* to stay connected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
}
    else if(customer.template == "ft2"){
  
     // message="Dear *"+customer.customerName+"*,\n\nHere is a reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that is due on *"+dueDate+"*.\n\nWe encourage you to make your payment soon to avoid service disruption.\n\nPlease enter your selection on your keypad:\n\n1.Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT Kiosks, MMG, MyGTT, Bill Express, Surepay, at Commercial Banks or our Retail Stores nationwide.\n\nPlease disregard this reminder if your bill(s) has already been paid.\n\nThank you for choosing our WhatsApp Billing service.";
message="Dear *"+customer.customerName+"*,\n\nHere is a reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that is due on *"+dueDate+"*.\n\nWe encourage you to make your payment soon to avoid service disruption.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1.Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
}
    else if(customer.template == "ft3"){
   
    // message="Dear *"+customer.customerName+"*,\n\nHere is a reminder that your bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that is due on *"+dueDate+"*.\n\nWe encourage you to make your payment soon to avoid service disruption.\n\nPlease enter your selection on your keypad:\n\n1.Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT Kiosks, MMG, MyGTT, Bill Express, Surepay, at Commercial Banks or our Retail Stores nationwide.\n\nPlease disregard this reminder if your bill(s) has already been paid \n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp.";
message="Dear *"+customer.customerName+"*,\n\nHere is a reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that is due on *"+dueDate+"*.\n\nWe encourage you to make your payment soon to avoid service disruption.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1.Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide \n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp.";
}
    else if(customer.template == "ft4"){
     // message="Dear *"+customer.customerName+"*,\n\nHere is a reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* 2021 is ready and is due on *"+dueDate+"*.\n\nWe encourage you to make your payment before the 17th to stay connected.\n\nPlease enter your selection on your keypad:\n\n1. Only download your bill\n2. Retrieve your account number and pending balance\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
 // message="Dear *"+customer.customerName+"*,\n\nHere is a reminder that Your *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* 2021 is ready and is due on *"+dueDate+"*. Pay the balance of *$"+customer.amount.toFixed(2)+"* to stay connected.\n\nWe encourage you to make your payment before the 17th to stay connected.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
  message="Dear *"+customer.customerName+"*,\n\nHere is a reminder that Your *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance of *$"+customer.amount.toFixed(2)+"* before the due date *"+dueDate+"* to stay connected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
 //message="Dear *{{1}}*,\n\nThis is the *final* reminder that your *{{2}}* bill, account *{{3}}* for the month of *{{4}}* *{{5}}* has a balance of *${{6}}* that was due on *{{7}}*.\n\n*We encourage you to make your payment before the 17th to stay connected*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";  
 }
    else if(customer.template == "ft5"){
   
   //message="Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill, account *"+customer.account_no+"* for the month of *"+monthName+"* *2022* has a balance of *$"+customer.amount.toFixed(2)+"* that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of *$"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service."
  message="Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill, account *"+customer.account_no+"* for the month of *"+monthName+"* *2022* has a balance of *$"+customer.amount.toFixed(2)+"* that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of $"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
}
    else if(customer.template == "ft6"){
   
   //message="Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of *$"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
  message="Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of $"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
}
    else if(customer.template == "ft7"){
   
  
 //message="Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of *$"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill \n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
   message="Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of $"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill \n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
}
    else if(customer.template == "ft8"){
    
  // message="Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill, account *"+customer.account_no+"* for the month of *"+monthName+"* *2022* has a balance of *$"+customer.amount.toFixed(2)+"* that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of *$"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
 message="Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill, account *"+customer.account_no+"* for the month of *"+monthName+"* *2022* has a balance of *$"+customer.amount.toFixed(2)+"* that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of $"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
}
    else if(customer.template == "ft9"){
    
//message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service, account *"+customer.account_no+"*, has been suspended for non-payment. Pay the outstanding balance of *$"+customer.amount.toFixed(2)+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
  message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service, account *"+customer.account_no+"*, has been suspended for non-payment. Pay the outstanding balance of *$"+customer.amount.toFixed(2)+"* and reconnection fee of *$"+customer.reconnection_amount+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
}
    else if(customer.template == "ft10"){
      
    //message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service, account *"+customer.account_no+"* has been suspended for non-payment. Pay the outstanding balance today to have your service reconnected. .\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Only download your bill\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
   message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service has been suspended for non-payment. Pay the outstanding balance and reconnection fee of *$"+customer.reconnection_amount+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";
}
    else if(customer.template == "ft11"){
   
 // message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service has been suspended for non-payment. Pay the outstanding balance today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp.";
message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service has been suspended for non-payment. Pay the outstanding balance and reconnection fee of *$"+customer.reconnection_amount+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp.";
}

    else if(customer.template == "ft12"){
    
   //message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service, account *"+customer.account_no+"*, has been suspended for non-payment. Pay the outstanding balance of *$"+customer.amount.toFixed(2)+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*.";  
   message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service, account *"+customer.account_no+"*, has been suspended for non-payment. Pay the outstanding balance of *$"+customer.amount.toFixed(2)+"* and reconnection fee of *$"+customer.reconnection_amount+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."; 
 }
else if(customer.template == "ft13"){
     message="Dear *"+customer.customerName+"*,\n\nYour GTT *"+customer.service_type+"* service, account *"+customer.account_no+"* will be disconnected if a payment of *$"+customer.amount.toFixed(2)+"* is not made immediately.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";    
}
else if(customer.template == "ft14"){
  message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service will be disconnected if a payment is not made immediately.\n\nPlease enter your selection on your keypad:\n\n1. Only download your bill\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";    
}
else if(customer.template == "ft15"){
 message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service will be disconnected if a payment is not made immediately.\n\nPlease enter your selection on your keypad:\n\n1. Only download your bill\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";    
}
else if(customer.template == "ft16"){
  message="Dear *"+customer.customerName+"*,\n\nYour GTT *"+customer.service_type+"* service, account *"+customer.account_no+"* will be disconnected if a payment of *$"+customer.amount.toFixed(2)+"* is not made immediately.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
}
else if(customer.template == "ft17"){
   message="Dear *"+customer.customerName+"*,\n\nYour GTT *"+customer.service_type+"* service, account *"+customer.account_no+"* will be disconnected and you will need to reapply if a payment of *$"+customer.amount.toFixed(2)+"* is not made now.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";     
}
else if(customer.template == "ft18"){
    message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service is about to be disconnected and you will need to reapply if a payment is not made now.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paperbills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
}
else if(customer.template == "ft19"){
 message="Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service is about to be disconnected and you will need to reapply if a payment is not made now.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paperbills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";     
}
else if(customer.template == "ft20"){
// message="Dear *"+customer.customerName+"*,\n\nYour GTT *"+customer.service_type+"* service, account *"+customer.account_no+"* is about to be disconnected and you will need to reapply if a payment of *$"+customer.amount.toFixed(2)+"* is not made now.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";     
   message="Dear *"+customer.customerName+"*,\n\nYour GTT *"+customer.service_type+"* service, account *"+customer.account_no+"* is about to be disconnected and you will need to reapply if a payment of *$"+customer.amount.toFixed(2)+"* is not made now.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";
}
else if(customer.template == "ft21"){
  message="Dear *"+customer.customerName+"*,\n\nYour GTT *"+customer.service_type+"* service, account *"+customer.account_no+"* has been terminated for non-payment of an outstanding balance of *$"+customer.amount.toFixed(2)+"*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";     
}
else if(customer.template == "ft22"){
 message="Dear *"+customer.customerName+"*,\n\nYour GTT *"+customer.service_type+"* service, account *"+customer.account_no+"* has been terminated for non-payment of an outstanding balance.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paperbills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";    
}
else if(customer.template == "ft23"){
   message="Dear *"+customer.customerName+"*,\n\nYour GTT *"+customer.service_type+"* service, account *"+customer.account_no+"* has been terminated for non-payment of an outstanding balance.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paperbills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";    
}
else if(customer.template == "ft24"){
 message="Dear *"+customer.customerName+"*,\n\nYour GTT *"+customer.service_type+"* service, account *"+customer.account_no+"* has been terminated for non-payment of an outstanding balance of *$"+customer.amount.toFixed(2)+"*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.";    
}
 return message;
 }

function moveFile(source,destination){

  mv(source, destination, function(err) {
    if (err) {
      console.log("err",err);
      
   } else {
       console.log("Successfully moved the file!");
   }
  });

}
async function getPendingrecords(i){
  console.log("pending records");
  let sentFlag="No";
  // let startDate = moment(new Date()).startOf('month').format("MM/DD/YYYY");
  // let endDate = moment(new Date()).endOf('month').format("MM/DD/YYYY");
  // let startDate1 = moment(new Date()).startOf('month').format("MM/DD/YYYY");
  // let endDate1 = moment(new Date()).endOf('month').format("MM/DD/YYYY");

  // let startDate= new Date()
  let month=new Date().getMonth()+1;
     let year=new Date().getFullYear()

  //    var startDate = new Date(year,month-1, 2);
  //  var endDate = new Date(year, month,0);
  let lastDayOMmonth= moment(new Date()).endOf('month').format("DD");
  console.log("monthcount",lastDayOMmonth);
  let startDate1;
  let endDate1; 
  if(month<10){
     startDate1=year+"-0"+month+"-01T00:00:00.000Z"
     endDate1=year+"-0"+month+"-"+lastDayOMmonth+"T23:59:59.999Z"

   }
   else{
     startDate1=year+"-"+month+"-01T00:00:00.000Z"
     endDate1=year+"-"+month+"-"+lastDayOMmonth+"T23:59:59.999Z"
   }
  
    var startDate = new Date(startDate1);
    let endDate=new Date(endDate1);

  console.log("start and end date",startDate,endDate);

  let customers= await tempexceldataModel.find({}).skip(i).limit(scheduleJson.sendRecodsLimit);
   //let customers= await tempexceldataModel.find({isSent:sentFlag,excelDate: {$gte:startDate, $lte:endDate}}).limit(scheduleJson.sendRecodsLimit);
  //let customers= await user_notifications.find({"twilioStatus" : "undelivered"}).limit(scheduleJson.sendRecodsLimit);
  console.log("customers in pending",customers);  
  console.log("checking"); 
  return customers;
}



 async function sendwhatsappNotification(message, customer) {
  return new Promise((resolve,reject) => {
   try{
    console.log("Before sleep sending notifications");
    let mobilenumber=customer.mobileNumber.replace(/ /g,'');
     if(message !="" && message !== undefined){
    console.log("customer before send to twilio", customer);
    let mobilenumber=customer.mobileNumber.replace(/ /g,'');
    // console.log("seconds in sending ",new Date());

    logger.info('seconds in sending '+new Date());
    client.messages
    .create({
      to: "whatsapp:+" +mobilenumber,
      from: twiliAuth.twilio_number,
      body: message,
       })
    .then(async(messages) => {
      logger.info("second in after sending "+new Date());
      // console.log("second in after sending ", new Date());
      let dateObj = await dateTimeController.getDateAndTime();
      console.log(dateObj.date+"dateObj.date");

  
    let twiliostatus = {
      "account_no" : customer.account_no,
      "service_type" : customer.service_type,
      "customerName" : customer.customerName,
      "mobileNumber" :  customer.mobileNumber,
      "invoiceNumber" : customer.invoiceNumber,
      "dueDate": customer.statementDate,
      "statementDate" : customer.statementDate,
      "billAmount" : customer.amount,
      "pdfURL" : customer.pdfURL,
      "billdisp_method":customer.billdisp_method,
      "isSent" : "Yes",
      "excelDate" : customer.excelDate,
      "messageSent" : "success",
      "messageType" : "Invoice",
      "sentDate" : dateObj.date,
      "updateDate" : dateObj.date,
      "whatsapp_msgid" : messages.sid,
      "template":customer.template,
      "amount": customer.amount,
      "notificationType":customer.notificationType,
       "reconnection_amount":customer.reconnection_amount
      
  
      

    };
    let twiliostatusModel1 = new user_notifications(twiliostatus);
    await twiliostatusModel1.save()
    .then((twiliostatus) => {
     // console.log("detailed twilio summary model saved successfully" + twiliostatus);
     console.log("user_notifications model saved successfully" + twiliostatus);
    })
    .catch((err) => {
      console.log("unable to save to database");
    });
      
        resolve();
      
    })
    .catch(async (err) => {
     
      console.log("Twilio Server down RestException ",err.code);
      if(err.code =="63018"){
        let info ={
          "subject":"Twilio exceed the daily limit ",
          "message":"Twilio exceed the daily limit for your tier, messages will be undelivered "+err
        }
       await sendEmailalert.sendEmails(info);
         resolve();
         await customer_details.findOneAndUpdate({mobileNumber:mobilenumber},
          {
            "$set": {
              isNew_Customer:true
             
            }
          })
          process.exit(1);

      }else if(err.code =="20003"){
        let info ={
          "subject":"Twilio Permission Denied ",
          "message":"Twilio Permission Denied due to insufficient founds in account "+err
        }
       await sendEmailalert.sendEmails(info);
         resolve();
         await customer_details.findOneAndUpdate({mobileNumber:mobilenumber},
          {
            "$set": {
              isNew_Customer:true
             
            }
          })
          process.exit(1);

      }
else{
      let info ={
        "subject":"Twilio Server is down",
        "message":"Twilio Server down RestException "+err
      }
     await sendEmailalert.sendEmails(info);
       resolve();
       await customer_details.findOneAndUpdate({mobileNumber:mobilenumber},
        {
          "$set": {
            isNew_Customer:true
           
          }
        })
    }
    });
  
  }else{
    console.log("empty message",message);
    let mobilenumber=customer.mobileNumber.replace(/ /g,'');
    customer_details.findOneAndUpdate({mobileNumber:mobilenumber},
      {
        "$set": {
          isNew_Customer:true
         
        }
      })
    resolve();
  }
}catch(err){
  console.log("catch errr",err);
   customer_details.findOneAndUpdate({mobileNumber:mobilenumber},
    {
      "$set": {
        isNew_Customer:true
       
      }
    })
}

  });

}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function existingCustomer(mydocument,customer,element){
  console.log("existing customer");

  if(mydocument && mydocument.isNew_Customer === false ){
    if( mydocument.whatsappOptIn != true){
      //Esisting without optin
     if(mydocument.isOptOut === false){
     try{
     let message;
      if(element.amount >0){
        
        element.isSent = "No";
        element.excelDate= new Date();
        element.template="t1";
        return element;
    
   }else if(element.amount<=0){
    element.isSent = "No";
    element.excelDate= new Date();
    element.template="t2";
    return element;
 
     }
   
 }catch (err) {
   console.log("errr", err);
 }
 }else{
   console.log("customer optout true");
   let dateObj = await dateTimeController.getDateAndTime();
 let twiliostatus = {
          "account_no" : customer.account_no,
          "service_type" : customer.service_type,
          "customerName" : customer.customerName,
          "mobileNumber" :  customer.mobileNumber,
          "invoiceNumber" : customer.invoiceNumber,
          "dueDate": customer.statementDate,
          "statementDate" : customer.statementDate,
          "billAmount" : customer.amount,
          "pdfURL" : customer.pdfURL,
          "billdisp_method": customer.billdisp_method,
          "isSent" : "Yes",
          "excelDate" : customer.excelDate,
          "messageSent" : "failed",
          "messageType" : "Invoice",
          "sentDate" : dateObj.date,
          "updateDate" : dateObj.date,
         "reconnection_amount":customer.reconnection_amount,
          "template":customer.template,
          "amount": customer.amount
         
        };
        let twiliostatusModel1 = new user_notifications(twiliostatus);
        await twiliostatusModel1.save()
        .then((twiliostatus) => {
        
         console.log("user_notifications model saved successfully");
        })
        .catch((err) => {
          console.log("unable to save to database");
        });
   // await sleep(1000);
 }
}
else{
// Esisting with optin
  if(mydocument.isOptOut === false){
    try{
    let message;
     if(element.amount >0){
      element.isSent = "No";
      element.excelDate= new Date();
      element.template="t3";
      return element;
 
    }else if(element.amount<=0){
      element.isSent = "No";
      element.excelDate= new Date();
      element.template="t4";
      return element;
   
    }
  
}catch (err) {
  console.log("errr", err);
}
}else{
  console.log("customer optout true");
  let dateObj = await dateTimeController.getDateAndTime();
  user_notifications.findOneAndUpdate({_id:customer._id },
   {
     "$set": {
       messageType: "Invoice",
       updateDate: dateObj.date,
       messageSent: "failed",
       isSent:"Yes"
      
     }
   })
   .then(() => {
     console.log("user notifications model Updataed successfully");
      
   
   })
   .catch(err => {
     if (err.status) {
       res.status(err.status).json({ message: err.message })
     } else {
       res.status(500).json({ message: err.message })
     }
   });
// await sleep(1000);
}
}
} 
if (mydocument && mydocument.isNew_Customer === true ) {
 console.log(" New Customer with document");
if(mydocument.whatsappOptIn === true){
console.log("new customer with optin");
  try{
   
    if(element.amount >0){
      element.isSent = "No";
      element.excelDate= new Date();
      element.template="t7";
      return element;
     
   }else if(element.amount<=0){
    element.isSent = "No";
    element.excelDate= new Date();
    element.template="t8";
    return element;
   
       }
    
   }catch (err) {
     console.log("errr", err);
   }

}else{
 try{
   
  if(element.amount >0){
    element.isSent = "No";
    element.excelDate= new Date();
    element.template="t5";
    return element;
   
 }else if(element.amount<=0){
  element.isSent = "No";
  element.excelDate= new Date();
  element.template="t6";
  return element;
 
     }
  
 }catch (err) {
   console.log("errr", err);
 }
}
}else{
  console.log("other than ifs");
}
  

}

async function newCustomer(mydocument,customer,element){
  console.log(" New Customer");
      let myobj={
        mobileNumber:customer.mobileNumber,
        isOptOut:false,
        isNew_Customer:true
         }
      await customer_details.create(myobj);
     try{
        let message;
        let ee1 = {};
       if(element.amount >0){
        element["isSent"] = "No";
        element["excelDate"] = new Date();
        element["template"]="t5";
      
        return element;
      
      }else if(customer.amount<=0){
        element.isSent = "No";
        element.excelDate= new Date();
        element.template="t6"
        
        return element;
      
          }
       console.log("Final element in new cust function",element);
      }catch (err) {
        console.log("errr", err);
      }

    
    
    
}

async function getcustomerInfo(jsonDatarows){
  try{
    let jsonArrayData = [];
   
       for (let element of jsonDatarows) {
   
     let customer= element;
     
     let mydocument=  await customer_details.findOne({mobileNumber:element.mobileNumber})
    
    if (mydocument != null) {
       let element1 = await existingCustomer(mydocument,customer,element);
       jsonArrayData.push(element1);
      
       }
       else if(mydocument == null) { 
       let element2 = await newCustomer(mydocument,customer,element);
         jsonArrayData.push(element2);
       }
      }
       return jsonArrayData;
  }
  catch(err){
    console.log(err);
  }
}

async function getfollowupcustomerInfo(jsonDatarows){
  try{
    let jsonArrayData = [];
    let month=new Date().getMonth()+1;
    let year=new Date().getFullYear()

 //    var startDate = new Date(year,month-1, 2);
 //  var endDate = new Date(year, month,0);
 let lastDayOMmonth= moment(new Date()).endOf('month').format("DD");
 console.log("monthcount in getfollowupcustomerInfo",lastDayOMmonth);
 let startDate1;
 let endDate1; 
 if(month<10){
    startDate1=year+"-0"+month+"-01T00:00:00.000Z"
    // endDate1=year+"-0"+month+"-"+lastDayOMmonth+"T23:59:59.999Z"

  }
  else{
    startDate1=year+"-"+month+"-01T00:00:00.000Z"
    // endDate1=year+"-"+month+"-"+lastDayOMmonth+"T23:59:59.999Z"
  }
 
   var startDate = new Date(startDate1);
   let endDate=new Date();

 console.log("start and end date getfollowupcustomerInfo",startDate,endDate);

 for (let element of jsonDatarows) {
     let customer= element;
    let mydocument=  await user_notifications.findOne({mobileNumber:element.mobileNumber,service_type:element.service_type,sentDate: {$gte:startDate, $lte:endDate},isSent:"Yes"})
    //  let mydocument=  await user_notifications.findOne({mobileNumber:element.mobileNumber,sentDate: {$gte:startDate, $lte:endDate},isSent:"Yes",notificationType:"INITIAL_BILL_MESSAGE"})
     if (mydocument != null) {
       if(mydocument.template =="t5" || mydocument.template =="t6" ){
       //NEW Customers
       let mydocument=  await customer_details.findOne({mobileNumber:element.mobileNumber,whatsappOptIn:true})
           if(mydocument == null){
        console.log("NEW Followup");
           let element2 = await followupnewCustomer(mydocument,customer,element);
           jsonArrayData.push(element2);
           } else{
            console.log("NEW Followup whatsapp optin");
            let element2 = await followupnewCustomerOptIn(mydocument,customer,element);
            jsonArrayData.push(element2);
           }
       } else if(mydocument.template =="t7" ||mydocument.template =="t8"){
        console.log("NEW Followup whatsapp optin");
        let element2 = await followupnewCustomerOptIn(mydocument,customer,element);
        jsonArrayData.push(element2);
       }
       else{
        let mydocument=  await customer_details.findOne({mobileNumber:element.mobileNumber,whatsappOptIn:true})
           if(mydocument != null){
            //EXISTING whatsapp optin
            console.log("EXISTING whatsapp optin Followup");
            let element1 = await followupexistingCustomerOptIn(mydocument,customer,element);
            
            jsonArrayData.push(element1);
             }else{
            // EXISTING
            console.log("EXISTING Followup");
            let element1 = await followupexistingCustomer(mydocument,customer,element);
            jsonArrayData.push(element1);
           
           }
       }
     
       }
       else { 
       
       
       }
     
       }
       return jsonArrayData;
  }
  catch(err){
    console.log(err);
  }
}

async function followupnewCustomer(mydocument,customer,element){
 
      if(element.notificationType=="FIRST_BILL_REMINDER"){
        element["isSent"] = "No";
        element["excelDate"] = new Date();
        element["template"]="ft2";
      
        return element;
      } 
      else if(element.notificationType=="FINAL_BILL_REMINDER"){
        element["isSent"] = "No";
        element["excelDate"] = new Date();
//new
        element["template"]="ft6";
      return element;

      } else if(element.notificationType=="SUSPENSION"){
        element["isSent"] = "No";
        element["excelDate"] = new Date();
//new
        element["template"]="ft10";
       return element;

      } else if(element.notificationType=="FIRST_DISCONNECT"){
        element["isSent"] = "No";
        element["excelDate"] = new Date();
        element["template"]="ft14";
       return element;

      } else if(element.notificationType=="FINAL_DISCONNECT"){
        element["isSent"] = "No";
        element["excelDate"] = new Date();
        element["template"]="ft18";
return element;
      } else if(element.notificationType=="TERMINATE"){
        element["isSent"] = "No";
        element["excelDate"] = new Date();
        element["template"]="ft22";
return element;

      }
      
}

async function followupnewCustomerOptIn(mydocument,customer,element){
 
  if(element.notificationType=="FIRST_BILL_REMINDER"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
//new
    element["template"]="ft4";
  
    return element;
  } 
  else if(element.notificationType=="FINAL_BILL_REMINDER"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
//new
    element["template"]="ft8";
return element;

  } else if(element.notificationType=="SUSPENSION"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
//new
    element["template"]="ft9";
return element;

  } else if(element.notificationType=="FIRST_DISCONNECT"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft16";
return element;

  } else if(element.notificationType=="FINAL_DISCONNECT"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft20";
return element;

  } else if(element.notificationType=="TERMINATE"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft24";
return element;

  }
  
}


async function followupexistingCustomer(mydocument,customer,element){
 
  if(element.notificationType=="FIRST_BILL_REMINDER"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft3";
  
    return element;
  } 
  else if(element.notificationType=="FINAL_BILL_REMINDER"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
//new
    element["template"]="ft7";
return element;

  } else if(element.notificationType=="SUSPENSION"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
//new
    element["template"]="ft11";
return element;

  } else if(element.notificationType=="FIRST_DISCONNECT"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft15";
return element;

  } else if(element.notificationType=="FINAL_DISCONNECT"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft19";
return element;

  } else if(element.notificationType=="TERMINATE"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft23";
return element;

  }
  
}

async function followupexistingCustomerOptIn(mydocument,customer,element){
 
  if(element.notificationType=="FIRST_BILL_REMINDER"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft1";
  
    return element;
  } 
  else if(element.notificationType=="FINAL_BILL_REMINDER"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
//new
    element["template"]="ft5";
return element;

  } else if(element.notificationType=="SUSPENSION"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
//new
    element["template"]="ft12";
return element;

  } else if(element.notificationType=="FIRST_DISCONNECT"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft13";
return element;

  } else if(element.notificationType=="FINAL_DISCONNECT"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft17";
return element;

  } else if(element.notificationType=="TERMINATE"){
    element["isSent"] = "No";
    element["excelDate"] = new Date();
    element["template"]="ft21";
return element;

  }
  
}

async function getDataAfterFileRead(filePath){	
  const file = reader.readFile(filePath)	
    let Data = [];	
    const sheets = file.SheetNames;	
    for(let i = 0; i < sheets.length; i++)	
    {	
       const temp = reader.utils.sheet_to_json(	
            file.Sheets[file.SheetNames[i]])	
       temp.forEach((res) => {	
        let obj = {	
        "account_no":res.ACCOUNT_NO,	
        "service_type":res.SERVICE_TYPE,	
        "customerName":res.CUSTOMER_NAME,	
        "mobileNumber":res.CONTACT_NO,	
        "invoiceNumber":res.INVOICE_NUMBER,
        "statementDate":res.STATEMENT_DATE,	
        "paymentDuedate":res.PAYMENT_DUE_DATE,	
        "amount":parseInt(res.AMOUNT),	
        "pdfURL":res.PDF_URL,	
        "billdisp_method":res.BILL_DISP_METH,	
        "notificationType":res.NOTIFICATION_TYPE,
        "reconnection_amount":res.RECONNECTION	
       }	
        Data.push(obj);	
       })	
    }	
    let jsonData = {	
      "rows": Data,	
      "errors":[]	
    }	
    console.log(jsonData.rows.length,"jsonData Rows LENGTH");	
    console.log(JSON.stringify(jsonData),"\n\njsonData ");	
    return jsonData;	
}	

async function deleteUndelivered(){	
  console.log("inside deleteUndelivered");	
     
     await user_notifications.remove({ $or:[{ErrorCode: "63018"},{ErrorCode: "20003"}],twilioStatus: "undelivered" }, function (	
        err,	
        mydocument	
      ) {	
        if (!mydocument) {	
          console.log("undelivered records data not found");	
        } else {	
          console.log("deleted undelivered records from user notifications successfully");	
        }	
      });	
      
    // var mydocument2 = user_notifications.remove(	
    //   {	
    //   twilioStatus: "undelivered",	
    //   ErrorCode:{$or:['63018','20003']},	
    //   optOut:false,	
    //   requested_date: {	
    //   $gte: startDate,	
    //   $lte: endDate,	
    //   },	
    //   Other_channal_optIn : { $nin : ['yes']}	
    //   })	
  }	
  
 async function checkMonthSent(jsonDataxls){	
  	
  let dateobjinfo = await dateTimeController.getStartAndEndDates();	
  console.log("\n\n\ndateobjinfo",JSON.stringify(dateobjinfo));	
  let startDate = dateobjinfo.startDate;	
  let endDate = dateobjinfo.endDate;	
    	
    let rows=[];	
    for(let i=0;i<jsonDataxls.rows.length;i++){	
      let customers= await user_notifications.find({account_no:jsonDataxls.rows[i].account_no,notificationType:jsonDataxls.rows[i].notificationType, isSent:"Yes",excelDate: {$gte:startDate, $lte:endDate}});	
    console.log("customers in month check",customers.length);	
    if(customers.length == 0){	
     rows.push(jsonDataxls.rows[i]);	
    console.log("rowsssss",rows)	
    	
    }else{	
    }	
   }	
   console.log("rowsssss bbefore nonsent data++++",rows)	
    let notSentdata={	
      "rows":rows	
    }	
return notSentdata;	
}

async function getMonthNameFromDate(){
    const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
   ];
 
  const d = new Date();
  let monthName = monthNames[d.getMonth()-1];
if(monthName === undefined){
console.log("undefined");
 const currentYear = new Date().getFullYear(); // 2020
  const previousYear =  currentYear-1;
 console.log(previousYear); // 2019
 
  let month = new Date(previousYear, -1, 1);
 
     monthName = monthNames[month.getMonth()];
 
 }
  return monthName;
  //document.write("The current month is " + monthNames[d.getMonth()]);
  }

 



module.exports.sendWhatsappNotifications = sendWhatsappNotifications;	
module.exports.sendWhatsappNotificationsPhase2 = sendWhatsappNotificationsPhase2;


