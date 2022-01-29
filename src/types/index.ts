import { Request, Response } from "express";
import { Profile as FacebookProfile } from 'passport-facebook'
import { Profile as GoogleProfile } from 'passport-google-oauth20'

export enum RoleOptions {
    client = 'CLIENT',
    itemEditor = 'ITEMEDITOR',
    admin = 'ADMIN',
    supperAdmin = 'SUPPERADMIN'
}

export interface AppRequest extends Request {
    userId?: string
    tokenVersion?: number
    userProfile?: FacebookProfile | GoogleProfile
}

export interface AppContext {
    req: AppRequest,
    res: Response
}