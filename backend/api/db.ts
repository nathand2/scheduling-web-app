import type { OkPacket } from 'mysql'

require('dotenv').config() // Environment variables stored in .env file
const mysql = require('mysql') as typeof import('mysql')

type DbDate = string | Date

interface UserRow {
  id: number
  role: string
  username: string | null
  password: string | null
  external_id: string | null
  external_type: string | null
  display_name: string | null
  dt_created: DbDate
  dt_last_login: DbDate
}

interface SessionRow {
  id: number
  code: string
  group_id: number | null
  session_title: string
  session_desc: string | null
  max_session_members: number
  dt_created: DbDate
  dt_start: DbDate
  dt_end: DbDate
  attend_type: string
}

interface UserSessionRow {
  id: number
  user_id: number
  session_id: number
  role: string
  dt_joined: DbDate
}

interface SessionTimeRangeRow {
  id: number
  user_session_id: number
  dt_created: DbDate
  dt_start: DbDate
  dt_end: DbDate
  status: string
}

interface RefreshTokenRow {
  id: number
  user_id: number | null
  token: string
}

interface SessionTimeRangeWithUser extends SessionTimeRangeRow {
  user_id: number
  display_name: string | null
}

interface UserSessionWithName extends UserSessionRow {
  display_name: string | null
}

interface SessionWithRole extends SessionRow {
  role: string
}

const config: import('mysql').PoolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD : '', // Empty string if undefined
  database: process.env.DB_DATABASE,
  timezone: 'UTC', // Interpret all received timestamps as UTC. Otherwise local timezone is assumed.
	dateStrings: [
		'DATE', // DATE's are returned as strings (otherwise they would be interpreted as YYYY-MM-DD 00:00:00+00:00)
		'DATETIME' // DATETIME's return as strings (otherwise they would interpreted as YYYY-MM-DD HH:mm:ss+00:00)
	]
};

const formatDate = (isoString: string | Date) => {
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ')
}

const pool = mysql.createPool(config);
exports.closePool = (): Promise<void> => new Promise<void>((resolve, reject) => {
  pool.end((error: Error | null) => error ? reject(error) : resolve());
});
pool.on('connection', conn => {
	conn.query("SET time_zone='+00:00';", error => {
		if(error){
			throw error;
		}
	});
});

// Check if the pool can connect
pool.getConnection((err, conn) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database!');

  // Optionally, you can release the connection back to the pool
  conn.release();
});

/**
 * TODO: Error checking if MySQL server is down not fully implemented
 */

/**
 * Executes a db connection to make a sql query using connection pooling
 * @param {*} db_query sql query as a string
 * @returns query results in an array
 */
const dbConnection = async <T>(query: string, params: unknown[] = []): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    pool.getConnection(function(err, connection) {
      if (err) return reject(err);
     
      // Use the connection
      connection.query(query, params, function (error, results, fields) {
        // When done with the connection, release it.
        connection.release();
     
        // Handle error after the release.
        if (error) return reject(error);
        // The mysql package cannot infer a row type from SQL. Callers declare
        // the selected columns at this boundary through T.
        resolve(results as T)
     
        // Don't use the connection here, it has been returned to the pool.
      });
    });
  });
}

/**
 * Inserts new user into user table unless user with same google_id exists.
 * @param {*} googleID string representing session id
 * @returns userID as a int*
 */
exports.googleAuth = async (googleID: string, displayName: string): Promise<{ userId: number; displayName: string | null }> => {

  try {
    // Check if google user exists in database.
    const results = await dbConnection<UserRow[]>('SELECT * FROM user WHERE external_id = ? AND external_type = ? LIMIT 1;', [googleID, 'GOOGLE']);
    console.log("Query Results:", results);
    // console.log("Results length:", typeof(results));

    // If google user doesn't yet exist, add google user to db.
    if (results.length === 0) {
      const res = await dbConnection<OkPacket>('INSERT INTO user (external_id, external_type, display_name) VALUES (?, ?, ?);', [googleID, 'GOOGLE', displayName]);
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
 * Gets user by username for Username/Password auth
 * @param {*} username 
 * @returns user row with matching username
 */
exports.getUserByUsername = async (username: string): Promise<UserRow[]> => {
  try {
    return await dbConnection<UserRow[]>('SELECT * FROM user WHERE username = ? LIMIT 1;', [username])
  } catch(err) {
    throw err;
  }
}

/**
 * Create local user that uses Username/Password auth
 * @param {*} username 
 * @param {*} passwordHash 
 * @param {*} displayName 
 * @returns userID as a int
 */
exports.createLocalUser = async (username: string, passwordHash: string, displayName: string): Promise<number> => {
  try {
    const result = await dbConnection<OkPacket>('INSERT INTO user (username, password, display_name, external_type) VALUES (?, ?, ?, ?);', [username, passwordHash, displayName, 'LOCAL'])
    return result.insertId
  } catch(err) {
    throw err;
  }
}

/**
 * Insert refresh token into db
 * @param {string} token JWT access token
 */
exports.insertRefreshToken = async (token: string): Promise<void> => {
  try {
    await dbConnection<OkPacket>('INSERT INTO refresh_token (token) VALUES (?);', [token])
  } catch(err) {
    throw err;
  }
}

/**
 * Returns refresh token from db if exists
 * @param {*} token JWT token as string
 * @returns refresh tokan as string or undefined
 */
exports.findRefreshToken = async (token: string): Promise<RefreshTokenRow | undefined> => {
  try {
    const result = await dbConnection<RefreshTokenRow[]>('SELECT * FROM refresh_token WHERE token = ? LIMIT 1;', [token])
    if (result.length > 0) {
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
exports.refreshTokenExists = async (token: string): Promise<boolean> => {
  try {
    const result = await dbConnection<RefreshTokenRow[]>('SELECT * FROM refresh_token WHERE token = ? LIMIT 1;', [token])
    return result.length > 0
  } catch(err) {
    throw err
  }
}

/**
 * Deletes a JWT refresh token from db
 * @param {*} token jwt token as a string
 */
exports.deleteRefreshToken = async (token: string): Promise<void> => {
  try {
    await dbConnection<OkPacket>('DELETE FROM refresh_token WHERE token = ? LIMIT 1;', [token])
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
exports.createSession = async (code: string, title: string, dt_start: string | Date, dt_end: string | Date, attendType: string, desc?: string, groupID?: number): Promise<number> => {
  try {
    const results = await dbConnection<OkPacket>('INSERT INTO session (group_id, session_desc, session_title, dt_start, dt_end, attend_type, code) VALUES (?, ?, ?, ?, ?, ?, ?);', [groupID ?? null, desc ?? null, title, formatDate(dt_start), formatDate(dt_end), attendType, code])
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
exports.createUserSession = async (userId: number, sessionId: number, role: string): Promise<number> => {
  try {
    const results = await dbConnection<OkPacket>('INSERT INTO user_session (user_id, session_id, role) VALUES (?, ?, ?);', [userId, sessionId, role])
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
exports.getUserIdByExternalID = async (id: string, type: string): Promise<number> => {
  try {
    if (type === 'GOOGLE') {
      const results = await dbConnection<Array<Pick<UserRow, 'id'>>>('SELECT id FROM user WHERE external_id = ? AND external_type = ?;', [id, 'GOOGLE'])
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
exports.getSession = async (userId: number, sessionCode: string): Promise<{ status: 404 | 403 } | { status: 200; session: SessionRow }> => {
  try {
    // // See if session exists
    console.log("Looking for session with code:", sessionCode)
    const sessionResults = await dbConnection<SessionRow[]>('SELECT * FROM session WHERE code = ? LIMIT 1;', [sessionCode])
    if (sessionResults.length === 0) {
      return {status: 404} // Session Not found
    }
    const sessionId = sessionResults[0].id

    // Check if user_session exists
    const results = await dbConnection<Array<Pick<UserSessionRow, 'session_id'>>>('SELECT session_id FROM user_session WHERE user_id = ? AND session_id = ?;', [userId, sessionId])
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

exports.getSessions = async (userId: number): Promise<SessionWithRole[]> => {
  try {
    const results = await dbConnection<SessionWithRole[]>('SELECT session.*, user_session.role FROM session INNER JOIN user_session ON session.id = user_session.session_id WHERE user_session.user_id = ? ORDER BY session.dt_created DESC;', [userId])
    return results
  } catch(err) {
    throw err
  }
}

exports.getMySessions = async (userId: number): Promise<SessionWithRole[]> => {
  try {
    const results = await dbConnection<SessionWithRole[]>("SELECT session.*, user_session.role FROM session INNER JOIN user_session ON session.id = user_session.session_id WHERE user_session.user_id = ? AND user_session.role = 'owner' ORDER BY session.dt_created DESC;", [userId])
    return results
  } catch(err) {
    throw err
  }
}

exports.getOwnerUserSessionByUserIdAndSessionCode = async (userId: number, sessionCode: string): Promise<UserSessionRow[]> => {
  try {
    const results = await dbConnection<UserSessionRow[]>("SELECT * FROM user_session WHERE user_id = ? AND session_id = (SELECT id FROM session WHERE code = ? LIMIT 1) AND role = 'owner' LIMIT 1;", [userId, sessionCode])
    return results
  } catch(err) {
    throw err
  }
}

exports.getUserSessionByUserIdAndSessionCode = async (userId: number, sessionCode: string): Promise<UserSessionRow[]> => {
  try {
    const results = await dbConnection<UserSessionRow[]>('SELECT * FROM user_session WHERE user_id = ? AND session_id = (SELECT id FROM session WHERE code = ? LIMIT 1) LIMIT 1;', [userId, sessionCode])
    return results
  } catch(err) {
    throw err
  }
}

exports.getSessionInviteBySessionCode = async (sessionCode: string): Promise<Array<{ uuid: string }>> => {
  try {
    const results = await dbConnection<Array<{ uuid: string }>>('SELECT uuid FROM session_invite WHERE session_id = (SELECT id FROM session WHERE code = ? LIMIT 1) LIMIT 1', [sessionCode])
    return results
  } catch(err) {
    throw err
  }
}

exports.createSessionInvite = async (sessionCode: string, type: string): Promise<string> => {
  try {
    const uuidResults = await dbConnection<Array<{ 'uuid()': string }>>(`SELECT uuid();`)
    const uuid = uuidResults[0]['uuid()']
    console.log("New UUID:", uuid)
    
    const results = await dbConnection<Array<{ id: number }>>('SELECT id FROM session_invite WHERE session_id = (SELECT id FROM session where code = ?);', [sessionCode])
    if (results.length > 0) {
      await dbConnection<OkPacket>('UPDATE session_invite SET uuid = ?, type = ? WHERE session_id = (SELECT id FROM session where code = ? LIMIT 1);', [uuid, type, sessionCode])
    } else {
      await dbConnection<OkPacket>('INSERT INTO session_invite (session_id, type, uuid) VALUES ((SELECT id FROM session where code = ? LIMIT 1), ?, ?);', [sessionCode, type, uuid])
    }
    return uuid
  } catch(err) {
    throw err
  }
}

exports.createUserSessionBySessionInviteUuid = async (userId: number, uuid: string): Promise<{ sessionCode: string; userSession?: UserSessionWithName[] } | undefined> => {
  try {
    // Check if user_session exists
    const existingUserSessionCodes = await dbConnection<Array<{ code: string }>>('SELECT code FROM session WHERE id = (SELECT session_id FROM user_session WHERE user_id = ? AND session_id = (SELECT session_id FROM session_invite WHERE uuid = ? LIMIT 1) LIMIT 1);', [userId, uuid])
    
    // If user_session exists for user and session, return sessionId
    if (existingUserSessionCodes.length > 0) {
      return {sessionCode: existingUserSessionCodes[0].code}
    }
    const sessionIds = await dbConnection<Array<Pick<SessionRow, 'code' | 'id'>>>('SELECT code, id FROM session WHERE id = (SELECT session_id FROM session_invite WHERE uuid = ? LIMIT 1);', [uuid])
    // console.log("STUFF:", sessionIds)
    if (!(sessionIds.length > 0)) {
      return  // Return undefined -> session not found (404)
    }
    const results = await dbConnection<OkPacket>("INSERT INTO user_session (user_id, session_id, role) VALUES (?, ?, 'attendee');", [userId, sessionIds[0].id])
    const newUserSessionInsertId = results.insertId
    const newUserSession = await dbConnection<UserSessionWithName[]>('SELECT user_session_subset.*, user.display_name FROM (SELECT * FROM user_session WHERE id = ? LIMIT 1) AS user_session_subset LEFT JOIN user ON user_session_subset.user_id = user.id;', [newUserSessionInsertId])
    return {sessionCode: sessionIds[0].code, userSession: newUserSession}
  } catch(err) {
    throw err
  }
}

exports.getUserSessionByUserIdAndSessionId = async (userId: number, sessionId: number): Promise<UserSessionRow[]> => {
  try {
    const results = await dbConnection<UserSessionRow[]>('SELECT * FROM user_session WHERE user_id = ? AND session_id = ? LIMIT 1;', [userId, sessionId])
    return results
  } catch(err) {
    throw err
  }
}

exports.getSessionById = async (sessionId: number): Promise<SessionRow[]> => {
  try {
    const results = await dbConnection<SessionRow[]>('SELECT * FROM session WHERE id = ? LIMIT 1;', [sessionId])
    return results
  } catch(err) {
    throw err
  }
}

exports.createSessionTimeRange = async (userId: number, sessionId: number, dtStart: string | Date, dtEnd: string | Date, status: string): Promise<number> => {
  try {
    const results = await dbConnection<OkPacket>('INSERT INTO session_time_range (user_session_id, dt_start, dt_end, status) VALUES ((SELECT id FROM user_session WHERE user_id = ? AND session_id = ? LIMIT 1), ?, ?, ?);', [userId, sessionId, formatDate(dtStart), formatDate(dtEnd), status])
    return results.insertId
  } catch(err) {
    throw err
  }
}

exports.deleteSessionTimeRangeByIdAndUserId = async (userId: number, timeRangeId: number, userSessionId: number): Promise<OkPacket> => {
  
  try {
    const deleteResults = await dbConnection<OkPacket>('DELETE FROM session_time_range WHERE user_session_id = (SELECT id FROM user_session WHERE id = ? AND user_id = ? LIMIT 1) AND id = ?;', [userSessionId, userId, timeRangeId])
    console.log("results", deleteResults)
    return deleteResults
  } catch(err) {
    throw err
  }
}

exports.getSessionTimeRangeById = async (id: number): Promise<SessionTimeRangeRow | undefined> => {
  try {
    const results = await dbConnection<SessionTimeRangeRow[]>('SELECT * from session_time_range WHERE id = ?;', [id])
    return results[0]
  } catch(err) {
    throw err
  }
}

exports.getSessionIdBySessionCode = async (sessionCode: string): Promise<Array<{ id: number }>> => {
  try {
    const results = await dbConnection<Array<{ id: number }>>('SELECT id FROM session WHERE code = ? LIMIT 1;', [sessionCode])
    return results
  } catch(err) {
    throw err
  }
}

exports.getSessionTimeRanges = async (sessionId: number): Promise<SessionTimeRangeWithUser[]> => {
  try {
    const results = await dbConnection<SessionTimeRangeWithUser[]>(
      // `SELECT * FROM (SELECT session_time_range.*, user_session_subset.user_id FROM (SELECT * FROM user_session WHERE session_id = ${sessionId}) AS user_session_subset INNER JOIN session_time_range ON user_session_subset.id = session_time_range.user_session_id) AS subset1;`
      'SELECT session_time_range_subset.*, user.display_name FROM (SELECT session_time_range.*, user_session_subset.user_id FROM (SELECT * FROM user_session WHERE session_id = ?) AS user_session_subset INNER JOIN session_time_range ON user_session_subset.id = session_time_range.user_session_id) AS session_time_range_subset LEFT JOIN user ON session_time_range_subset.user_id = user.id ORDER BY session_time_range_subset.dt_created;', [sessionId]
    );
    return results
  } catch(err) {
    throw err
  }
}

exports.getUserSessionsBySessionId = async (sessionId: number): Promise<UserSessionWithName[]> => {
  try {
    const results = await dbConnection<UserSessionWithName[]>('SELECT user_session_subset.*, user.display_name FROM ((SELECT * FROM user_session WHERE session_id = ?) as user_session_subset INNER JOIN user ON user_session_subset.user_id = user.id);', [sessionId])
    return results
  } catch(err) {
    throw err
  }
}

exports.updateDisplayName = async (userId: number, displayName: string): Promise<OkPacket> => {
  try {
    const results =  await dbConnection<OkPacket>('UPDATE user SET display_name = ? WHERE id = ?', [displayName, userId])
    return results
  } catch(err) {
    throw err
  }
}
