/**
 * @file Configuration de la base de données Prisma
 * @description Initialise et exporte le client Prisma avec l'adaptateur PostgreSQL
 */

import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "./env";
import { PrismaClient } from "./generated/prisma/client";

/**
 * Adaptateur PostgreSQL pour Prisma
 * @const {PrismaPg}
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

/**
 * Instance du client Prisma configurée avec l'adaptateur PostgreSQL
 * @const {PrismaClient}
 * @description Client Prisma partagé pour toutes les opérations de base de données
 */
export const prisma = new PrismaClient({ adapter });
