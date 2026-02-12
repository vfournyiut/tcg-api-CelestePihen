/**
 * @file Routes d'authentification
 * @description Gère l'inscription et la connexion des utilisateurs
 */

import {Response, Router} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {prisma} from '../database'
import {SignInRequest, SignUpRequest} from "../types/auth.type"

/**
 * Router Express pour les routes d'authentification
 * @const {Router}
 */
export const authRouter = Router()

/**
 * Route d'inscription d'un nouvel utilisateur
 *
 * @route POST /auth/sign-up
 * @param {SignUpRequest} req - Requête contenant les données d'inscription
 * @param {string} req.body.email - Email de l'utilisateur
 * @param {string} req.body.username - Nom d'utilisateur
 * @param {string} req.body.password - Mot de passe en clair
 * @param {Response} res - Objet de réponse Express
 * @returns {Object} 201 - Utilisateur créé avec succès
 * @returns {string} 201.message - Message de confirmation
 * @returns {string} 201.token - Token JWT pour l'authentification
 * @returns {Object} 201.userCreated - Données de l'utilisateur créé
 * @returns {number} 201.userCreated.id - ID de l'utilisateur
 * @returns {string} 201.userCreated.username - Nom d'utilisateur
 * @returns {string} 201.userCreated.email - Email de l'utilisateur
 *
 * @throws {400} Données invalides - Si email, username ou password est manquant
 * @throws {409} Email ou username invalide - Si l'email ou le username existe déjà
 * @throws {500} Erreur serveur - En cas d'erreur lors de la création
 *
 * @description
 * - Vérifie que tous les champs requis sont présents
 * - Vérifie l'unicité de l'email et du username
 * - Hash le mot de passe avec bcrypt
 * - Crée l'utilisateur en base de données
 * - Génère un token JWT valide 7 jours
 */
authRouter.post('/sign-up', async (req: SignUpRequest, res: Response) => {
    const {email, password, username} = req.body

    try {
        if (!email || !username || !password) {
            return res.status(400).json({error: 'Données invalides'})
        }

        // Vérifier si le mail ou l'username est déjà utilisé
        const user = await prisma.user.findFirst({
            where: {OR: [{email}, {username}]},
        })

        if (user) {
            return res.status(409).json({error: 'Email ou username invalide'})
        }

        // Générer le mot de passe hashé
        const hashedPassword = await bcrypt.hash(password, 10)

        const userCreated = await prisma.user.create({
            data: {username, email, password: hashedPassword},
            select: {
                id: true,
                username: true,
                email: true,
            },
        })

        const token = jwt.sign(
            {
                userId: userCreated.id,
                email: userCreated.email,
            },
            process.env.JWT_SECRET as string,
            {expiresIn: '7d'}, // Le token expire dans 7 jours
        )

        return res.status(201).json({
            message: 'Utilisateur créé',
            token,
            userCreated,
        })
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
});

/**
 * Route de connexion d'un utilisateur
 *
 * @route POST /auth/sign-in
 * @param {SignInRequest} req - Requête contenant les identifiants
 * @param {string} req.body.email - Email de l'utilisateur
 * @param {string} req.body.password - Mot de passe en clair
 * @param {Response} res - Objet de réponse Express
 * @returns {Object} 200 - Connexion réussie
 * @returns {string} 200.message - Message de confirmation
 * @returns {string} 200.token - Token JWT pour l'authentification
 * @returns {Object} 200.user - Données de l'utilisateur connecté
 * @returns {number} 200.user.id - ID de l'utilisateur
 * @returns {string} 200.user.name - Nom d'utilisateur
 * @returns {string} 200.user.email - Email de l'utilisateur
 *
 * @throws {400} Données invalides - Si email ou password est manquant
 * @throws {401} Email ou mot de passe incorrect - Si les identifiants ne correspondent pas
 * @throws {500} Erreur serveur - En cas d'erreur lors de la connexion
 *
 * @description
 * - Vérifie que l'email et le mot de passe sont fournis
 * - Recherche l'utilisateur par email
 * - Compare le mot de passe avec le hash stocké
 * - Génère un token JWT valide 1 heure
 */
authRouter.post('/sign-in', async (req: SignInRequest, res: Response) => {
    const {email, password} = req.body

    try {
        if (!email || !password) {
            return res.status(400).json({error: 'Données invalides'})
        }

        // Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: {email},
        })

        if (!user) {
            return res.status(401).json({error: 'Email ou mot de passe incorrect'})
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({error: 'Email ou mot de passe incorrect'})
        }

        // Générer le JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET as string,
            {expiresIn: '1h'}, // Le token expire dans 1 heure
        )

        // Retourner le token
        return res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                name: user.username,
                email: user.email,
            },
        })
    } catch (error) {
        console.error('Erreur lors de la connexion:', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
})