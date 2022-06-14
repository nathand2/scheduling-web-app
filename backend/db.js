const mysql = require('mysql')
const dbUser = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'scheduler'
};

function dbConnection(db_query) {
    return new Promise((resolve, reject) => {
        let db = mysql.createConnection(dbUser);
        db.connect((err) => {
            if (err) {
              throw err;
            }
            console.log("Database query");
            db.query(db_query, (err, result) => {
                if (err) reject(err)
                if (result) {
                    resolve(result);
                }
            });
        });
    }, (result) => {
      return result;
    })
}

/**
 * Inserts new user into user table unless user with same google_id exists.
 * @param {*} googleID string representing session id
 */
exports.googleAuth = async (googleID) => {

  // Check if google user exists in database.
  const results = await dbConnection(`SELECT * FROM users WHERE google_id = ${googleID};`);
  console.log("Query Results:", results);

  // If google user doesn't yet exist, add google user to db.
  if (!results.length > 0) {
    await dbConnection(`INSERT INTO users (google_id) VALUES (${googleID});`);
    console.log("Added user to db with google_id:", googleID);
    const userID = (await dbConnection(`SELECT * FROM users WHERE google_id = ${googleID};`))[0].id;
    return userID;
  } else {
     console.log("Existing Google User logged in.");
    // const userID = await dbConnection(`SELECT * FROM users WHERE google_id = ${googleID};`);
    const userID = results[0].id;
    console.log("User ID on login:", userID);
    return userID;
  }
 
  };