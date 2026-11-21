// declare all characters
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const sessionCodeLength = 7

exports.generateSessionCode = () => {
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < sessionCodeLength; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

exports.dtRefreshFingerprintCookieExpires = () => {
  return new Date(Date.now() + 3600000 * 24 * 30) // 30 days
//   return new Date(Date.now() + 1000 * 60 * 3) // 3 minutes
}

// exports.dtRefreshFingerprintCookieExpires = () => {
//   return new Date(Date.now() + 3600000 * 24 * 30) // 30 days
// //   return new Date(Date.now() + 1000 * 60 * 3) // 3 minutes
// }

