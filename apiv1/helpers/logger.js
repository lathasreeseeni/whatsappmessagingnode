'use strict';
const winston = require('winston');
const fs = require('fs');
const env = process.env.NODE_ENV || 'development';
const logDir = 'log';
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const tsFormat = () => moment().format('YYYY-MM-DD hh:mm:ss').trim();
console.log(tsFormat);
const logger = winston.createLogger({
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      level: 'info'
    }),
    new (require('winston-daily-rotate-file'))({
      filename: `${logDir}/node.log`,
      timestamp: tsFormat,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      prepend: true,
      level: env === 'development' ? 'debug' : 'info'
    })
  ]
});

// exports.logger = require('./logger.js').logger;