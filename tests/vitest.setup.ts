import {mockDeep, mockReset, DeepMockProxy} from 'vitest-mock-extended';
import {vi, beforeEach} from 'vitest';
import {PrismaClient} from '../src/generated/prisma/client';
import {prisma} from '../src/database';

vi.mock('../src/database', () => ({
    prisma: mockDeep<PrismaClient>()
}));

// Mock du middleware d'authentification
export const authenticateTokenMock = vi.fn((req, _res, next) => {
    req.userId = 1
    next()
})

vi.mock('../src/middleware/auth.middleware', () => ({
    authenticateToken: authenticateTokenMock,
}))

beforeEach(() => {
    mockReset(prismaMock);

    authenticateTokenMock.mockImplementation((req, _res, next) => {
        req.userId = 1
        next()
    })
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
