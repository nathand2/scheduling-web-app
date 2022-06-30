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
exports.googleAuth = async (googleID, displayName) => {

  try {
    // Check if google user exists in database.
    const results = await dbConnection(`SELECT * FROM user WHERE external_id = ${googleID} AND external_type = 'GOOGLE' LIMIT 1;`);
    console.log("Query Results:", results);

    // If google user doesn't yet exist, add google user to db.
    if (!results.length > 0) {
      const res = await dbConnection(`INSERT INTO user (external_id, external_type) VALUES (${googleID}, 'GOOGLE');`);
      console.log("Added user to db with google_id:", googleID);
      // Assume no username created for new account
      const userId = res.insertId
      return {userId: userID, username: undefined};
    } else {
      console.log("Existing Google User logged in.");
      const userId = results[0].id;
      const username = results[0].username;
      return {userId: userId, username: username};
    }
  } catch(err) {
    throw err;
  }
};

exports.test = () => {
  console.log("KEKW")
}

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

exports.createSession = async (code, title, dt_start, dt_end, attendType, desc=undefined, groupID=undefined) => {
  try {
    const results = await dbConnection(`INSERT INTO session (group_id, session_desc, session_title, dt_created, dt_expires, attend_type, code) VALUES (${(groupID === undefined ? "NULL" : groupID) + ", "}${(desc === undefined ? "NULL" : "'" + desc + "'") + ', '}'${title}', '${dt_start}', '${dt_end}', '${attendType}', '${code}')`)
    // console.log("Session query:", `INSERT INTO INSERT INTO session (group_id, session_desc, session_title, dt_created, dt_expires, attend_type) VALUES (${(groupID === undefined ? "NULL" : groupID) + ", "}${(desc === undefined ? "NULL" : "'" + desc + "'") + ', '}'${title}', '${dt_start}', '${dt_end}', '${attendType}')`)
    // console.log("Inserted ID:", results)
    console.log("Inserted ID:", results.insertId)
    console.log("Session Code:", code)
    return results.insertId
  } catch(err) {
    throw err
  }
}

exports.createUserSession = async (userId, sessionId, role) => {
  try {
    const results = await dbConnection(`INSERT INTO user_session (user_id, session_id, role) VALUES (${userId}, ${sessionId}, '${role}');`)
    console.log("Inserted UserSession ID:", results.insertId)
    return results.insertId
  } catch(err) {
    throw err
  }
}

/**
 * Uses user ID for now. Convert to username after
 * @param {string} id 
 * @returns 
 */
exports.getUserIdByExternalID = async (id, type) => {
  try {
    if (type === 'GOOGLE') {
      const results = await dbConnection(`SELECT id FROM user WHERE external_id = ${id} AND external_type = 'GOOGLE';`)
      console.log("Got user id:", results[0].id)
      return results[0].id
    } else {
      throw new Error('Non-Google ID?')
    }
  } catch(err) {
    throw err
  }
}

exports.getSession = async (userId, sessionCode) => {
  try {
    // // See if session exists
    console.log("Looking for session with code:", sessionCode)
    const sessionResults = await dbConnection(`SELECT * FROM session WHERE code = '${sessionCode}'`)
    if (sessionResults.length === 0) {
      return {status: 404} // Session Not found
    }
    const sessionId = sessionResults[0].id

    // Check if user_session exists
    const results = await dbConnection(`SELECT session_id FROM user_session WHERE user_id = ${userId} AND session_id = ${sessionId};`)
    console.log("Got user session:", results[0].session_id)
    if (results.length > 0) {
      return {status: 200, session: sessionResults[0]}
    } else {
      // User Session doesnt exist. 403 Forbidden
      return {status: 403}
    }
  } catch(err) {
    throw err
  }
}

exports.getSessions = async (userId) => {
  try {
    // const results = await dbConnection(`SELECT session.group_id, session.session_title, session.session_desc, session.dt_created FROM session INNER JOIN user_session ON session.id = user_session.session_id WHERE user_session.user_id = ${userId};`)
    const results = await dbConnection(`SELECT session.id, session.code, session.group_id, session.session_title, session.session_desc, session.dt_created FROM session INNER JOIN user_session ON session.id = user_session.session_id WHERE user_session.user_id = ${userId} ORDER BY session.dt_created DESC;`)
    return results
  } catch(err) {
    throw err
  }
}