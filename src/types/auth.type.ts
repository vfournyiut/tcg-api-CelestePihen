import { Request } from 'express'

export type SignUpRequestBody = {
    email: string;
    password: string;
    username: string;
};

export type SignInRequestBody = {
    email: string;
    password: string;
};

export interface SignUpRequest extends Request<{}, any, SignUpRequestBody> {
}

export interface SignInRequest extends Request<{}, any, SignInRequestBody> {
}