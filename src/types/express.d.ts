/**
 * @file Déclarations TypeScript pour l'extension d'Express
 * @description Étend l'interface Request d'Express pour ajouter des propriétés personnalisées
 */

import 'express';

declare module 'express' {
    /**
     * Extension de l'interface Request d'Express
     * @interface Request
     * @property {Object} [user] - Informations de l'utilisateur authentifié
     * @property {number} user.userId - ID de l'utilisateur
     * @property {string} user.email - Email de l'utilisateur
     */
    interface Request {
        userId?: number;
        user?: {
            userId: number;
            email: string;
        };
    }
}
