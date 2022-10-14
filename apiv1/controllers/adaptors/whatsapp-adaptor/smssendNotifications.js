const request = require("request");
const whatsappdataModel = require("../../../models/user_notifications.js");


let getWhatsappdata = async function (req, res) {
  whatsappdataModel.find({}, function (err, mydocument) {
    if (err) res.send(err);
    res.json(mydocument);
  });
};

const sendSMSNotifications = async function (req, res) {
  /*  Take accountSid and authToken from twilio console*/
  const accountSid = "AC39f01b501a81b91d0937ab16e32dc6ba";
  const authToken = "7ad881a59f5f85fdaa5bc8b30dc4760c";
  const client = require("twilio")(accountSid, authToken);
  /* Rest API to retrive the data to send Whatsapp Notifications */
  let url = "http://localhost:8000/whatsapp/whatsappdata";
  request(
    {
      url: url,
      method: "GET",
    },
    (error, response, body) => {
      let employees = JSON.parse(body);
      let successCount = 0;
      let failureCount = 0;
      Promise.all(
        employees.map((employee) => {
          if (employee.mobileNumber !== "") {
            successCount = successCount + 1;
            let message =
            "Dear " +
            "*" +
            employee.employeeName +
            "*" +
            ",\n\n Your bill of " +
            "*" +
            "$" +
            employee.totalCountPending +
            "*" +
            " due on " +
            "*" +
            "Oct " +
            employee.beyondSLAStage +
            "th" +
            "*"

            "\n\nRegards,\nATNI";
            
            return client.messages.create({
                to: "+"+employee.mobileNumber,
                from: "+44 7830 319373",
                // "+12057728079",
                statusCallback: 'https://144ce94783a9.ngrok.io/api/messages/smsstatus',
                body: "Please click on link  for Invoice copy pdf https://mygtt.co.gy/#/",
                // message,
                // mediaUrl: "http://www.africau.edu/images/default/sample.pdf",
                
              });
          } else {
            failureCount = failureCount + 1;
          }
        })
      )
        .then((message) => {
          res.json({
            status: 200,
            message: " Successfully Sent Notifications",
          });
        })
        .catch((err) => {
          res.json({ status: 500, message: err });
        });
    }
  );
};

module.exports.getWhatsappdata = getWhatsappdata;
module.exports.sendSMSNotifications = sendSMSNotifications;
