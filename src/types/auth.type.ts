/**
 * @file Types TypeScript pour l'authentification
 * @description Définit les types des requêtes d'inscription et de connexion
 */

import { Request } from 'express'

/**
 * Type du corps de la requête d'inscription
 * @typedef {Object} SignUpRequestBody
 * @property {string} email - Email de l'utilisateur
 * @property {string} password - Mot de passe en clair
 * @property {string} username - Nom d'utilisateur
 */
export type SignUpRequestBody = {
    email: string;
    password: string;
    username: string;
};

/**
 * Type du corps de la requête de connexion
 * @typedef {Object} SignInRequestBody
 * @property {string} email - Email de l'utilisateur
 * @property {string} password - Mot de passe en clair
 */
export type SignInRequestBody = {
    email: string;
    password: string;
};

/**
 * Interface de requête Express pour l'inscription
 * @interface SignUpRequest
 * @extends {Request}
 * @property {SignUpRequestBody} body - Corps de la requête contenant les données d'inscription
 */
export interface SignUpRequest extends Request<{}, unknown, SignUpRequestBody> {
}

/**
 * Interface de requête Express pour la connexion
 * @interface SignInRequest
 * @extends {Request}
 * @property {SignInRequestBody} body - Corps de la requête contenant les identifiants
 */
export interface SignInRequest extends Request<{}, unknown, SignInRequestBody> {
}