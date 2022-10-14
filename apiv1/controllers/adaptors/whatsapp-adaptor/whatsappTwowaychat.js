const twiliAuth = require("../../../config/twilioconfig.json");
const client = require("twilio")(twiliAuth.accountSid, twiliAuth.authToken);
const whatsInboundMessagesModel = require("../../../models/user_request_response.js");
const user_request_response = require("../../../models/user_request_response.js");
const userNotifications = require("../../../models/user_notifications.js");
const fs = require("fs");
const twoway_links = require("../../../config/config.json");
const dateTimeController = require("./dateandtime.js");
const sendEmailalert = require("./emailAlert.js");
const httpLib = require("http");
const customer_details = require("../../../models/customer_details.js");
const Path = require("path");
const winston = require('winston');
const logDir = 'log';

const date= new Date().getTime();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    // new winston.transports.File({ filename: `${logDir}/error${date}.log`, level: 'error' }),
    new winston.transports.File({ filename: `${logDir}/pdffileinfo${date}.log`,level:'info' }),
//new winston.transports.File({ filename: `${logDir}/secondsinfo${date}.log`,level:'info' }),
   
  ],
});

const Axios = require("axios");

const twilio = require("twilio");
const moment = require("moment-timezone");

let whatsappTwowayIntegration = async function (req, res) {
  console.log(
    "req.headers['x-twilio-signature'] is" + req.headers["x-twilio-signature"],
    twiliAuth.authToken
  );
  const twilioSignature = req.headers["x-twilio-signature"];
  const params = req.body;
  const url = twoway_links.publicip_pdf + "/api/messages/whatsapptwoway";

  const requestIsValid = twilio.validateRequest(
    twiliAuth.authToken,
    twilioSignature,
    url,
    params
  );

  if (!requestIsValid) {
    return res.status(401).send("Unauthorized");
  }
 if ( req["body"]["Body"].toUpperCase() == "STOP") {
  //req["body"]["Body"] == "6" ||
  let contact_number = req.body.From.replace("whatsapp:+", "");
  console.log("user selects STOP ", contact_number);
  await customer_details
    .findOneAndUpdate(
      { mobileNumber: contact_number },
      {
        $set: {
          isOptOut: true,
        },
      }
    )
    .then(() => {
      console.log("customer details model Updataed successfully");
      // client.messages.create({
      //   from: req["body"]["To"],
      //   body:"You have been unsubscribed. If You want to subscribe again, please reply *START*",
      //   to: req["body"]["From"],
      // })
    })
    .catch((err) => {
      if (err.status) {
        res.status(err.status).json({ message: err.message });
      } else {
        res.status(500).json({ message: err.message });
      }
    });
}
else{
  // console.log("req from whatsapp two way communication", req.body);
  let contact_number = req.body.From.replace("whatsapp:+", "");
  let optoutWhatsapp = await customer_details.find({ mobileNumber: contact_number, isOptOut: false })
  console.log("optoutWhatsapp false",optoutWhatsapp);
  if(optoutWhatsapp != null){
  console.log("optoutwhatsapp not null");
    let optoutPaperbill = await user_request_response.find({ mobileNumber: contact_number, optOut: true })
    console.log("optoutPaperbill true",optoutPaperbill.length);
        if (optoutPaperbill != null && optoutPaperbill.length!=0){
          console.log("optout paper bill");
          await paperBillOptout(req);
        

           }
        else{
          console.log("optoutpaper nooo");
          await paperBillNotOptout(req);
            }
}
else{
  console.log(" opt out whatsappp");
}
}
}


async function paperBillOptout(req){
  //if (req["body"]["Body"] === "2" ||req["body"]["Body"].toUpperCase() == "TWO") {
  //  sendDetails(req);
 // }
 // else
 if (
    req["body"]["Body"] === "1" ||
    req["body"]["Body"].toUpperCase() == "ONE" ) {
      sendPDFoptOut(req);
    } 
    else {
      let contact_number = req.body.From.replace("whatsapp:+", "");
      customer_details.find(
        { mobileNumber: contact_number, isOptOut: false },
        async function (err, mydocument) {
          console.log("mydocoument in 2", mydocument);
          if (mydocument.length > 0) {
            console.log("Rather than 1, 2, 3 requests from customer");
 let obj1=  {  
            mobileNumber:contact_number,
               requested_message : "Others",
               message_body:req["body"]["Body"]
                   }    
         var user_request_response1 = new user_request_response(obj1);
         await user_request_response1.save().then((item) => {

           console.log("stored other response in user_request_response"); })

         .catch((err) => {

           res.status(400).send
          } );

            client.messages.create({
              from: req["body"]["To"],
              body:
                "Please select 1 or contact Customer Support Chat https://gtt.co.gy",
              to: req["body"]["From"],
            });
          } else {
            console.log("user optout");
          }
        }
      );
    }
  
}



async function paperBillNotOptout(req){
  if (req["body"]["Body"] === "2" ||req["body"]["Body"].toUpperCase() == "TWO") {
    sendDetails(req);
  }
  else if (
    req["body"]["Body"] === "1" ||
    req["body"]["Body"].toUpperCase() == "ONE" ||
    req["body"]["Body"] === "3" ||
    req["body"]["Body"].toUpperCase() == "THREE"
  ) {
    sendPDF(req);
  } 
  
 
  
  else {
    let contact_number = req.body.From.replace("whatsapp:+", "");
    customer_details.find(
      { mobileNumber: contact_number, isOptOut: false },
      async function (err, mydocument) {
        console.log("mydocoument in 2", mydocument);
        if (mydocument.length > 0) {
          console.log("Rather than 1, 2, 3 requests from customer");
 let obj1=  {  
            mobileNumber:contact_number,
               requested_message : "Others",
               message_body:req["body"]["Body"]
                   }    
         var user_request_response1 = new user_request_response(obj1);
         await user_request_response1.save().then((item) => {

           console.log("stored other response in user_request_response"); })

         .catch((err) => {

           res.status(400).send
          } );

          client.messages.create({
            from: req["body"]["To"],
            body:
              "Please select 1, 2, 3 - or contact Customer Support Chat https://gtt.co.gy",
            to: req["body"]["From"],
          });
        } else {
          console.log("user optout");
        }
      }
    );
  }
}


async function downloadImage(
  pdf,
  req,
  servicetype,
  account_no,
  contact_number
) {
  console.log("::7::");
  console.log("download function");
  // const url = 'https://unsplash.com/photos/AaEQmoufHLk/download?force=true'
  const path = Path.resolve(
    __dirname,
    "../../../../public",
    contact_number + servicetype + ".pdf"
  );
  console.log("path in download", path, pdf);
  const file = fs.createWriteStream(path);
  const response = await Axios({
    url: pdf,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(file);

  return new Promise((resolve, reject) => {
    file.on("finish", resolve);
    file.on("error", reject);
  });
}


async function sendPDFoptOut(req){

  let pdfURL = [];
  let contact_number = req.body.From.replace("whatsapp:+", "");

  let latestDateInfo = await getlatestMonth(contact_number);

  let latestMonth = latestDateInfo.month;
  let latestYear = latestDateInfo.year;
  var startDate1 = new Date(latestYear, latestMonth - 1);

  let startDate = moment(startDate1)
    .startOf("month")
    .set("hour", 00)
    .set("minute", 00)
    .set("second", 00)
    .format();
  let endDate = moment(startDate1)
    .endOf("month")
    .set("hour", 23)
    .set("minute", 59)
    .set("second", 59)
    .format();

  console.log( "start date and end date pdf",startDate, endDate, contact_number);

  pdfURL = await userNotifications.find(
    {
      mobileNumber: contact_number,
      sentDate: {
        $gte: startDate,
        $lte: endDate,
      },
      isSent:"Yes"
    },
    function (err, mydocument) {}
  );
 
  if (pdfURL.length > 0) {
     const key = 'account_no';
    const arrayUniqueByKey = [...new Map(pdfURL.map(item =>
  [item[key], item])).values()];
  pdfURL=arrayUniqueByKey;
  // console.log("pdf url**********************", pdfURL);
    for (let i = 0; i <= pdfURL.length; i++) {
  
       console.log("pdf url", pdfURL[i].pdfURL);
        let pdf = pdfURL[i].pdfURL;
        let servicetype = pdfURL[i].service_type.replace(/ /g, "");
        let account_no = pdfURL[i].account_no;
        
        const fileName = contact_number + servicetype + ".pdf";
        const file = fs.createWriteStream("./public/" + fileName);
       

        try {
          
          await downloadImage(
            pdf,
            req,
            servicetype,
            account_no,
            contact_number
          );
          
          await sendPDFToUser(req, servicetype, account_no);
        } catch (err) {
          
          console.log("error in download pdf function", err);
           await sendErrorResponse(req, servicetype, account_no);
        }
        
      
    }
  } else {
    console.log("Sorry we couldn't find your bill");
    await sendErrorResponse(req, servicetype, account_no);
  }
}

async function sendPDF(req) {
  let contact_number = req.body.From.replace("whatsapp:+", "");
  await customer_details.find(
    { mobileNumber: contact_number, isOptOut: false },
    async function (err, mydocument) {
      console.log("mydocoument in 1 & 3", mydocument);
      if (mydocument.length > 0) {
        let pdfURL = [];
        let contact_number = req.body.From.replace("whatsapp:+", "");

        let latestDateInfo = await getlatestMonth(contact_number);

        let latestMonth = latestDateInfo.month;
        let latestYear = latestDateInfo.year;
        var startDate1 = new Date(latestYear, latestMonth - 1);

        let startDate = moment(startDate1)
          .startOf("month")
          .set("hour", 00)
          .set("minute", 00)
          .set("second", 00)
          .format();
        let endDate = moment(startDate1)
          .endOf("month")
          .set("hour", 23)
          .set("minute", 59)
          .set("second", 59)
          .format();

        console.log(
          "start date and end date pdf",
          startDate,
          endDate,
          contact_number
        );
        pdfURL = await userNotifications.find(
          {
            mobileNumber: contact_number,
            sentDate: {
              $gte: startDate,
              $lte: endDate,
            },
            isSent:"Yes"
          },
          function (err, mydocument) {}
        );
        
        if (pdfURL.length > 0) {
          const key = 'account_no';
          const arrayUniqueByKey = [...new Map(pdfURL.map(item =>
        [item[key], item])).values()];
        pdfURL=arrayUniqueByKey;
          for (let i = 0; i <= pdfURL.length; i++) {
            if (pdfURL.length == i) {
              if (req["body"]["Body"] == 1 || req["body"]["Body"].toUpperCase() == "ONE") {
                await sleep(5000);
                client.messages.create({
                  from: req["body"]["To"],
                  body:
                    "By selecting 1, you have opted to receive your invoices via WhatsApp monthly. Chat with our Support Agents about accessing bills via email or Mygtt.",
                  to: req["body"]["From"],
                });
              }
            } else {

              console.log("pdf url", pdfURL[i].pdfURL);
              let pdf = pdfURL[i].pdfURL;
              let servicetype = pdfURL[i].service_type.replace(/ /g, "");
              let account_no = pdfURL[i].account_no;
              
              const fileName = contact_number + servicetype + ".pdf";
              const file = fs.createWriteStream("./public/" + fileName);
             

              try {
                
                await downloadImage(
                  pdf,
                  req,
                  servicetype,
                  account_no,
                  contact_number
                );
                
                await sendPDFToUser(req, servicetype, account_no);
              } catch (err) {
                
                console.log("error in download pdf function", err);
                 await sendErrorResponse(req, servicetype, account_no);
              }
              //   await httpLib
              //     .get(pdf, async (response) => {
              //       console.log("::5::");
              //       response.pipe(file);
              //       response.on("error", async (err) => {
              //         console.log("Error in write stream...", err);
              //         await sendErrorResponse(req, servicetype, account_no);
              //       });
              //       response.on("end", async () => {
              //         console.log("::6::");
              //         await sendPDFToUser(req, servicetype, account_no);
              //       });
              //     })

              //     .on("error", async (err) => {
              //       console.log("err in accessing pdf file" + err);
              //       await sendErrorResponse(req, servicetype, account_no);
              //     });
            }
          }
        } else {
          console.log("Sorry we couldn't find your bill");
          await sendErrorResponse(req, servicetype, account_no);
        }
      } else {
        console.log("user optout");
      }
    }
  );
}

async function getlatestMonth(contact_number) {
  let latestData = await userNotifications
    .find({ mobileNumber: contact_number })
    .sort({ sentDate: -1 })
    .limit(1);
  let latestDate = latestData[0].sentDate;

  let latestInfo = {
    month: latestDate.getMonth() + 1,
    year: latestDate.getFullYear(),
  };

  return latestInfo;
}


async function sendDetails(req) {
  let contact_number = req.body.From.replace("whatsapp:+", "");
  await customer_details.find(
    { mobileNumber: contact_number, isOptOut: false },
    async function (err, mydocument) {
      console.log("mydocoument in 1 & 3", mydocument);
      if (mydocument.length > 0) {
        let customerDetails = [];
        let contact_number = req.body.From.replace("whatsapp:+", "");

        let latestDateInfo = await getlatestMonth(contact_number);

        let latestMonth = latestDateInfo.month;
        let latestYear = latestDateInfo.year;
        var startDate1 = new Date(latestYear, latestMonth - 1);

        let startDate = moment(startDate1)
          .startOf("month")
          .set("hour", 00)
          .set("minute", 00)
          .set("second", 00)
          .format();
        let endDate = moment(startDate1)
          .endOf("month")
          .set("hour", 23)
          .set("minute", 59)
          .set("second", 59)
          .format();

        console.log(
          "start date and end date pdf",
          startDate,
          endDate,
          contact_number
        );
        customerDetails = await userNotifications.find(
          {
            mobileNumber: contact_number,
            sentDate: {
              $gte: startDate,
              $lte: endDate,
            },
            isSent:"Yes",
	twilioStatus : { $nin : ['failed','undelivered']}
          },
          function (err, mydocument) {}
        );
        console.log("customer details",customerDetails);
        if (customerDetails.length > 0) {
          const key = 'account_no';
          const arrayUniqueByKey = [...new Map(customerDetails.map(item =>
        [item[key], item])).values()];
        customerDetails=arrayUniqueByKey;

          for (let i = 0; i <= customerDetails.length; i++) {
              let amount1 = customerDetails[i].amount;
              let account_no = customerDetails[i].account_no;
              let service_type = customerDetails[i].service_type;
             await senddetailsToUser(req,amount1,account_no,service_type); 

                
          }
        } else {
          console.log("Sorry we couldn't find your Data");
          
        }
      } else {
        console.log("user optout");
      }
    }
  );
}

async function sendPDFToUser(req, servicetype, account_no) {
  console.log("::8::");
  return new Promise(async (resolve, reject) => {
    console.log("sending pdf to whatsapp");
    let optout = false;
    if (req["body"]["Body"] == 3 || req["body"]["Body"].toUpperCase() == "THREE") {
      optout = false;
    } else {
      optout = true;
    }

    let contact_number = req.body.From.replace("whatsapp:+", "");
logger.info('seconds in before sending pdf '+ new Date());
    await client.messages
      .create({
        from: req["body"]["To"],
        mediaUrl:
          twoway_links.publicip_pdf +
          "/" +
          contact_number +
          servicetype +
          ".pdf",
        to: req["body"]["From"],
      })
      .then(async (messages) => {
logger.info('seconds in after sending pdf '+ new Date());
        console.log("messagess", messages);
        let dateObj = await dateTimeController.getDateAndTime();

        let contact_number = req.body.From.replace("whatsapp:+", "");
        let whatsInboundMessages = {
          mobileNumber: contact_number,
          requested_date: dateObj.date,
          messageType: "Invoice",
          requested_message: "pdfBill",
          optOut: optout,
          account_no: account_no,
          service_type: servicetype,
          sent_date: dateObj.date,
          messageSent: "Success",
          whatsapp_msgid: messages.sid,
        };

        let whatsInboundMessagesModel1 = new whatsInboundMessagesModel(
          whatsInboundMessages
        );

        await whatsInboundMessagesModel1
          .save()

          .then(async() => {
            console.log("whatsapp_message model Updataed successfully");
            if(optout === true){
              await customer_details.findOneAndUpdate({mobileNumber:contact_number },
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
              }
    
              
            resolve();
          })
          .catch((err) => {
            if (err.status) {
              console.log("errrrr", err);
              resolve();
            } else {
              console.log("errrrr", err);
              resolve();
            }
          });
      });
  });
}

async function senddetailsToUser(req,amount1,account_no,service_type) {
  
  return new Promise(async (resolve, reject) => {
    console.log("sending details to whatsapp");
    let message;
    if(amount1 >0){
       message=" Your *"+service_type+"* account number is *"+account_no+"*. \nYour balance is *$"+amount1.toFixed(2)+"*.";
    }else{
      message="Your *"+service_type+"* account number is *"+account_no+"*.\nYour balance is *$"+amount1.toFixed(2)+"*.";
     }
    await client.messages
      .create({
        from: req["body"]["To"],
        body: message,
        to: req["body"]["From"],
      })
      .then(async (messages) => {
        console.log("messagess", messages);
        let dateObj = await dateTimeController.getDateAndTime();

        let contact_number = req.body.From.replace("whatsapp:+", "");
        let whatsInboundMessages = {
          mobileNumber: contact_number,
          requested_date: dateObj.date,
          messageType: "Invoice",
          requested_message: "Account&Amount",
          optIn:true,
          account_no: account_no,
          service_type: service_type,
          sent_date: dateObj.date,
          messageSent: "Success",
          whatsapp_msgid: messages.sid,
        };

        let whatsInboundMessagesModel1 = new whatsInboundMessagesModel(
          whatsInboundMessages
        );

        await whatsInboundMessagesModel1
          .save()

          .then(() => {
            console.log("whatsapp_message model Updataed successfully");
            resolve();
          })
          .catch((err) => {
            if (err.status) {
              console.log("errrrr", err);
              resolve();
            } else {
              console.log("errrrr", err);
              resolve();
            }
          });
      });
  });
}



async function sendErrorResponse(req, servicetype, account_no) {
  let optout = false;

  client.messages
    .create({
      from: req["body"]["To"],
      body:
        "We are sorry, your " +
        servicetype +
        " account " +
        account_no +
        " invoice is not available right now. We are looking into this. Please check back later",

      to: req["body"]["From"],
    })
    .then(async (messages) => {
      console.log("messagess", messages);
      let dateObj = await dateTimeController.getDateAndTime();

      let contact_number = req.body.From.replace("whatsapp:+", "");
      let whatsInboundMessages = {
        mobileNumber: contact_number,
        requested_date: dateObj.date,
        messageType: "Invoice",
        requested_message: "pdfBill",
        optOut: optout,
        account_no: account_no,
        service_type: servicetype,
        sent_date: dateObj.date,
        messageSent: "PDF not found",
        whatsapp_msgid: messages.sid,
      };

      let whatsInboundMessagesModel1 = new whatsInboundMessagesModel(
        whatsInboundMessages
      );

      await whatsInboundMessagesModel1
        .save()
        .then(() => {
          console.log("whatsapp_message model Updataed successfully");
        })
        .catch((err) => {
          if (err.status) {
            console.log("errrrr", err);
            res.status(err.status).json({ message: err.message });
          } else {
            console.log("errrrr", err);
            res.status(500).json({ message: err.message });
          }
        });
    });
  let info = {
    subject: "PDF File Not found",
    message:
      "We are unable to access the pdf file, below are the customer details\n AccountNumber: " +
      account_no +
      "\n" +
      "ServiceType: " +
      servicetype,
  };
  sendEmailalert.sendEmails(info);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


module.exports.getlatestMonth = getlatestMonth;
module.exports.whatsappTwowayIntegration = whatsappTwowayIntegration;
