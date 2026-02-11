import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authenticateToken } from '../src/middleware/auth.middleware'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

// Le middleware étant mocké globalement dans vitest.setup.ts
// nous devons le démocker pour tester sa vraie implémentation ici
vi.unmock('../src/middleware/auth.middleware')

vi.mock('jsonwebtoken')

describe('Auth Middleware', () => {
    let req: Request
    let res: Response
    let next: NextFunction

    beforeEach(() => {
        req = {
            headers: {},
        } as unknown as Request

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as Response

        next = vi.fn()

        process.env.JWT_SECRET = 'jwt-secret'
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return 401 if no token is provided', () => {
        authenticateToken(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Token manquant' })
        expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 if token is malformed (no Bearer)', () => {
        req.headers = { authorization: 'tokenMalformed' }

        authenticateToken(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Token manquant' })
        expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 if token is invalid', () => {
        req.headers = { authorization: 'Bearer invalid-token' }

        vi.mocked(jwt.verify).mockImplementation(() => {
            throw new Error('Invalid signature')
        })

        authenticateToken(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Token invalide ou expiré' })
        expect(next).not.toHaveBeenCalled()
    })

    it('should call next() and set req.userId if token is valid', () => {
        req.headers = { authorization: 'Bearer valid-token' }
        const mockDecoded = { userId: 1, email: 'charlie@example.com' }

        vi.mocked(jwt.verify).mockImplementation(() => mockDecoded)

        authenticateToken(req, res, next)

        expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'jwt-secret')

        expect(req.userId).toBe(1)

        expect(next).toHaveBeenCalled()

        expect(res.status).not.toHaveBeenCalled()
    })
})
