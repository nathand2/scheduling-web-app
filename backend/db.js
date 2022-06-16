const mysql = require('mysql')
const dbUser = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'scheduler'
};


/**
 * Executes a db connection to make a sql query
 * @param {*} db_query sql query as a string
 * @returns query results in an array
 */
function dbConnection(query) {
  // TODO: Error handling on db connection and query.
  // TODO: Consider using pool queries?
  return new Promise((resolve, reject) => {
      const db = mysql.createConnection(dbUser);
      db.on('error', (err) => {
        reject(err)
      })
      db.connect((err) => {
          if (err) {
            reject(err)
          }
          console.log("Database connected");
          db.query(query, (err, result) => {
              if (err) {
                reject(err)
              }
              if (result) {
                  resolve(result);
              }
          });
      });
  }, (result) => {
    // Resolve
    return result;
  }, (err) => {
    // Reject
    console.log("Tried to catch error")
    throw err
  })
}

/**
 * Inserts new user into user table unless user with same google_id exists.
 * @param {*} googleID string representing session id
 * @returns userID as a int*
 */
exports.googleAuth = async (googleID) => {

  // try {
    // Check if google user exists in database.
    const results = await dbConnection(`SELECT * FROM users WHERE google_id = ${googleID};`);
    console.log("Query Results:", results);

    // If google user doesn't yet exist, add google user to db.
    if (!results.length > 0) {
      await dbConnection(`INSERT INTO users (google_id) VALUES (${googleID});`);
      console.log("Added user to db with google_id:", googleID);

      // Returns userID of first user found in db
      const userID = (await dbConnection(`SELECT * FROM users WHERE google_id = ${googleID} LIMIT 1;`))[0].id;
      return userID;
    } else {
      console.log("Existing Google User logged in.");
      const userID = results[0].id;
      return userID;
    }
  // } catch(err) {
  //   throw err;
  // }
};

exports.insertRefreshToken = async (token) => {
  // try {
    await dbConnection(`INSERT INTO refresh_token (token) VALUES ("${token}");`)
  // } catch(err) {
    // throw err;
  // }
}

/**
 * Returns refresh token from db if exists
 * @param {*} token JWT token as string
 * @returns refresh tokan as string or undefined
 */
exports.findRefreshToken = async (token) => {
  const result = await dbConnection(`SELECT * FROM refresh_token WHERE token = "${token}" LIMIT 1;`)
  if (results.length > 0) {
    return result[0];
  }
}

/**
 * Checks whether refresh token exists in db
 * @param {*} token jwt token as a sting
 * @returns if refresh token exists as a boolean
 */
exports.refreshTokenExists = async (token) => {
  const result = await dbConnection(`SELECT * FROM refresh_token WHERE token = "${token}" LIMIT 1;`)
  return result.length > 0
}

/**
 * Deletes a JWT refresh token from db
 * @param {*} token jwt token as a string
 */
exports.deleteRefreshToken = async (token) => {
  try {
    await dbConnection(`DELETE FROM refresh_token WHERE token = "${token}" LIMIT 1;`)
  } catch (err) {
    throw err;
  }
}