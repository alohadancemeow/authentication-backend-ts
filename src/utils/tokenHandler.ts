import { Response } from "express";
import Jwt from "jsonwebtoken";

// HANDLE: create token
export const createToken = (userId: string, tokenVersion: number) => {
    return Jwt.sign({ userId, tokenVersion }, process.env.COOKIE_SECRET!, { expiresIn: '15d' })
}

// HANDLE: send token
export const sendToken = (res: Response, token: string) => {
    return res.cookie(process.env.COOKIE_NAME!, token, { httpOnly: true, sameSite: 'none', secure: true })
}

// HANDLE: verify token
export const verifyToken = (token: string) => {
    return Jwt.verify(token, process.env.COOKIE_SECRET!)
}
