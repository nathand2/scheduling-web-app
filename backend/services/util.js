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



// exports.addLeadingZeros = (num, totalLength) => {
//   return String(num).padStart(totalLength, '0');
// }

// exports.generateTag = () => {
//   const randNum = Math.floor(Math.random() * 10000)
//   const tag = this.addLeadingZeros(randNum, 4)
//   return tag
// }

// exports.checkUsernameTagExists = async (username, tag) => {
//   try {
//     const results = await dbConnection(`SELECT * FROM user where username = ${username} and tag = ${tag};`)

//     return results.length > 0 // Returns true if exists, else false
//   } catch(err) {
//     throw err
//   }
// }

// exports.findValidUsernameTag = async (username) => {
//   let count = 0;
//   while(count < tagGenRounds) {
//     const newTag = this.generateTag()
//     if(!this.checkUsernameTagExists(username, newTag)) {
//       return {username: username, tag: newTag}
//     }
//   }

//   // If can't find valid username/tag
//   throw new Error('Unable to find unique Username and Tag')
// }