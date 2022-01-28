import { Resolver, Query, Mutation, Arg, Ctx, ObjectType, Field } from 'type-graphql'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import sgMail, { MailDataRequired } from '@sendgrid/mail'

import { User, UserModel } from '../entities/User'
import { validateUsername, validateEmail, validatePassword } from '../utils/validate'
import { createToken, sendToken } from '../utils/tokenHandler'
import { AppContext, RoleOptions } from '../types'
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

      // check if user authenticated
      const user = await isAuthenticated(req)
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

      // create user (pick from user class)
      const newUser = await UserModel.create<Pick<User, 'username' | 'email' | 'password'>>({
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
      console.log(token);


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
      res.clearCookie(process.env.COOKIE_NAME!, { httpOnly: true, sameSite: 'none', secure: true })

      return { message: 'See you later.' }

    } catch (error) {
      throw error
    }
  }

  // # TODO: requestResetPassword
  @Mutation(() => ResponseMessage, { nullable: true })
  async requestResetPassword(@Arg('email') email: string): Promise<ResponseMessage | null> {
    try {

      //  check for email
      if (!email) throw new Error("Email is required.");

      const user = await UserModel.findOne({ email })
      if (!user) throw new Error("Email not found.");

      // create reset password token
      const resetPasswordToken = randomBytes(16).toString('hex')
      const resetPasswordTokenExpiry = Date.now() + 1000 * 60 * 30  // 30 minutes

      // update user in database
      const updatedUser = await UserModel.findOneAndUpdate(
        { email },
        { resetPasswordToken, resetPasswordTokenExpiry },
        { new: true }
      )

      if (!updatedUser) throw new Error("Sorry, cannot proceed.");

      // send link to user's mail with token
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
      const message: MailDataRequired = {
        to: email,
        from: process.env.MY_EMAIL!, // Use the email address or domain you verified above
        subject: 'Reset password',
        text: 'and easy to do anywhere, even with Node.js',
        html: `<div>
          <p>Please click below link to reset your password.</p>
          <a href='http://localhost:5000/resetToken=${resetPasswordToken}' target="blank">
          Click to reset password
          </a>
        </div>`,
      }

      const response = await sgMail.send(message)
      if (!response || response[0]?.statusCode !== 202) throw new Error("Sorry, cannot proceed.");

      return { message: 'Please check your email to reset password.' }

    } catch (error) {
      throw error
    }
  }

  // # TODO: resetPassword
  @Mutation(() => ResponseMessage, { nullable: true })
  async resetPassword(
    @Arg('password') password: string,
    @Arg('token') token: string
  ): Promise<ResponseMessage | null> {
    try {

      //  check for password, token
      if (!password) throw new Error("Password is required.");
      if (!token) throw new Error("Sorry, cannot proceed.");

      // check for user
      const user = await UserModel.findOne({ resetPasswordToken: token })
      if (!user) throw new Error("Sorry, cannot proceed.");
      if (!user.resetPasswordTokenExpiry) throw new Error("Sorry, cannot proceed.");

      // check if token is valid <= 30 minutes
      const isTokenValid = Date.now() <= user.resetPasswordTokenExpiry
      if (!isTokenValid) throw new Error("Sorry, cannot proceed.");

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // update user in database
      const updatedUser = await UserModel.findOneAndUpdate(
        { email: user.email },
        {
          password: hashedPassword,
          resetPasswordToken: undefined,
          resetPasswordTokenExpiry: undefined,
        },
        { new: true }
      )

      if (!updatedUser) throw new Error("Sorry, cannot proceed.");

      return { message: 'Sucessfully reset password.' }

    } catch (error) {
      throw error
    }
  }

  // # TODO: updateRoles
  @Mutation(() => User, { nullable: true })
  async updateRoles(
    @Arg('newRoles', () => [String]) newRoles: RoleOptions[],
    @Arg('userId') userId: string,
    @Ctx() { req }: AppContext
  ): Promise<User | null> {

    try {

      // check if user is admin
      const admin = await isAuthenticated(req)

      // check if user is supper admin
      const isSupperAdmin = admin && admin.roles.includes(RoleOptions.supperAdmin)
      if (!isSupperAdmin) throw new Error("Not authorized.");

      // query user (to be updated) from the database
      const user = await UserModel.findById(userId)
      if (!user) throw new Error("User not found.");

      // update roles
      user.roles = newRoles
      await user.save()

      return user

    } catch (error) {
      throw error
    }
  }

  // # TODO: deleteUser
  @Mutation(() => ResponseMessage, { nullable: true })
  async deleteUser(
    @Arg('userId') userId: string,
    @Ctx() { req }: AppContext
  ): Promise<ResponseMessage | null> {

    try {

      // check if user is admin
      const admin = await isAuthenticated(req)

      // check if user is supper admin
      const isSupperAdmin = admin && admin.roles.includes(RoleOptions.supperAdmin)
      if (!isSupperAdmin) throw new Error("Not authorized.");

      // query user (to be updated) from the database
      const user = await UserModel.findByIdAndDelete(userId)
      if (!user) throw new Error("Sorry, cannot proceed.");

      return { message: `User id: ${userId} has deleted.` }

    } catch (error) {
      throw error
    }
  }

}
