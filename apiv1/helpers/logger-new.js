const winston = require('winston')
const dateFormat1 = require('dateformat');
dateFormat = () => {
  return dateFormat1(parseInt(new Date(Date.now())))
//  return new Date(Date.now()).toUTCString()
}
class LoggerService {
  constructor(route) {
    this.log_data = null
    this.route = route
    let  today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    route = dd+'_'+mm+'_'+ yyyy +'_'+route
    //console.log(route)
    const logger = winston.createLogger({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: `/backup/logs/${route}.log`
        })
      ],
      format: winston.format.printf((info) => {
        let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${route}.log | ${info.message} | `
        message = info.obj ? message + `data:${JSON.stringify(info.obj)} | ` : message
        message = this.log_data ? message + `log_data:${JSON.stringify(this.log_data)} | ` : message
        return message
      })
   });
   this.logger = logger
}
setLogData(log_data) {
  this.log_data = log_data
}
async info(message) {
  this.logger.log('info', message);
}
async info(message, obj) {
  this.logger.log('info', message, {
    obj
  })
}
async debug(message) {
  this.logger.log('debug', message);
}
async debug(message, obj) {
  this.logger.log('debug', message, {
    obj
  })
}
async error(message) {
  this.logger.log('error', message);
}
async error(message, obj) {
  this.logger.log('error', message, {
    obj
  })
}
}
module.exports = LoggerService
