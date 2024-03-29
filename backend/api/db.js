require('dotenv').config() // Environment variables stored in .env file
const mysql = require('mysql')

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD : '', // Empty string if undefined
  database: process.env.DB_DATABASE,
  timezone: 'UTC', // Interpret all received timestamps as UTC. Otherwise local timezone is assumed.
	dateStrings: [
		'DATE', // DATE's are returned as strings (otherwise they would be interpreted as YYYY-MM-DD 00:00:00+00:00)
		'DATETIME' // DATETIME's return as strings (otherwise they would interpreted as YYYY-MM-DD HH:mm:ss+00:00)
	]
};

const pool = mysql.createPool(config);
pool.on('connection', conn => {
	conn.query("SET time_zone='+00:00';", error => {
		if(error){
			throw error;
		}
	});
});

/**
 * TODO: Error checking if MySQL server is down not fully implemented
 */

/**
 * Executes a db connection to make a sql query using connection pooling
 * @param {*} db_query sql query as a string
 * @returns query results in an array
 */
const dbConnection = async (query) => {
  return new Promise((resolve, reject) => {
    pool.getConnection(function(err, connection) {
      if (err) throw err; // not connected!
     
      // Use the connection
      connection.query(query, function (error, results, fields) {
        // When done with the connection, release it.
        connection.release();
     
        // Handle error after the release.
        if (error) reject(error);
        resolve(results)
     
        // Don't use the connection here, it has been returned to the pool.
      });

  })
  }, (result) => {
    return result
  }, (err) => {
    console.log("Error has been thrown")
    throw err
  });
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
    // console.log("Results length:", typeof(results));

    // If google user doesn't yet exist, add google user to db.
    if (!results.length > 0) {
      const res = await dbConnection(`INSERT INTO user (external_id, external_type, display_name) VALUES (${googleID}, 'GOOGLE', '${displayName}');`);
      console.log("Added user to db with google_id:", googleID);
      // Assume no username created for new account
      const userId = res.insertId
      return {userId: userId, displayName: displayName};
    } else {
      console.log("Existing Google User logged in.");
      const userId = results[0].id;
      const displayName = results[0].display_name;
      return {userId: userId, displayName: displayName};
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

/**
 * Creates a session
 * @param {string} code 
 * @param {string} title 
 * @param {datetime} dt_start 
 * @param {datetime} dt_end 
 * @param {string} attendType 
 * @param {string} desc 
 * @param {int} groupID 
 * @returns 
 */
exports.createSession = async (code, title, dt_start, dt_end, attendType, desc=undefined, groupID=undefined) => {
  try {
    console.log("Create session query:", `INSERT INTO session (group_id, session_desc, session_title, dt_start, dt_end, attend_type, code) VALUES (${(groupID === undefined ? "NULL" : groupID) + ", "}${(desc === undefined ? "NULL" : "'" + desc + "'") + ', '}'${title}', '${dt_start}', '${dt_end}', '${attendType}', '${code}')`)
    const results = await dbConnection(`INSERT INTO session (group_id, session_desc, session_title, dt_start, dt_end, attend_type, code) VALUES (${(groupID === undefined ? "NULL" : groupID) + ", "}${(desc === undefined ? "NULL" : "'" + desc + "'") + ', '}'${title}', '${dt_start}', '${dt_end}', '${attendType}', '${code}')`)
    console.log("Inserted ID:", results.insertId)
    console.log("Session Code:", code)
    return results.insertId
  } catch(err) {
    throw err
  }
}

/**
 * Creates user session.
 * @param {int} userId 
 * @param {int} sessionId 
 * @param {string} role 
 * @returns 
 */
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

/**
 * Gets a session from db, if valid userId.
 * @param {int} userId 
 * @param {string} sessionCode 
 * @returns 
 */
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
    if (results.length > 0) {
      console.log("Got user session:", results[0].session_id)
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
    const results = await dbConnection(`SELECT session.*, user_session.role FROM session INNER JOIN user_session ON session.id = user_session.session_id WHERE user_session.user_id = ${userId} ORDER BY session.dt_created DESC;`)
    return results
  } catch(err) {
    throw err
  }
}

exports.getMySessions = async (userId) => {
  try {
    const results = await dbConnection(`SELECT session.*, user_session.role FROM session INNER JOIN user_session ON session.id = user_session.session_id WHERE user_session.user_id = ${userId} AND user_session.role = 'owner' ORDER BY session.dt_created DESC;`)
    return results
  } catch(err) {
    throw err
  }
}

exports.getOwnerUserSessionByUserIdAndSessionCode = async (userId, sessionCode) => {
  try {
    const results = await dbConnection(`SELECT * FROM user_session WHERE user_id = ${userId} AND session_id = (SELECT id FROM session WHERE code = '${sessionCode}' LIMIT 1) AND role = 'owner' LIMIT 1;`)
    return results
  } catch(err) {
    throw err
  }
}

exports.getUserSessionByUserIdAndSessionCode = async (userId, sessionCode) => {
  try {
    const results = await dbConnection(`SELECT * FROM user_session WHERE user_id = ${userId} AND session_id = (SELECT id FROM session WHERE code = '${sessionCode}' LIMIT 1) LIMIT 1;`)
    return results
  } catch(err) {
    throw err
  }
}

exports.getSessionInviteBySessionCode = async (sessionCode) => {
  try {
    const results = await dbConnection(`SELECT uuid FROM session_invite WHERE session_id = (SELECT id FROM session WHERE code = '${sessionCode}' LIMIT 1) LIMIT 1`)
    return results
  } catch(err) {
    throw err
  }
}

exports.createSessionInvite = async (sessionCode, type) => {
  try {
    const uuidResults = await dbConnection(`SELECT uuid();`)
    const uuid = uuidResults[0]['uuid()']
    console.log("New UUID:", uuid)
    
    const results = await dbConnection(`SELECT * FROM session_invite WHERE session_id = (SELECT id FROM session where code = '${sessionCode}');`)
    if (results.length > 0) {
      await dbConnection(`UPDATE session_invite SET uuid = '${uuid}', type = '${type}' WHERE session_id = (SELECT id FROM session where code = '${sessionCode}' LIMIT 1);`)
    } else {
      await dbConnection(`INSERT INTO session_invite (session_id, type, uuid) VALUES ((SELECT id FROM session where code = '${sessionCode}' LIMIT 1), '${type}', '${uuid}');`)
    }
    return uuid
  } catch(err) {
    throw err
  }
}

exports.createUserSessionBySessionInviteUuid = async (userId, uuid) => {
  try {
    // Check if user_session exists
    const existingUserSessionCodes = await dbConnection(`SELECT code FROM session WHERE id = (SELECT session_id FROM user_session WHERE user_id = ${userId} AND session_id = (SELECT session_id FROM session_invite WHERE uuid = '${uuid}' LIMIT 1) LIMIT 1);`)
    
    // If user_session exists for user and session, return sessionId
    if (existingUserSessionCodes.length > 0) {
      return {sessionCode: existingUserSessionCodes[0].code}
    }
    const sessionIds = await dbConnection(`SELECT code, id FROM session WHERE id = (SELECT session_id FROM session_invite WHERE uuid = '${uuid}' LIMIT 1);`)
    // console.log("STUFF:", sessionIds)
    if (!(sessionIds.length > 0)) {
      return  // Return undefined -> session not found (404)
    }
    const results = await dbConnection(`INSERT INTO user_session (user_id, session_id, role) VALUES (${userId}, ${sessionIds[0].id}, 'attendee');`)
    const newUserSessionInsertId = results.insertId
    const newUserSession = await dbConnection(`SELECT user_session_subset.*, user.display_name FROM (SELECT * FROM user_session WHERE id = ${newUserSessionInsertId} LIMIT 1) AS user_session_subset LEFT JOIN user ON user_session_subset.user_id = user.id;`)
    return {sessionCode: sessionIds[0].code, userSession: newUserSession}
  } catch(err) {
    throw err
  }
}

exports.getUserSessionByUserIdAndSessionId = async (userId, sessionId) => {
  try {
    const results = await dbConnection(`SELECT * FROM user_session WHERE user_id = ${userId} AND session_id = ${sessionId} LIMIT 1;`)
    return results
  } catch(err) {
    throw err
  }
}

exports.getSessionById = async (sessionId) => {
  try {
    const results = await dbConnection(`SELECT * FROM session WHERE id = ${sessionId} LIMIT 1;`)
    return results
  } catch(err) {
    throw err
  }
}

exports.createSessionTimeRange = async (userId, sessionId, dtStart, dtEnd, status) => {
  try {
    const results = await dbConnection(`INSERT INTO session_time_range (user_session_id, dt_start, dt_end, status) VALUES ((SELECT id FROM user_session WHERE user_id = ${userId} AND session_id = ${sessionId} LIMIT 1), '${dtStart}', '${dtEnd}', '${status}');`)
    return results.insertId
  } catch(err) {
    throw err
  }
}

exports.deleteSessionTimeRangeByIdAndUserId = async (userId, timeRangeId, userSessionId) => {
  
  try {
    const deleteResults = await dbConnection(`DELETE FROM session_time_range WHERE user_session_id = (SELECT id FROM user_session WHERE id = ${userSessionId} AND user_id = ${userId} LIMIT 1) AND id=${timeRangeId};`)
    console.log("results", deleteResults)
    return deleteResults
  } catch(err) {
    throw err
  }
}

exports.getSessionTimeRangeById = async (id) => {
  try {
    const results = await dbConnection(`SELECT * from session_time_range WHERE id = ${id};`)
    return results[0]
  } catch(err) {
    throw err
  }
}

exports.getSessionIdBySessionCode = async (sessionCode) => {
  try {
    const results = await dbConnection(`SELECT id FROM session WHERE code = '${sessionCode}' LIMIT 1;`)
    return results
  } catch(err) {
    throw err
  }
}

exports.getSessionTimeRanges = async (sessionId) => {
  try {
    const results = await dbConnection(
      // `SELECT * FROM (SELECT session_time_range.*, user_session_subset.user_id FROM (SELECT * FROM user_session WHERE session_id = ${sessionId}) AS user_session_subset INNER JOIN session_time_range ON user_session_subset.id = session_time_range.user_session_id) AS subset1;`
      `SELECT session_time_range_subset.*, user.display_name FROM (SELECT session_time_range.*, user_session_subset.user_id FROM (SELECT * FROM user_session WHERE session_id = ${sessionId}) AS user_session_subset INNER JOIN session_time_range ON user_session_subset.id = session_time_range.user_session_id) AS session_time_range_subset LEFT JOIN user ON session_time_range_subset.user_id = user.id ORDER BY session_time_range_subset.dt_created;`
    );
    return results
  } catch(err) {
    throw err
  }
}

exports.getUserSessionsBySessionId = async (sessionId) => {
  try {
    const results = await dbConnection(`SELECT user_session_subset.*, user.display_name FROM ((SELECT * FROM user_session WHERE session_id = ${sessionId}) as user_session_subset INNER JOIN user ON user_session_subset.user_id = user.id);`)
    return results
  } catch(err) {
    throw err
  }
}

exports.updateDisplayName = async (userId, displayName) => {
  try {
    const results =  await dbConnection(`UPDATE user SET display_name = '${displayName}' WHERE id = ${userId}`)
    return results
  } catch(err) {
    throw err
  }
}