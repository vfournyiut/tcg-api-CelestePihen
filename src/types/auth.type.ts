import { Request } from 'express'

export type SignUpRequestBody = {
  email: string
  password: string
  username: string
}

export type SignInRequestBody = {
  email: string
  password: string
}

export interface SignUpRequest extends Request<
  unknown,
  unknown,
  SignUpRequestBody
> {}

export interface SignInRequest extends Request<
  unknown,
  unknown,
  SignInRequestBody
> {}
