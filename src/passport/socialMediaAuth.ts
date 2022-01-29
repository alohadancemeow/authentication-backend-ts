import { User, UserModel } from "../entities/User"
import { AppRequest } from "../types"
import { Response } from 'express'
import { createToken, sendToken } from "../utils/tokenHandler"

// TODO: Facebook authentication
export const FacebookAuthenticate = async (req: AppRequest, res: Response) => {

    if (!req.userProfile) return

    const { id, emails, displayName, provider } = req.userProfile

    try {

        let token

        // query user from database by facebookId
        const user = await UserModel.findOne({ facebookId: id })

        // NOTE: 
        // new user --> create user & token,
        // old user --> create new token
        if (!user) {

            // create new user
            const newUser = await UserModel.create<Pick<User, 'username' | 'email' | 'facebookId' | 'password'>>({
                username: displayName,
                email: emails && emails[0].value || provider,
                facebookId: id,
                password: provider
            })

            await newUser.save()

            // create token, send to frontend
            token = createToken(newUser.id, newUser.tokenVersion)
            sendToken(res, token)

            // redirect --> homepage (frontend)
            res.redirect('http://localhost:3000/home')
        } else {
            token = createToken(user.id, user.tokenVersion)
            sendToken(res, token)
            res.redirect('http://localhost:3000/home')
        }
    } catch (error) {
        // redirect --> error page
        res.redirect('http://localhost:3000')
    }
}

// TODO: Google authentication
export const GoogleAuthenticate = async (req: AppRequest, res: Response) => {

    if (!req.userProfile) return

    const { id, emails, displayName, provider } = req.userProfile

    try {

        let token

        // query user from database by googelId
        const user = await UserModel.findOne({ googleId: id })

        // NOTE: 
        // new user --> create user & token,
        // old user --> create new token
        if (!user) {

            // create new user
            const newUser = await UserModel.create<Pick<User, 'username' | 'email' | 'googleId' | 'password'>>({
                username: displayName,
                email: emails && emails[0].value || provider,
                googleId: id,
                password: provider
            })

            await newUser.save()

            // create token, send to frontend
            token = createToken(newUser.id, newUser.tokenVersion)
            sendToken(res, token)

            // redirect --> homepage (frontend)
            res.redirect('http://localhost:3000/home')
        } else {
            token = createToken(user.id, user.tokenVersion)
            sendToken(res, token)
            res.redirect('http://localhost:3000/home')
        }
    } catch (error) {
        // redirect --> error page
        res.redirect('http://localhost:3000')
    }
}