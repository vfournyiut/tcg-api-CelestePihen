import {describe, expect, it} from 'vitest'
import request from 'supertest'
import {prismaMock} from "./vitest.setup";
import {app} from "../src";
import bcrypt from "bcryptjs";

describe('POST /auth/sign-up', () => {
    it('should create and return a user and his token', async () => {
        const newUser = {
            id: 0,
            username: 'Charlie',
            email: 'charlie@example.com',
            password: 'hashedpassword',
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        }

        // Mock findFirst pour vérifier que l'utilisateur n'existe pas
        prismaMock.user.findFirst.mockResolvedValue(null)

        // Mock create pour créer l'utilisateur
        prismaMock.user.create.mockResolvedValue(newUser)

        const response = await request(app)
            .post('/api/auth/sign-up')
            .send({id: 0, username: 'Charlie', email: 'charlie@example.com', password: 'password123'})

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('message', 'Utilisateur créé')
        expect(response.body.userCreated).toHaveProperty('username', 'Charlie')
    })

    it('should return 409 for existing email or username', async () => {
        const existingUser = {
            id: 1,
            username: 'ExistingUser',
            email: 'existing@example.com',
            password: 'hashedpassword',
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        }

        prismaMock.user.findFirst.mockResolvedValue(existingUser)

        const response = await request(app)
            .post('/api/auth/sign-up')
            .send({username: 'Charlie', email: 'charlie@example.com', password: 'password123'})

        expect(response.status).toBe(409)
        expect(response.body).toHaveProperty('error', 'Email ou username invalide')
    })

    it('should return 400 for invalid data', async () => {
        const response = await request(app)
            .post('/api/auth/sign-up')
            .send({username: '', email: '', password: ''})

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'Données invalides')
    })

    it('should return 500 for internal server error', async () => {
        prismaMock.user.findFirst.mockRejectedValue(new Error("Internal Server Error"))

        const response = await request(app)
            .post('/api/auth/sign-up')
            .send({username: 'Charlie', email: 'charlie@example.com', password: 'password123'})

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error')
    })
})

describe('POST /auth/sign-in', () => {
    it('should return the user', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10)

        const existingUser = {
            id: 0,
            username: 'Charlie',
            email: 'charlie@example.com',
            password: hashedPassword,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        }

        prismaMock.user.findUnique.mockResolvedValue(existingUser)

        const response = await request(app)
            .post('/api/auth/sign-in')
            .send({email: 'charlie@example.con', password: 'password123'})

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Connexion réussie')
    });

    it('should return 400 for invalid data', async () => {
        const response = await request(app)
            .post('/api/auth/sign-in')
            .send({email: '', password: ''})

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'Données invalides')
    });

    it('should return 401 for incorrect mail', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null)

        const response = await request(app)
            .post('/api/auth/sign-in')
            .send({email: 'incorrect@example.com', password: 'password123'})

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', 'Email ou mot de passe incorrect')
    });

    it('should return 401 for incorrect password', async () => {
        const existingUser = {
            id: 0,
            username: 'Charlie',
            email: 'charlie@example.com',
            password: 'password132',
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        }

        prismaMock.user.findUnique.mockResolvedValue(existingUser)

        const response = await request(app)
            .post('/api/auth/sign-in')
            .send({email: 'charlie@example.con', password: 'password123'})

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error', 'Email ou mot de passe incorrect')
    });

    it('should return 500 for internal server error', async () => {
        prismaMock.user.findUnique.mockRejectedValue(new Error("Internal Server Error"))

        const response = await request(app)
            .post('/api/auth/sign-in')
            .send({email: 'charlie@example.com', password: 'password123'})

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error')
    });
})