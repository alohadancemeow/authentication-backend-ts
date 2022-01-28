import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { UserModel } from './entities/User'

import { AuthResolvers } from './resolvers/AuthResolvers'
import { AppContext } from './types'
import { createToken, sendToken, verifyToken } from './utils/tokenHandler'

export default async () => {
  const schema = await buildSchema({
    resolvers: [AuthResolvers],
    emitSchemaFile: { path: './src/schema.graphql' },
    validate: false,
  })

  return new ApolloServer({
    schema,
    context: async ({ req, res }: AppContext) => {

      const token = req.cookies[process.env.COOKIE_NAME!]
      // console.log('token', token);

      if (token) {
        try {

          // verify token
          const decodedToken = verifyToken(token) as {
            userId: string
            tokenVersion: number
            iat: number
            exp: number
          } | null

          console.log('decoded token', decodedToken);

          if (decodedToken) {
            req.userId = decodedToken.userId
            req.tokenVersion = decodedToken.tokenVersion

            // extend token expiration,
            // if the user has not logged in for more than 6 hours,
            // from the last login.
            if (Date.now() / 1000 - decodedToken.iat > 6 * 60 * 60) {

              // find user in database
              const user = await UserModel.findById(req.userId)

              if (user) {

                // check for token version
                if (user.tokenVersion === req.tokenVersion) {
                  user.tokenVersion = user.tokenVersion + 1

                  // save new token version in user
                  const updatedUser = await user.save()

                  if (updatedUser) {

                    // create new token
                    const token = createToken(
                      updatedUser.id,
                      updatedUser.tokenVersion
                    )

                    // update token version in request
                    req.tokenVersion = updatedUser.tokenVersion

                    // send token to the frontend
                    sendToken(res, token)
                  }
                }
              }
            }
          }

        } catch (error) {
          req.userId = undefined
          req.tokenVersion = undefined
        }
      }

      return { req, res }
    },
  })
}