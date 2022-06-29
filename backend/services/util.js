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