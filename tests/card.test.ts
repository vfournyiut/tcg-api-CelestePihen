import {describe, expect, it} from 'vitest'
import request from 'supertest'
import {prismaMock} from "./vitest.setup";
import {app} from "../src";
import {PokemonType} from "../src/generated/prisma/enums";

describe('GET /cards', () => {
    it('should return all the cards', async () => {
        const mockCards = [
            {
                id: 1,
                name: 'Bulbasaur',
                hp: 40,
                attack: 40,
                type: PokemonType.Grass,
                pokedexNumber: 1,
                imgUrl: 'https://example.com/bulbasaur.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            },
            {
                id: 2,
                name: 'Ivysaur',
                hp: 60,
                attack: 60,
                type: PokemonType.Grass,
                pokedexNumber: 2,
                imgUrl: 'https://example.com/ivysaur.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            }
        ]

        prismaMock.card.findMany.mockResolvedValue(mockCards)

        const response = await request(app)
            .get('/api/cards')

        expect(response.status).toBe(200)
        expect(response.body.cards).toHaveLength(2)
        expect(response.body.cards[0]).toHaveProperty('name', 'Bulbasaur')
        expect(response.body.cards[0]).toHaveProperty('pokedexNumber', 1)
    })

    it('should return 500 for internal server error', async () => {
        prismaMock.card.findMany.mockRejectedValue(new Error("Internal Server Error"))

        const response = await request(app)
            .get('/api/cards')

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error')
    });
})