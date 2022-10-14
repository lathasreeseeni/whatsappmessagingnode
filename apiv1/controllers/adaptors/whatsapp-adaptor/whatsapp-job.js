const cron = require('node-cron') ;
const whatsappNoti = require('./sendNotifications.js');

//var task1 = cron.schedule('38 15 * * *', async () =>  {
  const whatsappjob = async function (req, res) {
    await whatsappNoti.sendWhatsappNotifications({},{})
    let value = await new Promise(resolve => setTimeout(function() { resolve('async middle') } , 3000));
    console.log(value)
    await whatsappNoti.sendWhatsappNotificationsPhase2()
    console.log('will execute every minute until stopped');

    }
  //});
  
/*
 async function test1(){
    console.log('in test1')
    console.log(new Date().toLocaleTimeString())
    let value = await new Promise(resolve => setTimeout(function() { resolve('async2') } , 3000));
    console.log(value)
    console.log('3');
  }
  async function test2(){
    console.log('in test2')
    let value = await new Promise(resolve => setTimeout(function() { resolve('async') } , 2000));
    console.log(value)
    console.log('2');
  }
  
  var task2 = cron.schedule('52 17 * * *', async () =>  {
    await test1();
    let value = await new Promise(resolve => setTimeout(function() { resolve('async middle') } , 3000));
    console.log(value)
    await test2()
    console.log('will execute every minute until stopped');
  });
  */
/*

  //const cron = require("node-cron");
var a;
var b;
var hr;
var min;
var sec;
cron.schedule("14 18 * * *", function () {
    min = 30;
    hr = 8;
    sec = "15 18 * * *";
    if (a) {
        a.stop()
    }
    a = cron.schedule(sec, function () {console.log('cron a')});
    min = 30;
    hr = 16;
    sec = "16 18 * * *";
    if (b) {
        b.stop();
    }
    b = cron.schedule(sec, function () {console.log('cron b')});
});*/

module.exports.whatsappjob = whatsappjob;