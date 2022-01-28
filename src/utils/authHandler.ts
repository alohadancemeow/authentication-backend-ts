import { User, UserModel } from "../entities/User"
import { AppRequest } from '../types'

export const isAuthenticated = async (req: AppRequest): Promise<User | null> => {

    // check for user
    if (!req.userId) throw new Error('Please log in to proceed.')

    // query user from the database
    const user = await UserModel.findById(req.userId)
    if (!user) throw new Error('Not authenticated.')

    // check if token version is valid
    if (req.tokenVersion !== user.tokenVersion) throw new Error('Not authenticated.')

    return user
}