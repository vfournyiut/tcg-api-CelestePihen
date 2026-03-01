/**
 * @file Middleware d'authentification JWT
 * @description Fournit le middleware pour valider les tokens JWT et protéger les routes
 */

import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

/**
 * Middleware d'authentification par token JWT
 * Vérifie la présence et la validité du token JWT dans l'en-tête Authorization
 *
 * @param {Request} req - Objet de requête Express
 * @param {Response} res - Objet de réponse Express
 * @param {NextFunction} next - Fonction pour passer au middleware suivant
 * @returns {void}
 *
 * @throws {401} Token manquant - Si l'en-tête Authorization n'est pas présent
 * @throws {401} Token invalide ou expiré - Si le token ne peut pas être vérifié
 *
 * @description
 * - Récupère le token depuis l'en-tête Authorization (format: "Bearer TOKEN")
 * - Vérifie et décode le token avec la clé secrète JWT
 * - Ajoute l'userId à la requête pour utilisation dans les routes protégées
 * - Passe au middleware/route suivant si le token est valide
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. Récupérer le token depuis l'en-tête Authorization
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  try {
    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number
      email: string
    }

    // 3. Ajouter userId à la requête pour l'utiliser dans les routes
    req.userId = decoded.userId

    // 4. Passer au prochain middleware ou à la route
    return next()
  } catch (_error) {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
