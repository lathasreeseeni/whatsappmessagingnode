let Client = require("ssh2-sftp-client");
let sftp = new Client();
const cron = require("node-cron");

cron.schedule("09 20 * * *", async function (req, res) {​​​​​​​
  console.log("Cron job started");
  let timeChange = Date.now();
  let today = new Date(timeChange);
  let todayOptOption1 = momenttz(today).format("YYYYMMDDHHmm");
  let todayOptOption = momenttz(today).format("YYYYMMDD");
  sftp
    .connect({​​​​​​​
algorithms: {​​​​​​​
  cipher: [
    "aes128-cbc" ]
}​​​​​​​,
      host: "172.20.72.151",
      port: "22",
      username: "azure",
      password: "Atni@123"
     }​​​​​​​)
    .then(() => {​​​​​​​
      return sftp.put(
        "/opt/whatsappproject/whatsappmessagingnode/WhatsApp_Optout_Daily_report/BILL_DISP_UPDATE_" + todayOptOption + ".csv",
        "/home/azure/staging/billing/data/whatsapp_bill_message/billdip_update/BILL_DISP_UPDATE_" + todayOptOption1 + ".csv",
      );
    }​​​​​​​)
    .then((data) => {​​​​​​​
      console.log(data, "the data info");
    }​​​​​​​)
    .catch((err) => {​​​​​​​
      console.log(err, "catch error");
    }​​​​​​​);
}​​​​​​​);
