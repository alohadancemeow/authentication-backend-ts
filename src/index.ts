import express from "express"
import mongoose from "mongoose"
import { config } from 'dotenv'
import cookieParser from 'cookie-parser'
import { CorsOptions } from 'cors'

config()

// Use Apollo server
import createServer from './createServer'

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
            {
                // useCreateIndex: true,
                // useNewUrlParser: true,
                // useUnifiedTopology: true,
                // useFindAndModify: false

                autoIndex: true,

            },
            () => console.log(`Connected to MongoDB`)
        )

        const app = express()
        app.set('trust proxy', true)
        app.use(cookieParser())
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