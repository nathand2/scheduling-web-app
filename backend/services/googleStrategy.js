const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const db = require('../db');

// Passport Google OAuth environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Google Auth. Creates new user account if necessary. Authenticates user.
const authUser = async (request, accessToken, refreshToken, profile, done) => {
  try {
    const {userId, username} = await db.googleAuth(profile.id);
    profile.username = username
    profile.userId = userId
    console.log("profile:", profile)
  } catch (err) {
    // Don't authenticate if error
    console.log("Google Strategy Caught error:", err.code);
    console.log(err)
    return done(null, null); // Reject Authentication
  }
  return done(null, profile);
};

// Passport config
passport.use(new GoogleStrategy({
  clientID:     GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:6500/auth/google/callback",
  passReqToCallback   : true,
  scope: ['profile', 'email']
}, authUser));
