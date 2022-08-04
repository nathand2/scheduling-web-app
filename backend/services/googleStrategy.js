const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const db = require('../db');

// Passport Google OAuth environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const appURL = process.env.NODE_ENV === 'development' ? "http://localhost:6500" : "https://api.nathandong.com/scheduler"

// Google Auth. Creates new user account if necessary. Authenticates user.
const authUser = async (request, accessToken, refreshToken, profile, done) => {
  try {
    console.log("Profile:", profile)
    console.log("state?:", request.query.state)
    const {userId, displayName} = await db.googleAuth(profile.id, profile.displayName);
    profile.displayName = displayName
    profile.userId = userId
    profile.redirect = request.query.state
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
  callbackURL: appURL + "/auth/google/callback",
  passReqToCallback   : true,
  scope: ['profile', 'email']
}, authUser));
