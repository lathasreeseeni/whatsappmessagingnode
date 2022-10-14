const user_notificationsModel = require("../../../models/user_notifications.js");
const user_RequestResponseModel = require("../../../models/user_request_response.js");
const customer_Details = require("../../../models/customer_details.js");
const detailed_twilio_summaryModel = require("../../../models/detailed_twilio_summary.js");
var json2xls = require("json2xls");
const converter = require("json-2-csv");
const sendReportsEmail = require("./emailReports.js");

var fs = require("fs");
const mv = require('mv');

var momenttz = require("moment-timezone");
const moment = require("moment-timezone");
const cron = require("node-cron");

let Client = require("ssh2-sftp-client");
let sftp = new Client();
const { AzCopyClient } = require("@azure-tools/azcopy-node");
let client = new AzCopyClient();
path = require('path');
join = require('path').join;
const winston = require('winston');
const logDir = 'log';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
//const Logger = require('../../../helpers/logger-new.js')
//const logger = new Logger('reportsinfo')
const date= new Date().getTime();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
       
    // new winston.transports.File({ filename: `${logDir}/error${date}.log`, level: 'error' }),
    new winston.transports.File({ filename: `${logDir}/reportsinfo${date}.log`,level:'info' }),
  ],
});


let getStartAndEndDates = async function () {
  let month=new Date().getMonth()+1;
let year=new Date().getFullYear()
let lastDayOMmonth= moment(new Date()).endOf('month').format("DD");
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
let obj = {
    "startDate":new Date(startDate1),
    "endDate":new Date(endDate1)
}
return obj;
}

//cron.schedule('18 07 * * *',async function (req, res) {
//var end = new Date(
   //   moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    //);
   // let dateobjinfo = await getStartAndEndDates();
 // console.log("\n\n\ndateobjinfo",JSON.stringify(dateobjinfo));
  //let start = dateobjinfo.startDate;
//var curr = new Date(); // get current date
//var first = curr.getDate(); //- curr.getDay(); // First day is the day of the month - the day of the week
//var last = start+7; // last day is the first day + 6

//var firstday = new Date(curr.setDate(first)).toUTCString();
//var lastday = new Date(curr.setDate(last)).toUTCString();
//let date_ob = moment().format('YYYY-MM-DDT00:00:00.530Z');
//var last_su = new Date()-7;
//var last= date_ob.setDate(date_ob.getDate() - 7);

//let date_ob = moment().format('YYYY-MM-DDT00:00:00.530Z');
//var last_su = new Date()-7;
//var last= date_ob.setDate(date_ob.getDate() - 7);



//})


cron.schedule('17 14 29 * *',async function (req, res) {
//cron.schedule('19 09 * * *',async function (req, res) {
 try {
    
  console.log("User sentnotifications reports started job scheduling ");

  var end = new Date(
      moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    );
    let dateobjinfo = await getStartAndEndDates();
  console.log("\n\n\ndateobjinfo",JSON.stringify(dateobjinfo));
  let start = dateobjinfo.startDate;
  console.log("start and end date",start,end);

    //var TodayDate = new Date();
   //TodayDate.setHours(0,0,0,0);
  // console.log(TodayDate, "-- Today Date");
  // var dateOffset = (24*60*60*1000) * 7; //7 days
 // var LastWeekDate = new Date();
 //LastWeekDate.setTime(TodayDate.getTime() - dateOffset);
// console.log(LastWeekDate, "7 Days Subtraction date");

//console.log("start and end date",TodayDate,LastWeekDate);

    var jsonTextArray1 = [];

   // var mydocument = detailed_twilio_summaryModel.find(
var mydocument = user_notificationsModel.find(
      {
notificationType:"SUSPENSION",
	sentDate: {
    $gte: `${start}`, 
     $lt: `${end}`, 
	//$gte: "2022-06-01 00:00:00.530Z",
	// $lte: "2022-06-31 23:59:59.530Z",

       },

 // messageType : "sim_swap_2022",
      },
      async function (err, mydocument) {
        if (err) {
          console.log(err);
        } else {
          let failedmessageDocument = await user_notificationsModel.find(
            {
              messageSent: "Failed",
              sentDate: {
                $gte: start,
               $lt: end,

             },       
     },
            function (err, faileddocument) {
              if (err) {
                console.log(err);
              } else {
                return faileddocument;
              }
            }
          );

          if (mydocument.length > 0) {
            for (var i = 0; i < mydocument.length; i++) {
              var mobile_number = mydocument[i].mobileNumber;
              let setMobile_number = mobile_number + "\t";

              var tempArray1 = {
                "Account No": mydocument[i].account_no,
                "Service Type": mydocument[i].service_type,
                "Customer Name": mydocument[i].customerName,
                "Contact No": setMobile_number,
                "WhatsApp Message ID": mydocument[i].whatsapp_msgid,
                "Message Sent Date": momenttz(mydocument[i].sentDate)
                  .tz("America/Guyana")
                  .format("DD/MM/YYYY HH:mm:ss"),
                "Twilio Status": mydocument[i].twilioStatus,
                "Update Date": momenttz(mydocument[i].updateDate)
                  .tz("America/Guyana")
                  .format("DD/MM/YYYY HH:mm:ss"),
                "Message Sent": mydocument[i].messageSent,
                "template": mydocument[i].template
              };

              jsonTextArray1.push(tempArray1);
            }
          }

          if (mydocument.length == 0) {
            var tempArray3 = {
              "Account No": "",
              "Service Type": "",
              "Customer Name": "",
              "Contact No": "",
              "WhatsApp Message ID": "",
              "Message Sent Date": "",
              "Twilio Status": "",
              "Update Date": "",
              "Message Sent": "",
            };

            jsonTextArray1.push(tempArray3);
          }
          var datetimeChange = Date.now();
          var todayReport = new Date(datetimeChange);
          var todayReport = momenttz(todayReport).format("DD-MM-YYYY");
          var d = new Date();
         // var monthName = months[d.getMonth()];
          const dir = "./WhatsApp_Notifications_Daily_report/Reports_Weekly";
            // recursively create multiple directories
          converter.json2csv(jsonTextArray1, async (err, csv) => {
            if (err) {
              throw err;
            }

            await fs.mkdir(dir, { recursive: true }, async (err) => {
              if (err) {
              } else {
                if (csv !== undefined) {
                  var fNamepath =
                    dir + "/WhatsApp_MTD_User_report_SUSPENSION_"+todayReport+".csv";
                  await fs.writeFileSync(fNamepath, csv);
                } else {
                  var fNamepath =
                    dir + "/WhatsApp_MTD_User_report_SUSPENSION_"+todayReport+".csv";
                  await fs.writeFileSync(fNamepath, csv);
                }
                          }
            });
          });
        }
      }
    );
  } catch (exception) {
    console.log("Exception in whatsappusernotification:: " + exception);
  }
//};
 });


 cron.schedule('18 14 29 * *',async function (req, res) {
  //cron.schedule('57 07 * * *',async function (req, res) {
   try {
      
    console.log("User sentnotifications reports started job scheduling ");
     var end = new Date(
      moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    );
    let dateobjinfo = await getStartAndEndDates();
  console.log("\n\n\ndateobjinfo",JSON.stringify(dateobjinfo));
  let start = dateobjinfo.startDate;
  

   console.log("start and end date",start,end);  
      var jsonTextArray1 = [];
  
     // var mydocument = detailed_twilio_summaryModel.find(
  var mydocument = user_notificationsModel.find(
        {
  notificationType:"INITIAL_BILL_MESSAGE",
    sentDate: {
       $gte: `${start}`, 
       $lt: `${end}`, 
    //$gte: "2022-06-01 00:00:00.530Z",
    // $lte: "2022-06-31 23:59:59.530Z",
  
         },
  
   // messageType : "sim_swap_2022",
        },
        async function (err, mydocument) {
          if (err) {
            console.log(err);
          } else {
            let failedmessageDocument = await user_notificationsModel.find(
              {
                messageSent: "Failed",
                sentDate: {
                  $gte: `${start}`,
                 $lt: `${end}`,
  
               },       
       },
              function (err, faileddocument) {
                if (err) {
                  console.log(err);
                } else {
                  return faileddocument;
                }
              }
            );
  
            if (mydocument.length > 0) {
              for (var i = 0; i < mydocument.length; i++) {
                var mobile_number = mydocument[i].mobileNumber;
                let setMobile_number = mobile_number + "\t";
  
                var tempArray1 = {
                  "Account No": mydocument[i].account_no,
                  "Service Type": mydocument[i].service_type,
                  "Customer Name": mydocument[i].customerName,
                  "Contact No": setMobile_number,
                  "WhatsApp Message ID": mydocument[i].whatsapp_msgid,
                  "Message Sent Date": momenttz(mydocument[i].sentDate)
                    .tz("America/Guyana")
                    .format("DD/MM/YYYY HH:mm:ss"),
                  "Twilio Status": mydocument[i].twilioStatus,
                  "Update Date": momenttz(mydocument[i].updateDate)
                    .tz("America/Guyana")
                    .format("DD/MM/YYYY HH:mm:ss"),
                  "Message Sent": mydocument[i].messageSent,
                  "template": mydocument[i].template
                };
  
                jsonTextArray1.push(tempArray1);
              }
            }
  
            if (mydocument.length == 0) {
              var tempArray3 = {
                "Account No": "",
                "Service Type": "",
                "Customer Name": "",
                "Contact No": "",
                "WhatsApp Message ID": "",
                "Message Sent Date": "",
                "Twilio Status": "",
                "Update Date": "",
                "Message Sent": "",
              };
  
              jsonTextArray1.push(tempArray3);
            }
            var datetimeChange = Date.now();
            var todayReport = new Date(datetimeChange);
            var todayReport = momenttz(todayReport).format("DD-MM-YYYY");
            var d = new Date();
           // var monthName = months[d.getMonth()];
            const dir = "./WhatsApp_Notifications_Daily_report/Reports_Weekly";
              // recursively create multiple directories
            converter.json2csv(jsonTextArray1, async (err, csv) => {
              if (err) {
                throw err;
              }
  
              await fs.mkdir(dir, { recursive: true }, async (err) => {
                if (err) {
                } else {
                  if (csv !== undefined) {
                    var fNamepath =
                      dir + "/WhatsApp_MTD_User_report_INITIAL_BILL_MESSAGE_"+todayReport+".csv";
                    await fs.writeFileSync(fNamepath, csv);
                  } else {
                    var fNamepath =
                      dir + "/WhatsApp_MTD_User_report_INITIAL_BILL_MESSAGE_"+todayReport+".csv";
                    await fs.writeFileSync(fNamepath, csv);
                  }
                            }
              });
            });
          }
        }
      );
    } catch (exception) {
      console.log("Exception in whatsappusernotification:: " + exception);
    }
  //};
   });

   cron.schedule('19 14 29 * *',async function (req, res) {
    //cron.schedule('57 07 * * *',async function (req, res) {
     try {
        
      console.log("User sentnotifications reports started job scheduling ");
       var end = new Date(
      moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    );
    let dateobjinfo = await getStartAndEndDates();
  console.log("\n\n\ndateobjinfo",JSON.stringify(dateobjinfo));
  let start = dateobjinfo.startDate;
  

   console.log("start and end date",start,end);    
        var jsonTextArray1 = [];
    
       // var mydocument = detailed_twilio_summaryModel.find(
    var mydocument = user_notificationsModel.find(
          {
    notificationType:"FIRST_BILL_REMINDER",
      sentDate: {
         $gte: `${start}`, 
          $lt: `${end}`, 
     // $gte: "2022-06-01 00:00:00.530Z",
     //  $lte: "2022-06-31 23:59:59.530Z",
    
           },
    
     // messageType : "sim_swap_2022",
          },
          async function (err, mydocument) {
            if (err) {
              console.log(err);
            } else {
              let failedmessageDocument = await user_notificationsModel.find(
                {
                  messageSent: "Failed",
                  sentDate: {
                    $gte: start,
                   $lt: end,
    
                 },       
         },
                function (err, faileddocument) {
                  if (err) {
                    console.log(err);
                  } else {
                    return faileddocument;
                  }
                }
              );
    
              if (mydocument.length > 0) {
                for (var i = 0; i < mydocument.length; i++) {
                  var mobile_number = mydocument[i].mobileNumber;
                  let setMobile_number = mobile_number + "\t";
    
                  var tempArray1 = {
                    "Account No": mydocument[i].account_no,
                    "Service Type": mydocument[i].service_type,
                    "Customer Name": mydocument[i].customerName,
                    "Contact No": setMobile_number,
                    "WhatsApp Message ID": mydocument[i].whatsapp_msgid,
                    "Message Sent Date": momenttz(mydocument[i].sentDate)
                      .tz("America/Guyana")
                      .format("DD/MM/YYYY HH:mm:ss"),
                    "Twilio Status": mydocument[i].twilioStatus,
                    "Update Date": momenttz(mydocument[i].updateDate)
                      .tz("America/Guyana")
                      .format("DD/MM/YYYY HH:mm:ss"),
                    "Message Sent": mydocument[i].messageSent,
                    "template": mydocument[i].template
                  };
    
                  jsonTextArray1.push(tempArray1);
                }
              }
    
              if (mydocument.length == 0) {
                var tempArray3 = {
                  "Account No": "",
                  "Service Type": "",
                  "Customer Name": "",
                  "Contact No": "",
                  "WhatsApp Message ID": "",
                  "Message Sent Date": "",
                  "Twilio Status": "",
                  "Update Date": "",
                  "Message Sent": "",
                };
    
                jsonTextArray1.push(tempArray3);
              }
              var datetimeChange = Date.now();
              var todayReport = new Date(datetimeChange);
              var todayReport = momenttz(todayReport).format("DD-MM-YYYY");
              var d = new Date();
             // var monthName = months[d.getMonth()];
              const dir = "./WhatsApp_Notifications_Daily_report/Reports_Weekly";
                // recursively create multiple directories
              converter.json2csv(jsonTextArray1, async (err, csv) => {
                if (err) {
                  throw err;
                }
    
                await fs.mkdir(dir, { recursive: true }, async (err) => {
                  if (err) {
                  } else {
                    if (csv !== undefined) {
                      var fNamepath =
                        dir + "/WhatsApp_MTD_User_report_FIRST_BILL_REMINDER_"+todayReport+".csv";
                      await fs.writeFileSync(fNamepath, csv);
                    } else {
                      var fNamepath =
                        dir + "/WhatsApp_MTD_User_report_FIRST_BILL_REMINDER_"+todayReport+".csv";
                      await fs.writeFileSync(fNamepath, csv);
                    }
                              }
                });
              });
            }
          }
        );
      } catch (exception) {
        console.log("Exception in whatsappusernotification:: " + exception);
      }
    //};
     });

     cron.schedule('20 14 29 * *',async function (req, res) {
      //cron.schedule('57 07 * * *',async function (req, res) {
       try {
          
        console.log("User sentnotifications reports started job scheduling ");
       var end = new Date(
      moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    );
    let dateobjinfo = await getStartAndEndDates();
  console.log("\n\n\ndateobjinfo",JSON.stringify(dateobjinfo));
  let start = dateobjinfo.startDate;
  console.log("start and end date",start,end);      
          var jsonTextArray1 = [];
      
         // var mydocument = detailed_twilio_summaryModel.find(
      var mydocument = user_notificationsModel.find(
            {
      notificationType:"FINAL_BILL_REMINDER",
        sentDate: {
           $gte: `${start}`, 
           $lt: `${end}`, 
       // $gte: "2022-06-01 00:00:00.530Z",
       //  $lte: "2022-06-31 23:59:59.530Z",
      
             },
      
       // messageType : "sim_swap_2022",
            },
            async function (err, mydocument) {
              if (err) {
                console.log(err);
              } else {
                let failedmessageDocument = await user_notificationsModel.find(
                  {
                    messageSent: "Failed",
                    sentDate: {
                      $gte: start,
                     $lt: end,
      
                   },       
           },
                  function (err, faileddocument) {
                    if (err) {
                      console.log(err);
                    } else {
                      return faileddocument;
                    }
                  }
                );
      
                if (mydocument.length > 0) {
                  for (var i = 0; i < mydocument.length; i++) {
                    var mobile_number = mydocument[i].mobileNumber;
                    let setMobile_number = mobile_number + "\t";
      
                    var tempArray1 = {
                      "Account No": mydocument[i].account_no,
                      "Service Type": mydocument[i].service_type,
                      "Customer Name": mydocument[i].customerName,
                      "Contact No": setMobile_number,
                      "WhatsApp Message ID": mydocument[i].whatsapp_msgid,
                      "Message Sent Date": momenttz(mydocument[i].sentDate)
                        .tz("America/Guyana")
                        .format("DD/MM/YYYY HH:mm:ss"),
                      "Twilio Status": mydocument[i].twilioStatus,
                      "Update Date": momenttz(mydocument[i].updateDate)
                        .tz("America/Guyana")
                        .format("DD/MM/YYYY HH:mm:ss"),
                      "Message Sent": mydocument[i].messageSent,
                      "template": mydocument[i].template
                    };
      
                    jsonTextArray1.push(tempArray1);
                  }
                }
      
                if (mydocument.length == 0) {
                  var tempArray3 = {
                    "Account No": "",
                    "Service Type": "",
                    "Customer Name": "",
                    "Contact No": "",
                    "WhatsApp Message ID": "",
                    "Message Sent Date": "",
                    "Twilio Status": "",
                    "Update Date": "",
                    "Message Sent": "",
                  };
      
                  jsonTextArray1.push(tempArray3);
                }
                var datetimeChange = Date.now();
                var todayReport = new Date(datetimeChange);
                var todayReport = momenttz(todayReport).format("DD-MM-YYYY");
                var d = new Date();
               // var monthName = months[d.getMonth()];
                const dir = "./WhatsApp_Notifications_Daily_report/Reports_Weekly";
                  // recursively create multiple directories
                converter.json2csv(jsonTextArray1, async (err, csv) => {
                  if (err) {
                    throw err;
                  }
      
                  await fs.mkdir(dir, { recursive: true }, async (err) => {
                    if (err) {
                    } else {
                      if (csv !== undefined) {
                        var fNamepath =
                          dir + "/WhatsApp_MTD_User_report_FINAL_BILL_REMINDER_"+todayReport+".csv";
                        await fs.writeFileSync(fNamepath, csv);
                      } else {
                        var fNamepath =
                          dir + "/WhatsApp_MTD_User_report_FINAL_BILL_REMINDER_"+todayReport+".csv";
                        await fs.writeFileSync(fNamepath, csv);
                      }
                                }
                  });
                });
              }
            }
          );
        } catch (exception) {
          console.log("Exception in whatsappusernotification:: " + exception);
        }
      //};
       });
      



cron.schedule('58 13 * * *',async function(req,res){
  //let src = `/opt/whatsappproject/whatsappmessagingnode/WhatsApp_Notifications_Daily_report/April/*`;
 let src=join(__dirname, '../../../../WhatsApp_Notifications_Daily_report/April/WhatsApp_Daily_User_report_01-04-2022(14_18_02).csv');

let dst = "https://eltmstorage.blob.core.windows.net/eltmcontainer/mongodb/?sv=2018-03-28&ss=bfqt&srt=sco&sp=rwdlacup&se=9999-08-28T03:26:35Z&st=2019-08-27T19:26:35Z&spr=https&sig=ZGX1FbAm3QjM9jmxXRsLf4c0VM%2BJALwL%2BRlwk%2BbhNxI%3D";
  try{
    let jobId = await client.copy(src, dst);
    let status;
    while (!status || status.StatusType !== "EndOfJob") {
      let jobInfo = await copyClient.getJobInfo(jobId)
      status = jobInfo.latestStatus;
      console.log("while loop statuss *************",status);
      await new Promise((resolve, reject) => setTimeout(resolve, 1000));
  }
  console.log("statusssssssss",status);

  }catch (exception) {
    console.log("Exception in Copying Azcopy " + exception);
  }
})


// This method is for Whatsapp daily update Report

//let whatsappusernotification = async function (req, res) {
  cron.schedule('18 14 * * *',async function (req, res) {
  try {
    console.log("User sentnotifications reports started jon scheduling ");

    // const start = moment(new Date())
    //   .startOf("day")
    //   .format("MM/DD/YYYY HH:mm:ss");
    // const end = moment(new Date()).endOf("day").format("MM/DD/YYYY HH:mm:ss");
    var start = new Date(
      moment(new Date()).subtract(1, "day").utc().startOf("day").toISOString()
    );

    var end = new Date(
      moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    );
    var jsonTextArray1 = [];

    var mydocument = user_notificationsModel.find(
      {
	//sentDate: {
       updateDate: {
        $gte: `${start}`,
        $lte: `${end}`,
	//  $gte: "2022-03-03 00:00:00.530Z",
	//  $lte: "2022-03-30 23:59:59.530Z",

        },


      },
      async function (err, mydocument) {
        if (err) {
          console.log(err);
        } else {
          let failedmessageDocument = await user_notificationsModel.find(
            {
              messageSent: "Failed",
              sentDate: {
                $gte: start,
               $lte: end,

              },            },
            function (err, faileddocument) {
              if (err) {
                console.log(err);
              } else {
                return faileddocument;
              }
            }
          );

          if (mydocument.length > 0) {
            for (var i = 0; i < mydocument.length; i++) {
              var mobile_number = mydocument[i].mobileNumber;
              let setMobile_number = mobile_number + "\t";

              var tempArray1 = {
                "Account No": mydocument[i].account_no,
                "Service Type": mydocument[i].service_type,
                "Customer Name": mydocument[i].customerName,
                "Contact No": setMobile_number,


                "WhatsApp Message ID": mydocument[i].whatsapp_msgid,
                "Message Sent Date": momenttz(mydocument[i].sentDate)
                  .tz("America/Guyana")
                  .format("DD/MM/YYYY HH:mm:ss"),
                "Twilio Status": mydocument[i].twilioStatus,
                "Update Date": momenttz(mydocument[i].updateDate)
                  .tz("America/Guyana")
                  .format("DD/MM/YYYY HH:mm:ss"),
                "Message Sent": mydocument[i].messageSent,
                "template": mydocument[i].template
              };

              jsonTextArray1.push(tempArray1);
            }
          }

          if (mydocument.length == 0) {
            var tempArray3 = {
              "Account No": "",
              "Service Type": "",
              "Customer Name": "",
              "Contact No": "",
              "WhatsApp Message ID": "",
              "Message Sent Date": "",
              "Twilio Status": "",
              "Update Date": "",
              "Message Sent": "",
            };

            jsonTextArray1.push(tempArray3);
          }
          var datetimeChange = Date.now();
          var todayReport = new Date(datetimeChange);
          var todayReport = momenttz(todayReport).format(
            "DD-MM-YYYY");

          var months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          var d = new Date();
          var monthName = months[d.getMonth()];
          const dir = "./WhatsApp_Notifications_Daily_report/" + monthName;
          const dir1 =
            "./WhatsApp_Notifications_Daily_report/" + monthName + "/";
          // recursively create multiple directories
          converter.json2csv(jsonTextArray1, async (err, csv) => {
            if (err) {
              throw err;
            }

            await fs.mkdir(dir, { recursive: true }, async (err) => {
              if (err) {
              } else {
                if (csv !== undefined) {
                  var fNamepath =
                    dir + "/WhatsApp_Daily_User_report_" + todayReport + ".csv";
                  await fs.writeFileSync(fNamepath, csv);
                } else {
                  var fNamepath =
                    dir + "/WhatsApp_Daily_User_report_" + todayReport + ".csv";
                  await fs.writeFileSync(fNamepath, csv);
                }
                let info = {
                  subject: "WhatsApp usernotifications status report",
                  attachments: [
                    {
                      filename:
                        "WhatsApp_Daily_User_report_" + todayReport + ".csv",
                      path:
                        dir +
                        "/WhatsApp_Daily_User_report_" +
                        todayReport +
                        ".csv",
                    },
                  ],
                };
                await sendReportsEmail.sendReportsEmails(info);
              }
            });
          });
        }
      }
    );
  } catch (exception) {
    console.log("Exception in whatsappusernotification:: " + exception);
  }
//};
 });

// This method is for Bill optOut Reports

//let whatsappoptuserrequestresponse = function (req, res) {
  cron.schedule('18 14 * * *',async function (req, res) {
  try {
    var start = new Date(
      moment(new Date()).subtract(1, "day").utc().startOf("day").toISOString()
    );

    var end = new Date(
      moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    );

    var jsonTextArray5 = [];

    var mydocument2 = user_RequestResponseModel
      .aggregate([
        {
          $match: {
            optOut: true,
            requested_message: "pdfBill",
            sent_date: { $gt: start, $lt: end },
          },
        },
        {
          $group: {
            _id: {
              account_no: "$account_no",
              service_type: "$service_type",
              mobileNumber: "$mobileNumber",
              optOut: "$optOut",
              requested_message: "pdfBill",
            },
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
      ])
      .exec((err, mydocument2) => {
        if (err) res.send(err);
        //res.json(mydocument2);

        if (mydocument2.length > 0) {
          for (var i = 0; i < mydocument2.length; i++) {
            var tempArray5 = {
              "ACCOUNT_NO ": mydocument2[i].account_no,
              ACCOUNT_CATEGORY: "NULL",
              COMPANY_NAME: "NULL",
              BILL_FIRST_NAME: "NULL",
              BILL_LAST_NAME: "NULL",
              VIP_CODE: "NULL",
              BILL_DISP_METHOD: "CONSTANT",
              BILL_PERIOD: "NULL",
            };

            jsonTextArray5.push(tempArray5);
          }
        }

        if (mydocument2.length == 0) {
          var tempArray6 = {
            ACCOUNT_NO: "",
            ACCOUNT_CATEGORY: "",
            COMPANY_NAME: "",
            BILL_FIRST_NAME: "",
            BILL_LAST_NAME: "",
            VIP_CODE: "",
            BILL_DISP_METHOD: "",
            BILL_PERIOD: "",
          };

          jsonTextArray5.push(tempArray6);
        }

        var timeChange = Date.now();
        var today = new Date(timeChange);
        var todayOptOption = momenttz(today).format("YYYYMMDD");

        var dir = "./WhatsApp_Optout_Daily_report";

        converter.json2csv(jsonTextArray5, (err, csv) => {
          if (err) {
            throw err;
          }

          fs.mkdir(dir, { recursive: true }, (err) => {
            if (err) {
            } else {
              if (csv !== undefined) {
                var fNamepath =
                  dir + "/BILL_DISP_UPDATE_" + todayOptOption + ".csv";
                fs.writeFileSync(fNamepath, csv);
              } else {
                var fNamepath =
                  dir + "/BILL_DISP_UPDATE_" + todayOptOption + ".csv";
                fs.writeFileSync(fNamepath, csv);
              }
            }
          });
        });
      });
  } catch (exception) {
    console.log(
      "Exception in whatsappoptuserrequestresponsenew:: " + exception
    );
  }
//};
});


cron.schedule("20 11 * * *", async function (req, res) {
  console.log("Cron job started");
  let timeChange = Date.now();
  let today = new Date(timeChange);
  let todayOptOption1 = momenttz(today).format("YYYYMMDDHHmm");
  let todayOptOption = momenttz(today).format("YYYYMMDD");
console.log("todayOptOption "+todayOptOption );
  sftp
    .connect({
algorithms: {
  cipher: [
    "aes128-cbc" ]
},
      host: "172.20.72.151",
      port: "22",
      username: "azure",
      password: "Atni@123"
     })
    .then(() => {
      return sftp.put(
        "/opt/whatsappproject/whatsappmessagingnode/WhatsApp_Optout_Daily_report/BILL_DISP_UPDATE_" + todayOptOption + ".csv",
        "/home/azure/staging/billing/data/whatsapp_bill_message/billdip_update/BILL_DISP_UPDATE_" + todayOptOption1 + ".csv",
      );
    })
    .then((data) => {
      console.log(data, "the data info");
    })
    .catch((err) => {
      console.log(err, "catch error");
    });
});



 //cron.schedule('29 04 * * *',async function (req, res) {
 // try {
   // console.log("cron job started for optout-new reports");
    //var start = new Date(
      //moment(new Date()).subtract(1, "day").utc().startOf("day").toISOString()
    //);

    //var end = new Date(
      //moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    //);

    //var jsonTextArray5 = [];

    //var mydocument2 = user_RequestResponseModel.find(
//{
//requested_message: "Account&Amount",
//requested_message: "pdfBill",
//optOut:false,
//requested_date: {
//$gte: "2021-12-03 00:00:00.530Z",
//$lte: "2021-12-14 23:59:59.530Z",
//},
//Other_channal_optIn : { $nin : ['yes']}
//})
     /* .aggregate([
        {
          $match: {
            optOut: true,
            requested_message: "pdfBill",
            sent_date: { $gt: start, $lt: end },
          },
        },
        {
          $group: {
            _id: {
              account_no: "$account_no",
              service_type: "$service_type",
              mobileNumber: "$mobileNumber",
              optOut: "$optOut",
              requested_message: "pdfBill",
            },
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
      ])*/
     // .exec((err, mydocument2) => {
       // if (err) res.send(err);
        //res.json(mydocument2);

        //if (mydocument2.length > 0) {
          //for (var i = 0; i < mydocument2.length; i++) {
            //var tempArray5 = {
		//		"ACCOUNT_NO ": mydocument2[i].account_no,
//"mobileNumber":mydocument2[i].mobileNumber,
//"messageType":mydocument2[i].messageType,
//"requested_date":momenttz(mydocument2[i].requested_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
//"requested_message":mydocument2[i].requested_message,
//"optOut":mydocument2[i].optOut,
//"service_type":mydocument2[i].service_type,
//"sent_date":momenttz(mydocument2[i].sent_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
//"messageSent":mydocument2[i].messageSent,
//"whatsapp_msgid":mydocument2[i].whatsapp_msgid
             /* "ACCOUNT_NO ": mydocument2[i].account_no,
              ACCOUNT_CATEGORY: "NULL",
              COMPANY_NAME: "NULL",
              BILL_FIRST_NAME: "NULL",
              BILL_LAST_NAME: "NULL",
              VIP_CODE: "NULL",
              BILL_DISP_METHOD: "CONSTANT",
              BILL_PERIOD: "NULL",*/
          //  };

            //jsonTextArray5.push(tempArray5);
          //}
        //}

        //if (mydocument2.length == 0) {
//           var tempArray6 = {
// 			  "ACCOUNT_NO ": mydocument2[i].account_no,
// "mobileNumber":mydocument2[i].mobileNumber,
// "messageType":mydocument2[i].messageType,
// "requested_date":momenttz(mydocument2[i].requested_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
// "requested_message":mydocument2[i].requested_message,
// "optOut":mydocument2[i].optOut,
// "service_type":mydocument2[i].service_type,
// "sent_date":momenttz(mydocument2[i].sent_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
// "messageSent":mydocument2[i].messageSent,
// "whatsapp_msgid":mydocument2[i].whatsapp_msgid
           /* ACCOUNT_NO: "",
            ACCOUNT_CATEGORY: "",
            COMPANY_NAME: "",
            BILL_FIRST_NAME: "",
            BILL_LAST_NAME: "",
            VIP_CODE: "",
            BILL_DISP_METHOD: "",
            BILL_PERIOD: "",*/
          // };

          // jsonTextArray5.push(tempArray6);
      //  }

       // var timeChange = Date.now();
        //var today = new Date(timeChange);
        //var todayOptOption = momenttz(today).format("YYYYMMDD");

        //var dir = "./WhatsApp_Optout_Daily_report";

        //converter.json2csv(jsonTextArray5, (err, csv) => {
          //if (err) {
            //throw err;
          //}

          //fs.mkdir(dir, { recursive: true }, (err) => {
            //if (err) {
            //} else {
              //if (csv !== undefined) {
                //var fNamepath =
                  //dir + "/BILL_DISP_UPDATE_pdfBillReq_Whatsapp" + todayOptOption + ".csv";
                //fs.writeFileSync(fNamepath, csv);
              //} else {
                //var fNamepath =
                  //dir + "/BILL_DISP_UPDATE_Whatsapp" + todayOptOption + ".csv";
                //fs.writeFileSync(fNamepath, csv);
              //}
            //}
          //});
        //});
      //});
  //} catch (exception) {
    //console.log(
      //"Exception in whatsappoptuserrequestresponsenew:: " + exception
  //  );
  //}
//};
//});


 
// cron.schedule('20 12 * * *',async function (req, res) {
//     try {
//       console.log("User detailed_twilio_summaryModel reports started jon scheduling ");
      
//       var jsonTextArray1 = [];
  
//       var mydocument = detailed_twilio_summaryModel.find(
//         {
//             sentDate: {
         

//   $gte: "2021-09-01 12:00:00.530Z",
//   $lte: "2021-10-11 23:59:59.530Z",
  
//           },
//         },
//         async function (err, mydocument) {
//           if (err) {
//             console.log(err);
//           } else {
            
  
//             if (mydocument.length > 0) {
//               for (var i = 0; i < mydocument.length; i++) {
//                 var mobile_number = mydocument[i].mobileNumber;
//                 let setMobile_number = mobile_number + "\t";
  
//                 var tempArray1 = {
//                   "Account No": mydocument[i].account_no,
//                   "Service Type": mydocument[i].service_type,
//                   "Customer Name": mydocument[i].customerName,
//                   "Contact No": setMobile_number,
//                   "WhatsApp Message ID": mydocument[i].whatsapp_msgid,
//                   "Message Sent Date": momenttz(mydocument[i].sentDate)
//                     .tz("America/Guyana")
//                     .format("DD/MM/YYYY HH:mm:ss"),
//                   "Twilio Status": mydocument[i].twilioStatus,
//                   "Update Date": momenttz(mydocument[i].updateDate)
//                     .tz("America/Guyana")
//                     .format("DD/MM/YYYY HH:mm:ss"),
//                   "Message Sent": mydocument[i].messageSent,
//                 };
  
//                 jsonTextArray1.push(tempArray1);
//               }
//             }
  
           
//             var datetimeChange = Date.now();
//             var todayReport = new Date(datetimeChange);
//             var todayReport = momenttz(todayReport).format(
//               "DD-MM-YYYY(HH_mm_ss)"
//             );
  
//             var months = [
//               "January",
//               "February",
//               "March",
//               "April",
//               "May",
//               "June",
//               "July",
//               "August",
//               "September",
//               "October",
//               "November",
//               "December",
//             ];
//             var d = new Date();
//             var monthName = months[d.getMonth()];
//             const dir = "./WhatsApp_Notifications_Daily_report/" + monthName;
//             const dir1 =
//               "./WhatsApp_Notifications_Daily_report/" + monthName + "/";
//             // recursively create multiple directories
//             converter.json2csv(jsonTextArray1, async (err, csv) => {
//               if (err) {
//                 throw err;
//               }
  
//               await fs.mkdir(dir, { recursive: true }, async (err) => {
//                 if (err) {
//                 } else {
//                   if (csv !== undefined) {
//                     var fNamepath =
//                       dir + "/WhatsApp_Detailed_twilio_summary_Sep" + todayReport + ".csv";
//                     await fs.writeFileSync(fNamepath, csv);
//                   } else {
//                     var fNamepath =
//                       dir + "/WhatsApp_Detailed_twilio_summary_Sep" + todayReport + ".csv";
//                     await fs.writeFileSync(fNamepath, csv);
//                   }
//                                }
//               });
//             });
//           }
//         }
//       );
//     } catch (exception) {
//       console.log("Exception in whatsappusernotification:: " + exception);
//     }
//   //};
//    });
  
  
 //    cron.schedule('21 21 * * *',async function (req, res) {
  // try {
        
  //       var jsonTextArray5 = [];
    
  //       var mydocument2 = user_RequestResponseModel.find(
  //                {
  //   requested_message: "Account&Amount",
  //         //  requested_message: "pdfBill",
  //         //  optOut:false,
  //          requested_date: {
  //          $gte: "2021-11-03 00:00:00.530Z",
  //          $lte: "2021-11-17 23:59:59.530Z",
  //          }
  //           })
    
  //     .exec(async (err, mydocument2) => {
  //           if (err) res.send(err);
  //           //res.json(mydocument2);
    
  //           if (mydocument2.length > 0) {
  //             for (var i = 0; i < mydocument2.length; i++) {
  //               let optoutTrue = await user_RequestResponseModel.find({mobileNumber:mydocument2[i].mobileNumber,requested_message: "pdfBill",
  //                 requested_date: {
  //                $gte: "2021-11-03 00:00:00.530Z",
  //                $lte: "2021-11-17 23:59:59.530Z",
  //                }})
  //         console.log("optout true value ***********",optoutTrue.length,mydocument2[i].mobileNumber);
  //         if(optoutTrue.length == 0){
  //           console.log("optout true value ***********",optoutTrue.length);
  //   var tempArray5 = {
  //           "ACCOUNT_NO ": mydocument2[i].account_no,
  //   "mobileNumber":mydocument2[i].mobileNumber,
  //   "messageType":mydocument2[i].messageType,
  //   "requested_date":momenttz(mydocument2[i].requested_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
  //   "requested_message":mydocument2[i].requested_message,
  //   // "optOut":mydocument2[i].optOut,
  //   "service_type":mydocument2[i].service_type,
  //   "sent_date":momenttz(mydocument2[i].sent_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
  //   "messageSent":mydocument2[i].messageSent,
  //   "whatsapp_msgid":mydocument2[i].whatsapp_msgid
                
  //               };
    
  //               jsonTextArray5.push(tempArray5);
  //               console.log("jsonTextArray5",jsonTextArray5);
  //             }
  //           }
  //           }
    
  //           if (mydocument2.length == 0) {
  //             var tempArray6 = {
  //           "ACCOUNT_NO ": mydocument2[i].account_no,
  //   "mobileNumber":mydocument2[i].mobileNumber,
  //   "messageType":mydocument2[i].messageType,
  //   "requested_date":momenttz(mydocument2[i].requested_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
  //   "requested_message":mydocument2[i].requested_message,
  //   "optOut":mydocument2[i].optOut,
  //   "service_type":mydocument2[i].service_type,
  //   "sent_date":momenttz(mydocument2[i].sent_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
  //   "messageSent":mydocument2[i].messageSent,
  //   "whatsapp_msgid":mydocument2[i].whatsapp_msgid
  //              /* ACCOUNT_NO: "",
  //               ACCOUNT_CATEGORY: "",
  //               COMPANY_NAME: "",
  //               BILL_FIRST_NAME: "",
  //               BILL_LAST_NAME: "",
  //               VIP_CODE: "",
  //               BILL_DISP_METHOD: "",
  //               BILL_PERIOD: "",*/
  //             };
    
  //             jsonTextArray5.push(tempArray6);
              
  //           }
    
  //           var timeChange = Date.now();
  //           var today = new Date(timeChange);
  //           var todayOptOption = momenttz(today).format("YYYYMMDD");
    
  //           var dir = "./WhatsApp_Optout_Daily_report";
    
  //           converter.json2csv(jsonTextArray5, (err, csv) => {
  //             if (err) {
  //               throw err;
  //             }
    
  //             fs.mkdir(dir, { recursive: true }, (err) => {
  //               if (err) {
  //               } else {
  //                 if (csv !== undefined) {
  //                   var fNamepath =
  //                     dir + "/BILL_DISP_UPDATE_pdfBill_Whatsapp" + todayOptOption + ".csv";
  //                   fs.writeFileSync(fNamepath, csv);
  //                 } else {
  //                   var fNamepath =
  //                     dir + "/BILL_DISP_UPDATE_Whatsapp" + todayOptOption + ".csv";
  //                   fs.writeFileSync(fNamepath, csv);
  //                 }
  //               }
  //             });
  //           });
  //         });
  //     } catch (exception) {
  //       console.log(
  //         "Exception in whatsappoptuserrequestresponsenew:: " + exception
  //       );
  //     }
  //     });


 

cron.schedule('25 14 29 * *',async function (req, res) {
//cron.schedule('58 07 * * *',async function (req, res) {

console.log("Month optin reports started"); 
  try {
  var end = new Date(
      moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    );
    let dateobjinfo = await getStartAndEndDates();
  console.log("\n\n\ndateobjinfo",JSON.stringify(dateobjinfo));
  let start = dateobjinfo.startDate;
  console.log("start and end date",start,end);        var jsonTextArray5 = [];
    
        var mydocument2 = user_RequestResponseModel.find(
                 {
            requested_message: "pdfBill",
            optOut:true,
           requested_date: {
           //$gte: "2022-03-01 00:00:00.530Z",
           // $lte: "2022-03-31 23:59:59.530Z",//current date
         $gte: `${start}`,
         $lt: `${end}`,
           }
            })
    
      .exec(async (err, mydocument2) => {
            if (err) res.send(err);
    
            if (mydocument2.length > 0) {
              for (var i = 0; i < mydocument2.length; i++) {
                let optoutTrue = await user_RequestResponseModel.find({mobileNumber:mydocument2[i].mobileNumber,requested_message: "pdfBill",optOut:true,
                  requested_date: {
                 $gte: "2021-02-01 00:00:00.530Z",
                $lte: `${start}`,
             //$lte: "2022-03-01 00:00:00.530Z",
              }})
          console.log("optout true value ***********",optoutTrue.length,mydocument2[i].mobileNumber);
          if(optoutTrue.length == 0){
            console.log("optout true value ***********",optoutTrue.length);
    var tempArray5 = {
            "ACCOUNT_NO ": mydocument2[i].account_no,
    "mobileNumber":mydocument2[i].mobileNumber,
    "messageType":mydocument2[i].messageType,
    "requested_date":momenttz(mydocument2[i].requested_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
    "requested_message":mydocument2[i].requested_message,
    "service_type":mydocument2[i].service_type,
    "sent_date":momenttz(mydocument2[i].sent_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
    "messageSent":mydocument2[i].messageSent,
    "whatsapp_msgid":mydocument2[i].whatsapp_msgid
                
                };
    
                jsonTextArray5.push(tempArray5);
                console.log("jsonTextArray5",jsonTextArray5);
              }
            }
            }
    
            if (mydocument2.length == 0) {
              var tempArray6 = {
            "ACCOUNT_NO ": "",
    "mobileNumber":"",
    "messageType":"",
    "requested_date":"",
    "requested_message":"",
    "service_type":"",
    "sent_date":"",
    "messageSent":"",
    "whatsapp_msgid":""
  
              };
    
              jsonTextArray5.push(tempArray6);
              
            }
            var datetimeChange = Date.now();
            var todayReport = new Date(datetimeChange);
            var todayReport = momenttz(todayReport).format(
              "DD-MM-YYYY"
            );
  
           
            var d = new Date();
            
            const dir = "./WhatsApp_Notifications_Daily_report/Reports_Weekly/";
                     // recursively create multiple directories
            converter.json2csv(jsonTextArray5, async (err, csv) => {
              if (err) {
                throw err;
              }
  
              await fs.mkdir(dir, { recursive: true }, async (err) => {
                if (err) {
                } else {
                  if (csv !== undefined) {
                    var fNamepath =
                      dir + "/WhatsApp_optin_report_"+todayReport+".csv";
                    await fs.writeFileSync(fNamepath, csv);
                  } else {
                    var fNamepath =
                      dir + "/WhatsApp_optin_report_"+todayReport+".csv";
                    await fs.writeFileSync(fNamepath, csv);
                  }
                            }
              });
            });
          });
      } catch (exception) {
        console.log(
          "Exception in whatsappoptuserrequestresponsenew:: " + exception
        );
       }
      });  


 cron.schedule('23 14 29 * *',async function (req, res) {
//cron.schedule('59 07 * * *',async function (req, res) {

console.log("Month Account&Amount requested");
  try {
  
 var end = new Date(
      moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()
    );
    let dateobjinfo = await getStartAndEndDates();
  console.log("\n\n\ndateobjinfo",JSON.stringify(dateobjinfo));
  let start = dateobjinfo.startDate;
  console.log("start and end date",start,end);    
     var jsonTextArray5 = [];
    var mydocument2 = user_RequestResponseModel.find({
    requested_message: "Account&Amount",
           requested_date: {
         $gte: `${start}`,
         $lt: `${end}`,
           //$gte: "2022-06-01 00:00:00.530Z",
          // $lte: "2022-06-31 23:59:59.530Z",
           }
            }).exec(async (err, mydocument2) => {
            if (err) res.send(err);
    
            if (mydocument2.length > 0) {
              for (var i = 0; i < mydocument2.length; i++) {
                let optoutTrue = await user_RequestResponseModel.find({mobileNumber:mydocument2[i].mobileNumber,requested_message: "pdfBill",
                  requested_date: {
                   $gte: `${start}`,
                   $lt: `${end}`,
           //$gte: "2022-06-01 00:00:00.530Z",
        //  $lte: "2022-06-31 23:59:59.530Z",

                 }})
          console.log("optout true value ***********",optoutTrue.length,mydocument2[i].mobileNumber);
          if(optoutTrue.length == 0){
            console.log("optout true value ***********",optoutTrue.length);
    var tempArray5 = {
            "ACCOUNT_NO ": mydocument2[i].account_no,
    "mobileNumber":mydocument2[i].mobileNumber,
    "messageType":mydocument2[i].messageType,
    "requested_date":momenttz(mydocument2[i].requested_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
    "requested_message":mydocument2[i].requested_message,
    "service_type":mydocument2[i].service_type,
    "sent_date":momenttz(mydocument2[i].sent_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
    "messageSent":mydocument2[i].messageSent,
    "whatsapp_msgid":mydocument2[i].whatsapp_msgid
                
                };
    
                jsonTextArray5.push(tempArray5);
                console.log("jsonTextArray5",jsonTextArray5);
              }
            }
            }
    
            if (mydocument2.length == 0) {
              var tempArray6 = {
            "ACCOUNT_NO ": "",
    "mobileNumber":"",
    "messageType":"",
    "requested_date":"",
    "requested_message":"",
    "service_type":"",
    "sent_date":"",
    "messageSent":"",
    "whatsapp_msgid":""
  
              };
    
              jsonTextArray5.push(tempArray6);
              
            }
    
            var datetimeChange = Date.now();
            var todayReport = new Date(datetimeChange);
            var todayReport = momenttz(todayReport).format(
              "DD-MM-YYYY"
            );
  
                      var d = new Date();
            
            const dir = "./WhatsApp_Notifications_Daily_report/Reports_Weekly";
                        // recursively create multiple directories
            converter.json2csv(jsonTextArray5, async (err, csv) => {
              if (err) {
                throw err;
              }
  
              await fs.mkdir(dir, { recursive: true }, async (err) => {
                if (err) {
                } else {
                  if (csv !== undefined) {
                    var fNamepath =
                      dir + "/WhatsApp_Amount&Account_report_"+todayReport+".csv";
                    await fs.writeFileSync(fNamepath, csv);
                  } else {
                    var fNamepath =
                      dir + "/WhatsApp_Amount&Account_report_"+todayReport+".csv";
                    await fs.writeFileSync(fNamepath, csv);
                  }
                            }
              });
            });
          });
      } catch (exception) {
        console.log(
          "Exception in whatsappoptuserrequestresponsenew:: " + exception
        );
       }
      });

 cron.schedule('12 14 29 * *',async function (req, res) {
//cron.schedule('01 08 * * *',async function (req, res) {
  
try {
    console.log("cron job started for optout-new(STOP) reports");
   
    var jsonTextArray5 = [];

    var mydocument2 = customer_Details.find(
{
isOptOut:true
})
          .exec((err, mydocument2) => {
        if (err) res.send(err);
        //res.json(mydocument2);

        if (mydocument2.length > 0) {
          for (var i = 0; i < mydocument2.length; i++) {
            var tempArray5 = {
				
"mobileNumber":mydocument2[i].mobileNumber,
"Replied STOP":mydocument2[i].isOptOut
            };

            jsonTextArray5.push(tempArray5);
          }
        }

        if (mydocument2.length == 0) {
          
        }
        var datetimeChange = Date.now();
        var todayReport = new Date(datetimeChange);
        var todayReport = momenttz(todayReport).format(
          "DD-MM-YYYY"
        );

              var d = new Date();
       
        const dir = "./WhatsApp_Notifications_Daily_report/Reports_Weekly";
               // recursively create multiple directories
        converter.json2csv(jsonTextArray5, async (err, csv) => {
          if (err) {
            throw err;
          }

          await fs.mkdir(dir, { recursive: true }, async (err) => {
            if (err) {
            } else {
              if (csv !== undefined) {
                var fNamepath =
                  dir + "/WhatsApp_STOP_replied_"+todayReport+".csv";
                await fs.writeFileSync(fNamepath, csv);
              } else {
                var fNamepath =
                  dir + "/WhatsApp_STOP_replied_"+todayReport+".csv";
                await fs.writeFileSync(fNamepath, csv);
              }
                        }
          });
        });
      });
  } catch (exception) {
    console.log(
      "Exception in whatsappoptuserrequestresponsenew:: " + exception
    );
  }
//};
});


cron.schedule('21 14 29 * *',async function (req, res) {
//cron.schedule('04 08 * * *',async function (req, res) {
 
try {
   console.log("cron job started for pdf bill reports");
  
var end = new Date(
      moment(new Date()).subtract(1, "day").utc().endOf("day").toISOString()            
    );
    let dateobjinfo = await getStartAndEndDates();
  console.log("\n\n\ndateobjinfo",JSON.stringify(dateobjinfo));
  let start = dateobjinfo.startDate;
  console.log("start and end date",start,end);
    var jsonTextArray5 = [];
    var mydocument2 = user_RequestResponseModel.find({
     requested_message: "pdfBill",
     requested_date: {
 //$gte: "2022-06-01 00:00:00.530Z",
//$lte: "2022-06-31 23:59:59.530Z",
     $gte: `${start}`,
     $lt: `${end}`,
          },
  Other_channal_optIn : { $nin : ['yes']}
     }).exec((err, mydocument2) => {
       if (err) res.send(err);

        if (mydocument2.length > 0) {
          for (var i = 0; i < mydocument2.length; i++) {
            var tempArray5 = {
				"ACCOUNT_NO ": mydocument2[i].account_no,
"mobileNumber":mydocument2[i].mobileNumber,
"messageType":mydocument2[i].messageType,
"requested_date":momenttz(mydocument2[i].requested_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
"requested_message":mydocument2[i].requested_message,
"optOut":mydocument2[i].optOut,
"service_type":mydocument2[i].service_type,
"sent_date":momenttz(mydocument2[i].sent_date).tz("America/Guyana").format("DD/MM/YYYY HH:mm:ss"),
"messageSent":mydocument2[i].messageSent,
"whatsapp_msgid":mydocument2[i].whatsapp_msgid
            
           };

            jsonTextArray5.push(tempArray5);
          }
        }

        if (mydocument2.length == 0) {
          var tempArray6 = {
			  "ACCOUNT_NO ": "",
"mobileNumber":"",
"messageType":"",
"requested_date":"",
"requested_message":"",
"optOut":"",
"service_type":"",
"sent_date":"",
"messageSent":"",
"whatsapp_msgid":""
           
          };

          jsonTextArray5.push(tempArray6);
       }
       var datetimeChange = Date.now();
       var todayReport = new Date(datetimeChange);
       var todayReport = momenttz(todayReport).format(
         "DD-MM-YYYY"
       );

             var d = new Date();
     
       const dir = "./WhatsApp_Notifications_Daily_report/Reports_Weekly";
             // recursively create multiple directories
       converter.json2csv(jsonTextArray5, async (err, csv) => {
         if (err) {
           throw err;
         }

         await fs.mkdir(dir, { recursive: true }, async (err) => {
           if (err) {
           } else {
             if (csv !== undefined) {
               var fNamepath =
                 dir + "/WhatsApp_pdfbill_"+todayReport+".csv";
               await fs.writeFileSync(fNamepath, csv);
             } else {
               var fNamepath =
                 dir + "/WhatsApp_pdfbill_"+todayReport+".csv";
               await fs.writeFileSync(fNamepath, csv);
             }
                       }
         });
       });
      });
  } catch (exception) {
    console.log(
      "Exception in whatsappoptuserrequestresponsenew:: " + exception
   );
  }
 });

cron.schedule('20 15 * * 01',async function (req, res) {
//cron.schedule('28 14 * * *',async function (req, res) {



const fs = require('fs')
    const filename = '/opt/sample.txt'
    if (fs.existsSync(__filename)) {
    console.log("file exists");
   fs.readFile(filename, 'utf8', (err, data) => {
     if (err) {
      console.log("error in sample file raise an email to atni",err);
      let info ={
        "subject":"There is Error in Automation reports ",
        "message":"There is some issue in Automation reports trasnsferring ",err
      }
      sendReportsEmail.sendReportEmails(info);
  
      fs.unlinkSync(filename);
    }
   
   else{
    
    const arr = data.toString().replace(/\r\n/g,'\n').split('\n');
    if (data.length == 0) {
      console.log("file is empty so job Not completed raise an email");
      let info ={
        "subject":"There is Error in Automation reports ",
        "message":"There is some issue in Automation reports trasnsferring "
      }
      sendReportsEmail.sendReportEmails(info);
     fs.unlinkSync(filename);
    }
    else{
    
    let result= arr.includes("Final Job Status: Completed");
    console.log("result", result);
    if(result == true){
   let finalResult=arr.includes("Number of File Transfers: 0");
   if(finalResult == false){
logger.info('NO.of records in file '+Date.now()+' '+arr);
   console.log("job successfully done");
    fs.unlinkSync(filename);
     } else{
  console.log("Job not successfully done");
 let info ={
        "subject":"There is Error in Automation reports ",
        "message":"There is some issue in Automation reports trasnsferring ",
      }
      sendReportsEmail.sendReportEmails(info);
    fs.unlinkSync(filename);

}
    }else{
      console.log("Job not successfull");
      let info ={
        "subject":"There is Error in Automation reports ",
        "message":"There is some issue in Automation reports trasnsferring ",
      }
      sendReportsEmail.sendReportEmails(info);
     
      fs.unlinkSync(filename);
    }
    }
      }
    })
    await transferFiles();
  }
  else{
    console.log("file not exists so Job Not completed");
    let info ={
      "subject":"There is Error in Automation reports ",
      "message":"There is some issue in Automation reports trasnsferring "
    }
    sendReportsEmail.sendReportEmails(info);
   fs.unlinkSync(filename);
    await transferFiles();
  }
   })

 async function transferFiles(){              
    var d = new Date();
        
          const dir1 = './WhatsApp_Notifications_Daily_report/Reports_Weekly/';
         await fs.readdir(dir1, async(err, files) => {
            console.log("Reports file read ");
         if(files.length>0){
          for(let i=0;i<files.length;i++){
          let source='./WhatsApp_Notifications_Daily_report/Reports_Weekly/'+files[i];
          let newfile_name=files[i];
        
          let destination= './WhatsApp_Notifications_Daily_report/Reports_completed/'+newfile_name;
          fs.access("./WhatsApp_Notifications_Daily_report/Reports_completed", function(error) {
            if (error) {
              fs.mkdir("./WhatsApp_Notifications_Daily_report/Reports_completed", '0777', function(err) {
                if(err) console.log("New folder created");
                moveFile(source,destination);
              });
            }else{
              console.log("folder exists");
              moveFile(source,destination);  
              console.log("moved all files");  
            }
          })
        }
        }
          })
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
  
   //module.exports.whatsappusernotification = whatsappusernotification;
//module.exports.whatsappoptuserrequestresponse = whatsappoptuserrequestresponse;