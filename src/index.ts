import express from "express"
import mongoose from "mongoose"
import { config } from 'dotenv'
import cookieParser from 'cookie-parser'

config()

// Use Apollo server
import createServer from './createServer'

// From .env file
const { PORT, DB_USER, DB_PASSWORD, DB_ENDPOINT, DB_NAME } = process.env

const startServer = async () => {

    try {
        // Connect to mongoDB
        await mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_ENDPOINT}/${DB_NAME}?retryWrites=true&w=majority`,
            {
                useCreateIndex: true,
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false
            },
            () => console.log(`Connected to MongoDB`)
        )

        const app = express()
        app.use(cookieParser())
        const server = await createServer()

        server.applyMiddleware({ app })
        app.listen({ port: PORT }, () =>
            console.log(`Server is starting at http://localhost:${PORT}${server.graphqlPath}`)
        )

    } catch (error) {
        console.log(error);

    }
}

startServer()