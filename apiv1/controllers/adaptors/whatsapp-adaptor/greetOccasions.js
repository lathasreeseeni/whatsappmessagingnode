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

let count=0;
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const date= new Date().getTime();



const schema = {
  ACCOUNT_NO: {
  prop: "account_no",
  type: Number,
  },
  SERVICE_TYPE: {
  prop: "service_type",
  type: String,
  },
  CUSTOMER_NAME: {
  prop: "customerName",
  type: String,
  },
  
  CONTACT_NO: {
  prop: "mobileNumber",
  type: String,
  },
  INVOICE_NUMBER: {
  prop: "invoiceNumber",
  type: Number,
  },
  STATEMENT_DATE: {
  prop: "statementDate",
  type: Date,
  },
  PAYMENT_DUE_DATE: {
  prop: "paymentDuedate",
  type: Date,
  },
  AMOUNT: {
  prop: "amount",
  type: Number,
  },
  PDF_URL: {
  prop: "pdfURL",
  type: String,
  },
  BILL_DISP_METH:{
    prop:"billdisp_method",
    type: String,
  },
  NOTIFICATION_TYPE:{
    prop:"notificationType",
    type:String,
  },
RECONNECTION:{
prop:"reconnection_amount",
type:Number,
},

 };

 const sendWhatsappgreeting = async function (req, res) {
    // cron.schedule('21 21 * * *',async function (req, res) {

  console.log("Cron job started for greetings ");
  
  try{

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
      let jsonData = await readXlsxFile(filePath, { schema })
    //    const file = reader.readFile(filePath)
    //    let Data = [];
    //    const sheets = file.SheetNames;
    //   for(let i = 0; i < sheets.length; i++){
    //    const temp = reader.utils.sheet_to_json(
    //    file.Sheets[file.SheetNames[i]])
    //     temp.forEach((res) => {
    //      Data.push(res)
    //      })
    //     }

    //   let jsonData = {
    //     "rows": Data
    //         }

        if(jsonData.rows.length>0){
            console.log("Data inserted",jsonData.rows);
         //await user_notifications.insertMany(jsonData.rows).then(function(){
           await tempexceldataModel.insertMany(jsonData.rows).then(function(){
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
        let i = 0;
     while((customers = await getPendingrecords(i)).length > 0){
      i = i+8;
      console.log("customers", customers);
     for(let i=0;i<customers.length;i++){
       let customer= customers[i];
      
      if (customer.mobileNumber!== "" && customer.mobileNumber !== undefined ) {
        await sendwhatsappNotification(customer);  
    } 
      else {
        console.log("Mobile number empty ");
        let dateObj = await dateTimeController.getDateAndTime();
        let twiliostatus = {
        
          "mobileNumber" :  customer.mobileNumber,
          "isSent" : "Yes",
          "messageSent" : "failed",
          "messageType" : "Greetings",
          "sentDate" : dateObj.date
         
         
         
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

}else{
  console.log("There is no Files In Processing folder");
   let info ={
     "subject":"Empty Folder alert to send whatspp Notifications",
     "message":" There is no file to send whatspp notifications. Please check."
   }
    sendEmailalert.sendEmails(info);
}

});

  } catch(err){
    console.log("error in service",err);
    res.send(err);
  }
   
}
//   );


 
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
  
  let customers= await tempexceldataModel.find({}).skip(i).limit(scheduleJson.sendRecodsLimit);
   //let customers= await tempexceldataModel.find({isSent:sentFlag,excelDate: {$gte:startDate, $lte:endDate}}).limit(scheduleJson.sendRecodsLimit);
  //let customers= await user_notifications.find({"twilioStatus" : "undelivered"}).limit(scheduleJson.sendRecodsLimit);
 
  return customers;
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
  }

 async function sendwhatsappNotification(customer) {
  return new Promise((resolve,reject) => {
   try{
    
   let dueDate=moment(customer.paymentDuedate).format('DD/MM/YYYY');    
   // let monthName = await getMonthNameFromDate();
//console.log("monthName is in greetoccassion  "+monthName);
//console.log("dueDateis in greet  "+monthName);
   
	console.log("Before sleep sending notifications", customer);
let currentyear = new Date().getFullYear();
 console.log("currentyear is in fallback  "+currentyear );
    let mobilenumber=customer.mobileNumber.replace(/ /g,'');

    //let monthName = "";



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

console.log("monthName is in greetoccassion111  "+monthName);
console.log("dueDateis in greet111  "+monthName);
const d1 = new Date();
let modemCurrentDate=moment(d1).format('DD/MM/YYYY'); 

    //let dueDate = "dueDate";
    // console.log("seconds in sending ",new Date());
    amount="9898";
    client.messages
    .create({
      to: "whatsapp:+" +mobilenumber,
      from: twiliAuth.twilio_number,
     // body: "Happy Holidays from GTT!\nThank you for making this year so great and we look forward to serving you in the New Year.\nWishing you and yours a Merry Christmas and a Prosperous 2022.\nTogether We Celebrate, you, me and GTT!\n\nEshwar Thakurdin\nChief Operations Officer,\nHome Solutions and Fixed Networks"
    // body:"Dear *{{1}}*,\n\nHere is a reminder that Your *{{2}}* bill, account *{{3}}*, for the month of *{{4}}* 2021 is ready and is due on *{{5}}*. Pay the balance of *$"+amount+"* to stay connected.\n\nWe encourage you to make your payment soon to avoid service disruption.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service." 
 // body:"Dear *Latha*,\n\nHere is a reminder that your *DSL* bill for the month of *DEC* 2021 is ready and is due on *dueDate*.\n\nWe encourage you to make your payment soon to avoid service disruption.\n\nPlease enter your selection on your keypad:\n\n1.Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT kiosks, MMG, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp." 
//body:"Dear *REGINAL LESLIE*,\n\nYour *Landline* service has been suspended for non-payment. Pay the outstanding balance today to have your service reconnected.\n\nPlease enter your selection on your keypad:\n\n1. Only download your bill\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT Kiosks, MMG, MyGTT, Bill Express, Surepay, at Commercial Banks or our Retail Stores nationwide.\n\nPlease disregard this reminder if your bill has already been paid.\n\nThank you for choosing our WhatsApp Billing service."
 //body:"Dear *{{1}}*,\n\nYour *{{2}}* service has been suspended for non-payment. Pay the outstanding balance today to have your service reconnected.\n\nPlease enter your selection on your keypad:\n\n1. Only download your bill\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using GTT Kiosks, MMG, MyGTT, Bill Express, Surepay, at Commercial Banks or our Retail Stores nationwide.\n\nPlease disregard this reminder if your bill has already been paid.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
//body:"Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance due before *"+dueDate+"*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using MMG, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp."
//body:"Dear *"+customer.customerName+"*,\n\nHere is a reminder that Your *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance of *$"+amount.toFixed(2)+"* before the due date *"+dueDate+"* to stay connected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service."
//body:"Dear *"+customer.customerName+"*,\n\nHere is a reminder that Your *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance of *$"+amount+"* before the due date *"+dueDate+"* to stay connected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
//body:"Dear *{{1}}*,\n\nThis is the *final* reminder that your *{{2}}* bill for the month of *{{3}}* *{{4}}* has a balance that was due on *{{5}}*.\n\n*We encourage you to make your payment before the 17th to stay connected*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
//body:"Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service, account *"+customer.account_no+"*, has been suspended for non-payment. Pay the outstanding balance of *$"+amount+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
//body:"Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. The balance of *$"+amount+"* is due on *"+dueDate+"*. Pay this amount to stay connected.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service."
//body:"Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Your balance is *$"+customer.amount+"*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
//body:"Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Your balance is *$"+customer.amount+"*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
//body:"Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of *$"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
//body:"Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of *$"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid.\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill \n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
 //body:"Dear *"+customer.customerName+"*,\n\nThis is the *final* reminder that your *"+customer.service_type+"* bill for the month of *"+monthName+"* *"+currentyear+"* has a balance that was due on *"+dueDate+"*.\n\n*We encourage you to make your payment now to stay connected and avoid being charged a reconnection fee of *$"+customer.reconnection_amount+"*.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill \n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
//body:"Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service, account *"+customer.account_no+"*, has been suspended for non-payment. Pay the outstanding balance of *$"+customer.amount+"* and reconnection fee of *$"+customer.reconnection_amount+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service."
// body:"Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service has been suspended for non-payment. Pay the outstanding balance and reconnection fee of *$"+customer.reconnection_amount+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter your selection on your keypad:\n\n1. Download your bill and opt out of paper bills\n2. Retrieve your account number and pending balance\n3. Only download your bill\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp."
//body:"Dear *"+customer.customerName+"*,\n\nHere is a reminder that Your *"+customer.service_type+"* bill, account *"+customer.account_no+"*, for the month of *"+monthName+"* *"+currentyear+"* is ready. Pay the balance of *$"+customer.amount+"* before the due date *"+dueDate+"* to stay connected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service.\n\nBy replying to this message, you are opting in to receive your account information from GTT on WhatsApp. You can unsubscribe at any time by replying *STOP*."
body:"Dear *"+customer.customerName+"*,\n\nYour *"+customer.service_type+"* service, account *"+customer.account_no+"*, has been suspended for non-payment. Pay the outstanding balance of *$"+customer.amount+"* and reconnection fee of *$"+customer.reconnection_amount+"* today to have your service reconnected.\n\n*Please disregard this reminder if your bill has already been paid*.\n\nPlease enter 1 and press send on your keypad to download your bill.\n\nYou can pay using mmg+, GTT Kiosks, MyGTT, Bill Express, Surepay, at commercial banks or our Retail Stores nationwide.\n\nThank you for choosing our WhatsApp Billing service."
})
    .then(async(messages) => {
     
  
    let twiliostatus = {
     
      "mobileNumber" :  customer.mobileNumber,
      "isSent" : "Yes",
    
      "messageSent" : "success",
      "messageType" : "Greetings",
     
     "whatsapp_msgid" : messages.sid,
      "reconnection_amount":customer.reconnection_amount,
          };
          console.log("twilio status",twiliostatus);
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
         

      }else if(err.code =="20003"){
        let info ={
          "subject":"Twilio Permission Denied ",
          "message":"Twilio Permission Denied due to insufficient founds in account "+err
        }
       await sendEmailalert.sendEmails(info);
         resolve();
        

      }
else{
      let info ={
        "subject":"Twilio Server is down",
        "message":"Twilio Server down RestException "+err
      }
     await sendEmailalert.sendEmails(info);
       resolve();
      
    }
    });
  
  
}catch(err){
  console.log("catch errr",err);
   
}

  });

}


 module.exports.sendWhatsappgreeting = sendWhatsappgreeting;


