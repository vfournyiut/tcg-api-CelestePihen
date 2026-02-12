/**
 * @file Configuration des variables d'environnement
 * @description Charge et exporte les variables d'environnement de l'application
 */

import dotenv from "dotenv";

dotenv.config();

/**
 * Variables d'environnement de l'application
 * @const {Object} env
 * @property {number|string} PORT - Port d'écoute du serveur (par défaut: 3001)
 * @property {string} JWT_SECRET - Secret pour la signature des tokens JWT
 * @property {string} DATABASE_URL - URL de connexion à la base de données
 * @property {string} NODE_ENV - Environnement d'exécution (development, production, test)
 */
export const env = {
    PORT: process.env.PORT || 3001,
    JWT_SECRET: (process.env.JWT_SECRET || "default-secret") as string,
    DATABASE_URL: (process.env.DATABASE_URL || "file:./dev.db") as string,
    NODE_ENV: (process.env.NODE_ENV || "development") as string,
};
