"use strict";

//const api_tenant_router = require("./api_tenant_router.js");


var whatsapp = require("./../controllers/adaptors/whatsapp-adaptor/whatsapp.js");
;
//var ui_router = require("./ui_router.js");
var common_router = require('./router.js');
var whatsapp_twoway = require("./../controllers/adaptors/whatsapp-adaptor/whatsappTwowaychat.js");

module.exports = (app) => {
  //app.use("/ui", ui_router);

  //router for api of all bots for different channels
  // app.use("/api/hooks", api_hooks_router);
  //router for api of all bots for different channels
  // app.use("/api/channels/", api_channels_router);
  //router for api of all bots for different channels
  //app.use("/api/tenant/", api_tenant_router);
  app.use('/whatsapp', common_router);
 
  
 
  app.use("/api/messages/whatsapptwoway",whatsapp_twoway.whatsappTwowayIntegration);
  app.use("/api/messages/status",whatsapp.whatsappStatus);
  

  //router for api of all bots for different channels
  
};
