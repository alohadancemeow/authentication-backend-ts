import { UserModel } from "../entities/User"

export const isAuthenticated = async (userId: string, tokenVersion?: number) => {

    // query user from the database
    const user = await UserModel.findById(userId)
    if (!user) throw new Error('Not authenticated.')

    // check if token version is valid
    if (tokenVersion !== user.tokenVersion) throw new Error('Not authenticated.')

    return user
}