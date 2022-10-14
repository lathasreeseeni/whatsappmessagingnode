const nodeoutlook = require("nodejs-nodemailer-outlook");
const emailConfig = require("../../../config/emailConfig.json");
let sendReportsEmails = async function (req) {
  console.log("send reports mailll", req);
  nodeoutlook.sendEmail({
    auth: {
      user: emailConfig.from_useremailid,
      pass: emailConfig.from_paswd,
    },
    from: emailConfig.from_useremailid,

    to: emailConfig.reports_to_emailid,
    subject: req.subject,
    attachments: req.attachments,

    onError: (error) => {
      console.log(error);
    },
    onSuccess: (i) => {
      console.log(i);
    },
  });
};


let sendReportEmails = async function (req) {
  console.log("send mailll", req);
  nodeoutlook.sendEmail({
    auth: {
      user: emailConfig.from_useremailid,
      pass: emailConfig.from_paswd,
    },
    from: emailConfig.from_useremailid,

    to: emailConfig.datareporting_emailid,
    subject: req.subject,
    text: req.message,

    onError: (error) => {
      console.log(error);
    },
    onSuccess: (i) => {
      console.log(i);
    },
  });
};


module.exports.sendReportsEmails = sendReportsEmails;
module.exports.sendReportEmails = sendReportEmails;
