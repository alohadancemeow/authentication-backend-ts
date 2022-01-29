import passport from "passport";
import {
    Strategy as FacebookStrategy,
    StrategyOptionWithRequest as FacebookStrategyOptionWithRequest,
} from 'passport-facebook'
import {
    Strategy as GoogleStrategy,
    StrategyOptionsWithRequest as GoogleStrategyOptionsWithRequest
} from 'passport-google-oauth20'
import { AppRequest } from "../types";

// .env veriables
const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env

// # TODO: Facebook Passport
const facebookConfig: FacebookStrategyOptionWithRequest = {
    clientID: FACEBOOK_APP_ID!,
    clientSecret: FACEBOOK_APP_SECRET!,
    callbackURL: "http://localhost:5000/auth/facebook/callback",
    profileFields: ['id', 'email', 'displayName', 'name'],
    passReqToCallback: true
}

export const passportFacebook = () => passport.use(new FacebookStrategy(
    facebookConfig,
    (req, _, __, profile, done) => {
        try {
            if (profile) {
                // first convert req --> AppRequest
                (req as AppRequest).userProfile = profile
                done(null, profile)
            }
        } catch (error) {
            done(error)
        }
    }
))


// # TODO: Google Passport
const googleConfig: GoogleStrategyOptionsWithRequest = {
    clientID: GOOGLE_CLIENT_ID!,
    clientSecret: GOOGLE_CLIENT_SECRET!,
    callbackURL: 'http://localhost:5000/auth/google/callback',
    passReqToCallback: true
}

export const passportGoogle = () => passport.use(new GoogleStrategy(
    googleConfig,
    (req, _, __, profile, done) => {
        try {
            if (profile) {
                // first convert req --> AppRequest
                (req as AppRequest).userProfile = profile
                done(null, profile)
            }
        } catch (error) {
            done(error)
        }
    }
))
