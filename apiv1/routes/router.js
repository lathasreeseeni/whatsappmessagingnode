
'use strict';
var express = require('express');
var router = express.Router();


var multer = require('multer')
const auth = require('./auth');
//var userservicesController = require('./../controllers/user/users_controller');
var sendNotificationsController = require('./../controllers/adaptors/whatsapp-adaptor/sendNotifications');
var storerecordsController = require('./../controllers/adaptors/whatsapp-adaptor/otherchannelsoptout.js');
var smssendNotificationsController=require('./../controllers/adaptors/whatsapp-adaptor/smssendNotifications');
// var whatsappdataController = require('./../controllers/adaptors/whatsapp-adaptor/sendNotifications')
// var whatsappStatus=require('./../controllers/adaptors/whatsapp-adaptor/status')
//var userservicesController = require('./../controllers/user/users_controller');
var dailyreportWhatsapp = require('./../controllers/adaptors/whatsapp-adaptor/dailyreportWhatsapp');
var whatsappGreetings = require('./../controllers/adaptors/whatsapp-adaptor/greetOccasions.js');
var modemNotifications = require('./../controllers/adaptors/whatsapp-adaptor/modemNotifications.js');
var whatsappjobs = require('./../controllers/adaptors/whatsapp-adaptor/whatsapp-job.js');

router.post('/register', (req, res) => userservicesController.register(req, res));
router.post('/authenticate', (req, res) => userservicesController.authenticate(req, res));




// router.post('/test', (req, res) => userservicesController.getAll(req, res));
//router.get('/sendnotifications', auth,  (req, res) => sendNotificationsController.sendWhatsappNotifications(req, res));
router.get('/sendnotifications', auth,  (req, res) => whatsappjobs.whatsappjob(req, res));
router.get('/greetings',auth,(req,res) => whatsappGreetings.sendWhatsappgreeting(req,res));
router.get('/modemmessages',auth,(req,res)=>modemNotifications.sendModemnotifications(req,res));
router.get('/storerecords',(req,res)=>storerecordsController.storeRecords(req,res));

router.get('/SMSsendnotifications', (req, res) => smssendNotificationsController.sendSMSNotifications(req, res));

router.get('/whatsappdata',(req,res)=>sendNotificationsController.getWhatsappdata(req,res));
router.get('/status',(req,res)=> whatsappStatus.whatsappStatuses(req,res));

router.get("/whatsappusernotification", (req, res) =>
dailyreportWhatsapp.whatsappusernotification(req, res)
);

router.get("/whatsappoptuserrequestresponse", (req, res) =>
dailyreportWhatsapp.whatsappoptuserrequestresponse(req, res)
);

//router.get('/test', auth, (req,res)=> sendNotificationsController.testQueryfordate(req,res));
// api_tenant_router.post('/botconfig', (req, res) => botconfigController.bot_config(req, res));
// api_tenant_router.get('/botlist/:bot_id', (req, res) => botconfigController.bot_configbyid(req, res));


module.exports = router;