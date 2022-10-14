const moment = require('moment-timezone');


let getDateAndTime = async function () {

let dateTime = new Date();

let dateObj = {
    "date": dateTime
}
return dateObj;
}

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

let getCurrentYear = async function () {
  let currentyear = new Date().getFullYear();
  return currentyear;
}
module.exports.getDateAndTime=getDateAndTime;
module.exports.getStartAndEndDates = getStartAndEndDates;
module.exports.getCurrentYear = getCurrentYear;