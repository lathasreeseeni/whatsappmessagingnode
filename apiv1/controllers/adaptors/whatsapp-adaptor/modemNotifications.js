const user_notifications = require("../../../models/user_notifications.js");

const mv = require('mv');
const fs =require("fs");
const twiliAuth = require("../../../config/twilioconfig.json");
const client = require("twilio")(twiliAuth.accountSid, twiliAuth.authToken);
const dir = './apiv1/controllers/adaptors/whatsapp-adaptor/Processingfile';
const sendEmailalert= require("./emailAlert.js");
const logDir = 'log';
const dateTimeController = require('./dateandtime.js');
const cron = require('node-cron');

const scheduleJson= require("../../../config/jobSchedulingConfig.json");


const tempexceldataModel = require("../../../models/tempexceldata.js");
const reader = require('xlsx');
const moment = require('moment-timezone');


// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}



 const sendModemnotifications = async function (req, res) {
    // cron.schedule('21 21 * * *',async function (req, res) {

  console.log("Cron job started for modemnotifications ");
  
 
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
      
    /**New Code to read more than 1 lakh records from xlsfile*/
    let jsonData = await getDataAfterModemFileRead(filePath);

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
          "messageType" : "ModemNotification",
          "sentDate" : dateObj.date
         
         
         
        };
        let twiliostatusModel1 = new user_notifications(twiliostatus);
        await twiliostatusModel1.save()
        .then((twiliostatus) => {
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



 async function sendwhatsappNotification(customer) {
  return new Promise((resolve,reject) => {
   try{

    let dueDate=moment(customer.paymentDuedate).format('DD/MM/YYYY');    
    console.log("Before sleep sending notifications", customer);
    let currentyear = new Date().getFullYear();
     console.log("currentyear is in fallback  "+currentyear );


        const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
        ];

        const d = new Date();
        // let monthName = monthNames[d.getMonth()-1];
        // if(monthName === undefined){
        // console.log("undefined");
        // const currentYear = new Date().getFullYear(); // 2020
        // const previousYear =  currentYear-1;
        // console.log(previousYear); // 2019

        // let month = new Date(previousYear, -1, 1);

        // monthName = monthNames[month.getMonth()];

        // }
        // console.log("monthName is in greetoccassion111  "+monthName);
        let modemCurrentDate=moment(d).format('DD/MM/YYYY');  
        console.log("dueDateis in greet111  "+modemCurrentDate);
    // console.log("Before sleep sending notifications", customer);
       
    let mobilenumber=customer.mobileNumber.replace(/ /g,'');
    
    client.messages
    .create({
      to: "whatsapp:+" +mobilenumber,
      from: twiliAuth.twilio_number,
      //body:"Happy Holidays from GTT!\nThank you for making this year so great and we look forward to serving you in the New Year.\nWishing you and yours a Merry Christmas and a Prosperous 2022.\nTogether We Celebrate, you, me and GTT!\n\nEshwar Thakurdin\nChief Operations Officer,\nHome Solutions and Fixed Networks"
   // body:"Dear *"+customer.customerName+"*,\n\nGTT continues to do more to improve your internet service experience, so that we can bring you the best speed and service quality.\n\nIn keeping with our promise, to reliably connect our customers, we would like to offer you a new replacement *modem free* of cost.\n\nTo uplift, simply visit any of our retail stores nationwide, from *"+modemCurrentDate+"*, and provide them with your landline number and ID card.\n\nIf someone is uplifting the modem on your behalf, kindly provide us with a letter of authorization, a copy of your ID and the authorized person ID.\n\nThank you!"
  body:"Dear GTT Customer,\n\nYou have been identified as one of our valued customers who need a *SIM* upgrade since your current SIM is not 4G LTE compatible.\n\nUpgrade your GTT SIM and get a 5GB monthly plan absolutely FREE!\n\nVisit one of our GTT Retail Stores today, with an acceptable form of identification, to swap your SIM and enjoy superfast data on our 4G LTE mobile network.\n\nWhat are you waiting for? Let GTT upgrade you and start browsing and streaming faster!",
//"Dear *"+customer.customerName+"*,\n\nGTT continues to do more to improve your internet service experience, so that we can bring you the best speed and service quality.\n\nIn keeping with our promise, to reliably connect our customers, we would like to offer you a new replacement *modem free* of cost.\n\nTo uplift, simply visit any of our retail stores nationwide, from *"+modemCurrentDate+"*, and provide them with your landline number and ID card.\n\nIf someone is uplifting the modem on your behalf, kindly provide us with a letter of authorization, a copy of your ID and the authorized person ID.\n\nThank you!", 
  })
    .then(async(messages) => {
     
  
    let twiliostatus = {
     
      "mobileNumber" :  customer.mobileNumber,
      "isSent" : "Yes",
      "messageSent" : "success",
      "messageType" : "sim_swap_2022",
     
     "whatsapp_msgid" : messages.sid,
          };
          console.log("twilio status",twiliostatus);
    let twiliostatusModel1 = new user_notifications(twiliostatus);
    await twiliostatusModel1.save()
    .then((twiliostatus) => {
    
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

async function getDataAfterModemFileRead(filePath){
  const file = reader.readFile(filePath)
    let Data = [];
    const sheets = file.SheetNames;
    for(let i = 0; i < sheets.length; i++)
    {
       const temp = reader.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]])
       temp.forEach((res) => {
        let obj = {
        // "account_no":res.ACCOUNT_NUMBER,
        //"service_type":res.SERVICE_TYPE,
        "customerName":res.CUSTOMER_NAME,
        "mobileNumber":res.CONTACT1_PHONE,
        // "invoiceNumber":res.INVOICE_NUMBER,
        // "paymentDuedate":res.PAYMENT_DUE_DATE,
        // "amount":parseInt(res.AMOUNT),
        // "pdfURL":res.PDF_URL,
        // "billdisp_method":res.BILL_DISP_METH,
        // "notificationType":res.NOTIFICATION_TYPE
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



 module.exports.sendModemnotifications = sendModemnotifications;


