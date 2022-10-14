const nodeoutlook = require("nodejs-nodemailer-outlook");
const emailConfig = require("../../../config/emailConfig.json");

let sendEmails = async function (req) {
  console.log("send mailll", req);
  nodeoutlook.sendEmail({
    auth: {
      user: emailConfig.from_useremailid,
      pass: emailConfig.from_paswd,
    },
    from: emailConfig.from_useremailid,

    to: emailConfig.to_emailid,
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

module.exports.sendEmails = sendEmails;
