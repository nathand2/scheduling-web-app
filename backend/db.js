const mysql = require('mysql')
const dbUser = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'scheduler'
};

/**
 * TODO: Error checking if MySQL server is down not fully implemented
 */

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
    db.end(function(err) {
      if (err) {
        return console.log('error:' + err.message);
      }
      console.log('Close the database connection.');
    });
    return result;
  }, (err) => {
    // Reject
    throw err
  })
}

/**
 * Inserts new user into user table unless user with same google_id exists.
 * @param {*} googleID string representing session id
 * @returns userID as a int*
 */
exports.googleAuth = async (googleID) => {

  try {
    // Check if google user exists in database.
    const results = await dbConnection(`SELECT * FROM user WHERE google_id = ${googleID};`);
    console.log("Query Results:", results);

    // If google user doesn't yet exist, add google user to db.
    if (!results.length > 0) {
      await dbConnection(`INSERT INTO user (google_id) VALUES (${googleID});`);
      console.log("Added user to db with google_id:", googleID);

      // Returns userID of first user found in db
      const userID = (await dbConnection(`SELECT * FROM user WHERE google_id = ${googleID} LIMIT 1;`))[0].id;
      return userID;
    } else {
      console.log("Existing Google User logged in.");
      const userID = results[0].id;
      return userID;
    }
  } catch(err) {
    throw err;
  }
};

/**
 * Insert refresh token into db
 * @param {string} token JWT access token
 */
exports.insertRefreshToken = async (token) => {
  try {
    await dbConnection(`INSERT INTO refresh_token (token) VALUES ("${token}");`)
  } catch(err) {
    throw err;
  }
}

/**
 * Returns refresh token from db if exists
 * @param {*} token JWT token as string
 * @returns refresh tokan as string or undefined
 */
exports.findRefreshToken = async (token) => {
  try {
    const result = await dbConnection(`SELECT * FROM refresh_token WHERE token = "${token}" LIMIT 1;`)
    if (results.length > 0) {
      return result[0];
    }
  } catch(err) {
    throw err;
  }
}

/**
 * Checks whether refresh token exists in db
 * @param {*} token jwt token as a sting
 * @returns if refresh token exists as a boolean
 */
exports.refreshTokenExists = async (token) => {
  try {
    const result = await dbConnection(`SELECT * FROM refresh_token WHERE token = "${token}" LIMIT 1;`)
    return result.length > 0
  } catch(err) {
    throw err
  }
}

/**
 * Deletes a JWT refresh token from db
 * @param {*} token jwt token as a string
 */
exports.deleteRefreshToken = async (token) => {
  try {
    await dbConnection(`DELETE FROM refresh_token WHERE token = "${token}" LIMIT 1;`)
    return;
  } catch (err) {
    throw err;
  }
}

exports.createSession = async (title, dt_start, dt_end, attendType, desc=undefined, groupID=undefined) => {
  try {
    const results = await dbConnection(`INSERT INTO session (group_id, session_desc, session_title, dt_created, dt_expires, attend_type) VALUES (${(groupID === undefined ? "NULL" : groupID) + ", "}${(desc === undefined ? "NULL" : "'" + desc + "'") + ', '}'${title}', '${dt_start}', '${dt_end}', '${attendType}')`)
    console.log("Session query:", `INSERT INTO INSERT INTO session (group_id, session_desc, session_title, dt_created, dt_expires, attend_type) VALUES (${(groupID === undefined ? "NULL" : groupID) + ", "}${(desc === undefined ? "NULL" : "'" + desc + "'") + ', '}'${title}', '${dt_start}', '${dt_end}', '${attendType}')`)
    // console.log("Inserted ID:", results)
    console.log("Inserted ID:", results.insertId)
    return results.insertId
  } catch(err) {
    throw err
  }
}