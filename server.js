//node js framework for support all the features
const express = require("express");
//logging for all the access logs
const logger = require("morgan");
const request = require("request");
//read all the request params and post body params
const bodyParser = require("body-parser");
//application level constants
//const api_const = require("./apiv1/helpers/apiConstants");
//application level logs
const log = require("./apiv1/helpers/logger");
//bhasakr added upto 17
const app = express();
// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument =( '/swagger.json');
//var bodyParser = ('body-parser');
const https = "http";

const uuidv4 = require("uuid/v4");
var jwt = require("jsonwebtoken");
let sha256 = require("sha256");
 const http = require('http');
//const sessionModel = require("./apiv1/models/sessionModel.js");

const fs = require("fs");
const path = require("path");
// const env = process.env.NODE_ENV || 'production';
const env = process.env.NODE_ENV || "development";
const config = require("./apiv1/config/config.json")[env];
module.exports.config = config;


//access log file rotation
const rfs = require("rotating-file-stream");
//Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately.
const helmet = require("helmet");
//base64 encoding
const base64 = require("base-64");
//utf8 encoding
const utf8 = require("utf8");
const router = require("express").Router();
const swaggerUi = require("swagger-ui-express");
//const swaggerDocument = require("./swagger.json");

// router.use('/api-docs', swaggerUi.serve);
// router.get('/api-docs', swaggerUi.setup(swaggerDocument));
// Set up the express app
//const app = express();

const port = process.env.port || process.env.PORT || 3978;
// const cors = require('cors');

const cors = require("cors");

var whitelist = [
  "http://localhost:9000",
  "http://localhost:3015",
  "http://40.121.163.143:3000",
  "http://40.121.163.143:9000",
  "http://40.121.163.143:8000",
  "http://localhost:8000",
  undefined,
];
var corsOptions = {
  exposedHeaders: "request-nonce",
  methods: "GET,POST",
  origin: function (origin, callback) {
    console.log(
      ":::::::::::::        ORIGIN OF REQUEST  :::::::::::::::::::::"
    );
    console.log(origin);
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));
//app.use(expressSession({ secret: "max", saveUninitialized: false, resave: false }));

//testins purpose
var requestIp = require("request-ip");

// inside middleware handler
app.get("/ipaddress", function (req, res, next) {
  //var ipMiddleware = function(req, res, next) {
  var os = require("os");
  var ifaces = os.networkInterfaces();

  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ("IPv4" !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        console.log("ram" + ifname + ":" + alias, iface.address);
      } else {
        // this interface has only one ipv4 adress
        console.log("bhasak" + ifname, iface.address);
      }
      ++alias;
    });
  });
  var clientIp = requestIp.getClientIp(req); // on localhost > 127.0.0.1
  console.log("clientIp" + clientIp);
  next();
});
//

//security checks
const frameguard = require("frameguard");

//node js framework for support mongodb queries
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
//url to connect to mongodb programatically
const mongodburl = require("./apiv1/config/mongodbConfig");
//connect to mongodb
// ,useUfiniedTopology: true            --> This is removed due to mongodb server timeout.
mongoose.connect(
  mongodburl,
  { useNewUrlParser: true, useFindAndModify: false },
  function (err) {
    if (err) {
      console.log("Not connected to Mongodb.");
      console.log(err);
    } else {
      console.log("Connected to Mongodb.");
    }
  }
);

/**
 * run the swagger
 */
//app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.static('public'));

// Deny frames from all origins
app.use(frameguard({ action: "DENY" }));

//noCache sets Cache-Control and Pragma headers to disable client-side caching.
const nocache = require("nocache");
app.use(nocache(), function (req, res, next) {
  next();
});

// Log requests to the console.
app.use(logger("dev"), function (req, res, next) {
  next();
});

//disable the x-powered-by
app.disable("x-powered-by");

// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json(), function (req, res, next) {
  next();
});
app.use(bodyParser.urlencoded({ extended: true }), function (req, res, next) {
  next();
});

//access logs
const logDirectory = path.join(__dirname, "log");

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// create a rotating write stream
const accessLogStream = rfs("access.log", {
  interval: "1d", // rotate daily
  path: logDirectory,
});

//set the access log format
const accessLogFormat =
  ':remote-addr [:date[iso]] ":method :url :status" ":user-agent" - :response-time ms';

// setup the logger
app.use(logger(accessLogFormat, { stream: accessLogStream }), function (
  req,
  res,
  next
) {
  next();
});
//supported http methods
//const allowedMethods = ["GET", "POST", "DELETE", "PUT"];
//removing put and delete for security fix - dangerous http method

// Serve only the static files form the dist directory
app.use(express.static(path.join(__dirname, "webclient")));

app.get("/", (req, res) => {
  const indexFile = path.resolve("./build/index.html");
  fs.readFile(indexFile, "utf8", (err, data) => {
    if (err) {
      console.error("Something went wrong:", err);
      return res.status(500).send("Oops, better luck next time!");
    }

    return res.send(data.replace('<div id="root"></div>'));
  });
});

app.use(express.static("./build"));
//app.use("/public", express.static(path.join(__dirname, "public")));

let exceptRoutes = (pathArray, middleware) => {
  return function (req, res, next) {
    console.log("REQUEST PATH :");
    console.log(req.path);
    console.log("PATH: ");
    console.log(pathArray);
    console.log("INDEX OF PATH");
    console.log(pathArray.indexOf(req.path));
    if (pathArray.indexOf(req.path) > -1) {
      // Exclude Path
      return next();
    } else {
      // Apply for all others
      return middleware(req, res, next);
    }
  };
};

let validateRequestNounce = async (req, res, next) => {
  let sessionid = "";
  let jwt_config = {
    secret: "worldisfullofdevelopers",
  };
  let token = req.headers["x-access-token"];
  if (!token) {
    return res.status(403).send({ auth: false, message: "No token provided." });
  }

  jwt.verify(token, jwt_config.secret, function (err, decoded) {
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });

    // if everything good, save to request for use in other routes
    req.userId = decoded.id;

    console.log(
      "\n\n:::::::::::::::::::::       TOKEN DATA AFTER DECODING        :::::::::::::::::\n\n"
    );
    console.log(JSON.stringify(decoded));

    sessionid = decoded.sessionid;
  });

  let userSession = await sessionModel.findOne({ sessionid: sessionid });
  console.log(
    ":::::::::::::::::::::::              USER SESSION              :::::::::::::::::"
  );
  console.log(userSession);
  if (!userSession) {
    return res.status(401).send({
      code: 401,
      status: "Invalid Token",
      message: "Invalid Token",
    });
  }

  if (!req["headers"]["request-nonce"]) {
    return res.status(400).send({
      code: 400,
      status: "Bad Request",
      message: "Bad Request",
    });
  } else if (req["headers"]["request-nonce"] != userSession["request_nonce"]) {
    return res.status(400).send({
      code: 400,
      status: "Invalid Request",
      message: "Invalid Request",
    });
  } else {
    console.log("REQUEST BODY");
    console.log(req.body);
    let date = new Date();
    let timestamp = date.getTime();

    console.log("PROTECTING THE SESSION REPLAY");
    console.log("TIMESTAMP");
    console.log(timestamp);

    let request_nonce = timestamp + "-" + uuidv4();
    request_nonce = sha256.x2(request_nonce);

    userSession["request_nonce"] = request_nonce;

    let session = new sessionModel(userSession);
    await session.save();
    res.setHeader("request-nonce", request_nonce);
    res.setHeader("Access-Control-Allow-Headers", "GET, POST");

    next();
  }
};

const allowedMethods = ["GET", "POST"];

let allowSpecifiedHttpMethods = async (req, res, next) => {
  if (!allowedMethods.includes(req.method)) {
    return res.status(api_const.code.method_not_allowed).send({
      code: api_const.code.method_not_allowed,
      status: api_const.status.failed,
      message: "Method not allowed",
    });
  } else {
    return next();
  }
};
app.use(allowSpecifiedHttpMethods);

let excludeRoutesList = [
  "/api/tenant/generaterandomtoken",
  "/api/tenant/login",
  "/api/tenant/logout",
  "/api/tenant/forgotpassword",
  "/api/tenant/otpverification",
  "/api/tenant/registration",
  "/api/tenant/getOrganizationid",
  "/api/tenant/sendotp",
  "/api/tenant/emailverifiedindb",
  "/whatsapp/whatsappdata",
  "/whatsapp/sendnotifications",
  "/api/messages/status",
  "/whatsapp/smssendnotifications",
  "/api/messages/smsstatus",
  "/api/messages/whatsapptwoway",
  "/api/tenant/whatsappusernotification"
];
// app.use(exceptRoutes(excludeRoutesList, validateRequestNounce));

//print all the requests
app.all("*", (req, res, next) => {
  return next();
});

// Require our routes into the application.
require("./apiv1/routes")(app);

// global error handler
app.use(function (err, req, res, next) {
  console.log(
    ":::::::::::::::::::::::::: IN LAST APP USE  MIDDLEWARE :::::::::::::::::::"
  );
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  console.log("err.status: " + err.status);

  //resource not found
  if (err.status == 404) {
    res.status(404);
    res.send({
      code: api_const.code.not_found,
      status: api_const.status.failed,
      message: err.message,
    });
  } else {
    res.status(500);
    res.send({
      code: api_const.code.error,
      status: api_const.status.failed,
      message: api_const.message.error,
      errors: Array(err.message),
    });
  }
});
 //const port1 = parseInt(process.env.PORT, 10) || 8000;
 //app.set('port1', port1);

 

// const server = http.createServer(app);
 //console.log('app is listing to the port='+ port1);
 //server.listen(port1);

module.exports = app;
