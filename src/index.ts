import express from "express"
import mongoose from "mongoose"
import { config } from 'dotenv'
import cookieParser from 'cookie-parser'
import { CorsOptions } from 'cors'

import passport from 'passport'
import { passportFacebook, passportGoogle } from "./passport"
import { FacebookAuthenticate, GoogleAuthenticate } from "./passport/socialMediaAuth"

// Use Apollo server
import createServer from './createServer'

config()

// call passports
passportFacebook()
passportGoogle()

// set cors options
const corsOptions: CorsOptions = {
    credentials: true,
    origin: 'https://studio.apollographql.com'
}

// From .env file
const { PORT, DB_USER, DB_PASSWORD, DB_ENDPOINT, DB_NAME } = process.env

const startServer = async () => {

    try {
        // Connect to mongoDB
        mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_ENDPOINT}/${DB_NAME}?retryWrites=true&w=majority`,
            { autoIndex: true },
            () => console.log(`Connected to MongoDB`)
        )

        // set app
        const app = express()
        app.set('trust proxy', true)
        app.use(cookieParser())

        // facebook login route 
        app.get('/auth/facebook', passport.authenticate('facebook'))

        // facebook callback route,
        // if in production, put this in Valid OAuth Redirect URIs (facebook app)
        app.get('/auth/facebook/callback', passport.authenticate('facebook',
            {
                session: false,
                failureRedirect: 'http://localhost:3000',
                scope: ['profile', 'email']
            }),
            FacebookAuthenticate // facebook callback
        )

        // google login route 
        app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))

        // google callback route
        app.get('/auth/google/callback', passport.authenticate('google',
            {
                session: false,
                failureRedirect: 'http://localhost:3000'
            }),
            GoogleAuthenticate // google callback
        )

        // start server (apollo)
        const server = await createServer()
        await server.start()
        server.applyMiddleware({ app, cors: corsOptions })

        app.listen({ port: PORT }, () =>
            console.log(`Server is starting at http://localhost:${PORT}${server.graphqlPath}`)
        )

    } catch (error) {
        console.log(error);

    }
}

startServer()