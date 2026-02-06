import { DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended'
import { beforeEach, vi } from 'vitest'
import { PrismaClient } from '../src/generated/prisma/client'
import { prisma } from '../src/database'

vi.mock('../src/database', () => ({
  prisma: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
