// exports.mySqlDtToJsDate = (dtString) => {
//   let dateTimeParts= dtString.split(/[- :]/); // regular expression split that creates array with: year, month, day, hour, minutes, seconds values
//   dateTimeParts[1]--; // monthIndex begins with 0 for January and ends with 11 for December so we need to decrement by one

//   const dateObject = new Date(...dateTimeParts); // our Date object
//   return dateObject
// }

// exports.mySqlDtToJsDate = (dtString) => {
//   var t = dtString.split(/[- :]/);

//   // Apply each element to the Date function
//   var d = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));

//   console.log(d);
//   return d
// }

exports.mySqlDtToJsDate = (dtString) => {
  var t = dtString.split(/[- :T.]/);
  console.log("Split date?:", t)
  const date = new Date(Date.UTC(t[0], t[1] - 1, t[2], t[3], t[4], t[5]))
  // console.log(date)
  return date
}