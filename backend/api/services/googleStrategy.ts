import type { Request } from 'express'
import type { VerifyCallback } from 'passport-google-oauth2'

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const db = require('../db');

// Passport Google OAuth environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const appURL = process.env.NODE_ENV === 'development' ? "http://localhost:6500" : "https://api.nathandong.dev/scheduler"

// Google Auth. Creates new user account if necessary. Authenticates user.
interface GoogleProfile {
  [key: string]: unknown
  id: string
  displayName: string
  userId?: number
  redirect?: string
}

const authUser = async (
  request: Request,
  _accessToken: string,
  _refreshToken: string,
  providerProfile: unknown,
  done: VerifyCallback
): Promise<void> => {
  // The provider package exposes its profile as `any`; validate the fields
  // this application requires before passing it to the database layer.
  if (typeof providerProfile !== 'object' || providerProfile === null) {
    done(new Error('Google profile is missing'))
    return
  }
  const providerFields = providerProfile as Record<string, unknown>
  if (typeof providerFields.id !== 'string' || typeof providerFields.displayName !== 'string') {
    done(new Error('Google profile is missing required fields'))
    return
  }
  const profile: GoogleProfile = {
    ...providerFields,
    id: providerFields.id,
    displayName: providerFields.displayName
  }
  try {
    console.log("Profile:", profile)
    console.log("state?:", request.query.state)
    const {userId, displayName} = await db.googleAuth(profile.id, profile.displayName);
    profile.displayName = displayName
    profile.userId = userId
    const state = request.query.state
    profile.redirect = typeof state === 'string' ? state : undefined
  } catch (err) {
    // Don't authenticate if error
    console.log("Google Strategy Caught error:", err instanceof Error ? err.message : err);
    console.log(err)
    return done(null, null); // Reject Authentication
  }
  return done(null, profile);
};

// Passport config
passport.use(new GoogleStrategy({
  clientID:     GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: appURL + "/v2/auth/google/callback",
  passReqToCallback   : true,
  scope: ['profile', 'email']
}, authUser));
