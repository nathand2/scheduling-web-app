const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const db = require('../db');
const jwtAuth = require('./jwtAuth');

// Passport Google OAuth environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Google Auth. Creates new user account if necessary. Authenticates user.
const authUser = async (request, accessToken, refreshToken, profile, done) => {
  // console.log("Old profile", profile);
  var user_id;
  try {
    user_id = await db.googleAuth(profile.id);
  } catch (err) {
    // Don't authenticate if error
    console.log("Database Connection Error");
    return;
  }
  // console.log("Generating JWT Token");
  // jwtAuth.signToken(user_id);
  return done(null, profile);
};

// Passport config
passport.use(new GoogleStrategy({
  clientID:     GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5500/auth/google/callback",
  passReqToCallback   : true
}, authUser));
