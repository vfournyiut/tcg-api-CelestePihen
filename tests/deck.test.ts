import {describe, expect, it} from 'vitest'
import request from 'supertest'
import {prismaMock} from "./vitest.setup";
import {app} from "../src";
import {PokemonType} from "../src/generated/prisma/enums";

describe('POST /decks', () => {
    it('should create a deck', async () => {
        const foundCards = [
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
            },
            {
                id: 3,
                name: 'Venusaur',
                hp: 80,
                attack: 82,
                type: PokemonType.Grass,
                pokedexNumber: 3,
                imgUrl: 'https://example.com/venusaur.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            },
            {
                id: 4,
                name: 'Charmander',
                hp: 39,
                attack: 52,
                type: PokemonType.Fire,
                pokedexNumber: 4,
                imgUrl: 'https://example.com/charmander.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            },
            {
                id: 5,
                name: 'Charmeleon',
                hp: 58,
                attack: 64,
                type: PokemonType.Fire,
                pokedexNumber: 5,
                imgUrl: 'https://example.com/charmeleon.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            },
            {
                id: 6,
                name: 'Charizard',
                hp: 78,
                attack: 84,
                type: PokemonType.Fire,
                pokedexNumber: 6,
                imgUrl: 'https://example.com/charizard.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            },
            {
                id: 7,
                name: 'Squirtle',
                hp: 44,
                attack: 48,
                type: PokemonType.Water,
                pokedexNumber: 7,
                imgUrl: 'https://example.com/squirtle.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            },
            {
                id: 8,
                name: 'Wartortle',
                hp: 59,
                attack: 63,
                type: PokemonType.Water,
                pokedexNumber: 8,
                imgUrl: 'https://example.com/wartortle.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            },
            {
                id: 9,
                name: 'Blastoise',
                hp: 79,
                attack: 83,
                type: PokemonType.Water,
                pokedexNumber: 9,
                imgUrl: 'https://example.com/blastoise.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            },
            {
                id: 10,
                name: 'Pikachu',
                hp: 35,
                attack: 55,
                type: PokemonType.Electric,
                pokedexNumber: 25,
                imgUrl: 'https://example.com/pikachu.png',
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
            }
        ]

        prismaMock.card.findMany.mockResolvedValue(foundCards)

        const newDeck = {
            id: 0,
            name: "Starter Deck",
            userId: 1,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        }

        prismaMock.deck.create.mockResolvedValue(newDeck)

        const response = await request(app)
            .post('/api/decks')
            .send({
                name: "Starter Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('message', 'Deck créé avec succès')
    });
})