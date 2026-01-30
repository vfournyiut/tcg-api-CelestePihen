import {Response, Router} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {prisma} from '../database'
import {SignInRequest, SignUpRequest} from "../types/auth.type"

export const authRouter = Router()

// POST /auth/sign-up
// Accessible via POST /auth/sign-up
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

// POST /auth/sign-in
// Accessible via POST /auth/sign-in
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