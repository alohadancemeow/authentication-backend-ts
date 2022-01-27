import { Resolver, Query, Mutation, Arg, Ctx, ObjectType, Field } from 'type-graphql'
import bcrypt from 'bcryptjs'

import { User, UserModel } from '../entities/User'
import { validateUsername, validateEmail, validatePassword } from '../utils/validate'
import { createToken, sendToken } from '../utils/tokenHandler'
import { AppContext } from '../types'
import { isAuthenticated } from '../utils/authHandler'

@ObjectType()
export class ResponseMessage {
  @Field()
  message: string
}


@Resolver()
export class AuthResolvers {

  // # TODO: users
  @Query(() => [User], { nullable: true })
  async users(): Promise<User[] | null> {
    try {
      return UserModel.find()
    } catch (error) {
      throw error
    }
  }

  // # TODO: user (me)
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: AppContext): Promise<User | null> {
    try {

      if (!req.userId) throw new Error('Please log in to proceed.')

      // check if user authenticated
      const user = await isAuthenticated(req.userId, req.tokenVersion)
      return user

    } catch (error) {
      throw error
    }
  }

  // # TODO: Signup
  @Mutation(() => User, { nullable: true })
  async signup(
    @Arg('username') username: string,
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { res }: AppContext
  ): Promise<User | null> {
    try {
      // check for username, email , password
      if (!username) throw new Error('Username is required.')
      if (!email) throw new Error('Email is required.')
      if (!password) throw new Error('Password is required.')

      const user = await UserModel.findOne({ email })
      if (user) throw new Error('Email already in use, please signin.')

      // validate username, email, password
      const isUsernameValid = validateUsername(username)
      if (!isUsernameValid)
        throw new Error('Username must be between 3 - 60 characters.')

      const isEmailValid = validateEmail(email)
      if (!isEmailValid) throw new Error('Email is invalid.')

      const isPasswordValid = validatePassword(password)
      if (!isPasswordValid)
        throw new Error('Password must be between 6 - 50 characters.')

      const hashedPassword = await bcrypt.hash(password, 10)

      // create user
      const newUser = await UserModel.create({
        username,
        email,
        password: hashedPassword,
      })

      await newUser.save()

      // Create token
      const token = createToken(newUser.id, newUser.tokenVersion)

      // Send token to the frontend
      sendToken(res, token)

      return newUser
    } catch (error) {
      throw error
    }
  }

  // # TODO: Sign in
  @Mutation(() => User, { nullable: true })
  async signin(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { res }: AppContext
  ): Promise<User | null> {
    try {
      // check for email , password
      if (!email) throw new Error('Email is required.')
      if (!password) throw new Error('Password is required.')

      const user = await UserModel.findOne({ email })
      if (!user) throw new Error('Email not found.')

      // check if password is valid
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) throw new Error('Email or Password invalid.')

      // Create token
      const token = createToken(user.id, user.tokenVersion)

      // Send token to the frontend
      sendToken(res, token)

      return user

    } catch (error) {
      throw error
    }
  }

  // # TODO: Signout
  @Mutation(() => ResponseMessage, { nullable: true })
  async signout(@Ctx() { req, res }: AppContext): Promise<ResponseMessage | null> {
    try {

      const user = await UserModel.findById(req.userId)
      if (!user) return null

      // Bump up token version
      user.tokenVersion = user.tokenVersion + 1
      await user.save()

      // clear cookie in browser
      res.clearCookie(process.env.COOKIE_NAME!)

      return { message: 'See you later.' }

    } catch (error) {
      throw error
    }
  }

}
