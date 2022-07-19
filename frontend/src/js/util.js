exports.convertUTCStringToDate = (dtString) => {
  var t = dtString.split(/[- :T.]/);
  const date = new Date(Date.UTC(t[0], t[1] - 1, t[2], t[3], t[4], t[5]))
  return date
}