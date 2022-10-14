"use strict";
const user_notificationsModel = require("../../../models/user_notifications.js");
const user_request_responseModel = require("../../../models/user_request_response.js");
const detailed_twilio_summaryModel = require("../../../models/detailed_twilio_summary.js");
const dateTimeController = require("./dateandtime.js");
const twoway_links = require("../../../config/config.json");
const twiliAuth = require("../../../config/twilioconfig.json");
const customer_details = require("../../../models/customer_details.js");

const fs = require("fs");
const twilio = require("twilio");
const moment = require("moment-timezone");

let whatsappStatus = async function (req, res) {
  try {
    console.log("whatsapp status +++++++++++++", req.body);
    const twilioSignature = req.headers["x-twilio-signature"];
    const params = req.body;
    const url = twoway_links.publicip_pdf + "/api/messages/status";

    const requestIsValid = twilio.validateRequest(
      twiliAuth.authToken,
      twilioSignature,
      url,
      params
    );

    if (!requestIsValid) {
      return res.status(401).send("Unauthorized");
    }
    let mydocument = user_request_responseModel.findOne(
      { whatsapp_msgid: req.body.SmsSid },
      function (err, mydocument) {
        let smsdatastatus = {};
        console.log("my documentt", mydocument);
        if (err) console.log("err", err);
        if (mydocument != null) {
          if (mydocument.requested_message == "pdfBill") {
            let contact_number = req.body.To.replace("whatsapp:+", "");

            let servicetype = mydocument.service_type;
            fs.unlink(
              "./public/" +
                contact_number +
                servicetype.replace(/ /g, "") +
                ".pdf",
              (err) => {
                if (err) {
                  console.log("failed to delete file:" + err);
                } else {
                  console.log("successfully deleted the file");
                }
              }
            );
          }
        } else {
          console.log("document null for pdf");
        }
      }
    );

    let twilio_document = user_notificationsModel.findOne(
      { whatsapp_msgid: req.body.SmsSid },
      async function (err, twilio_document) {
        if (err) {
          console.log("True");
        }
        if (twilio_document != null) {
          console.log("myyy", twilio_document);
          let dateObj = await dateTimeController.getDateAndTime();
          let twiliostatus = {
            customerName: twilio_document.customerName,
            billAmount: twilio_document.billAmount,
            dueDate: twilio_document.dueDate,
            mobileNumber: twilio_document.mobileNumber,
            service_type: twilio_document.service_type,
            account_no: twilio_document.account_no,
            invoiceNumber: twilio_document.invoiceNumber,
            statementDate: twilio_document.statementDate,
            messageType: twilio_document.messageType,
            sentDate: twilio_document.sentDate,
            billdisp_method: twilio_document.billdisp_method,
            messageSent: twilio_document.messageSent,
            whatsapp_msgid: twilio_document.whatsapp_msgid,
            twilioStatus: req.body.SmsStatus,
            updateDate: dateObj.date,
            pdfURL: twilio_document.pdfURL,
            ErrorMessage: req.body.ErrorMessage,
            ErrorCode: req.body.ErrorCode,
            notificationType:req.body.notificationType,
            template:req.body.template,
            reconnection_amount:req.body.reconnection_amount
          };

          let twiliostatusModel1 = new detailed_twilio_summaryModel( twiliostatus );

          twiliostatusModel1 .save()
            .then((item) => {
              console.log(
                "detailed twilio summary model saved successfully" + item
              );
            })
            .catch((err) => {
              console.log("unable to save to database");
            });
        } else {
          console.log("No Record");
        }
      }
    );

    let dateObj = await dateTimeController.getDateAndTime();
    console.log("date objj", dateObj, req.body);
//     let userDocument1 =  await user_notificationsModel.findOneAndUpdate({ whatsapp_msgid: req.body.SmsSid },
//             {
//               "$set": {
//                "twilioStatus": req.body.SmsStatus,
//                "ErrorMessage":req.body.ErrorMessage,
//                "updateDate": dateObj.date,
//               }
//              });

   let userDocument1 = await user_notificationsModel.findOne({
      whatsapp_msgid: req.body.SmsSid,
    });
    if (userDocument1) {
      console.log("userdocument1", userDocument1);
      (userDocument1.updateDate = dateObj.date),
        (userDocument1.twilioStatus = req.body.SmsStatus),
        (userDocument1.ErrorMessage = req.body.ErrorMessage);
        (userDocument1.ErrorCode= req.body.ErrorCode);
      let updatedUserDocument = await userDocument1.save();

      console.log("userdocument1", userDocument1);
      console.log("updatedUserDocument", updatedUserDocument);
      await UpdateCustomerDetails(updatedUserDocument);
    }
  } catch (err) {
    console.log("errr", err);
  }
};

async function UpdateCustomerDetails(userDocument1) {
  
  console.log("update customer details", userDocument1.twilioStatus);
  try {
	
    if (userDocument1.twilioStatus == "failed" || userDocument1.twilioStatus == "undelivered") {
      console.log("twilio status failed");
	let mobilenumber = userDocument1.mobileNumber;
	await customer_details
        .findOneAndUpdate(
          { mobileNumber: mobilenumber },
          {
            $set: {
              isNew_Customer: true,
            },
          }
        )
        .then(() => {
          console.log("customer details model updated successfully");
        })
        .catch((err) => {
          console.log("error in customer details saving", err);
        });
      
    } else {
      console.log("other than failed scenarios");
      let mobilenumber = userDocument1.mobileNumber;
//       let customerDocument1 = await customer_details.findOne({
//         mobileNumber:mobilenumber,
//       });
//       console.log(" customerdocument",customerDocument1);
// if(!customerDocument1){
      
//       let myobj={
//         mobileNumber:mobilenumber,
//         isOptOut:false,
//         isNew_Customer:false
//       }
//      await customer_details.create(myobj);
      await customer_details
        .findOneAndUpdate(
          { mobileNumber: mobilenumber },
          {
            $set: {
              isNew_Customer: false,
            },
          }
        )
        .then(() => {
          console.log("customer details model updated successfully");
        })
        .catch((err) => {
          console.log("error in customer details saving", err);
        });
    
  }
  } catch (err) {
    console.log("err in customer details model save", err);
  }
}

module.exports.whatsappStatus = whatsappStatus;
