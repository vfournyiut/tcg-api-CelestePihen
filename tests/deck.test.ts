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

    it('should return 400 for invalid name', async () => {
        const response = await request(app)
            .post('/api/decks')
            .send({
                name: "",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'Nom invalide')
    });

    it('should return 400 for invalid cards length (less than 10)', async () => {
        const response = await request(app)
            .post('/api/decks')
            .send({
                name: "Test Deck",
                cards: [1, 2, 3]
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'Cartes invalides')
    });

    it('should return 400 for invalid cards length (more than 10)', async () => {
        const response = await request(app)
            .post('/api/decks')
            .send({
                name: "Test Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'Cartes invalides')
    });

    it('should return 400 when not all cards exist', async () => {
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
            }
        ]

        prismaMock.card.findMany.mockResolvedValue(foundCards)

        const response = await request(app)
            .post('/api/decks')
            .send({
                name: "Test Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'Cartes invalides')
    });

    it('should return 500 for internal server error', async () => {
        prismaMock.card.findMany.mockRejectedValue(new Error("Internal Server Error"))

        const response = await request(app)
            .post('/api/decks')
            .send({
                name: "Test Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error', 'Erreur serveur')
    });
})

describe('GET /decks/mine', () => {
    it('should return user decks', async () => {
        const userDecks = [
            {
                id: 1,
                name: "Deck 1",
                userId: 1,
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                deckCards: []
            },
            {
                id: 2,
                name: "Deck 2",
                userId: 1,
                createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0),
                deckCards: []
            }
        ]

        prismaMock.deck.findMany.mockResolvedValue(userDecks)

        const response = await request(app)
            .get('/api/decks/mine')

        expect(response.status).toBe(200)
        expect(response.body).toMatchObject([
            {
                id: 1,
                name: "Deck 1",
                userId: 1,
                deckCards: []
            },
            {
                id: 2,
                name: "Deck 2",
                userId: 1,
                deckCards: []
            }
        ])
    });

    it('should return 500 for internal server error', async () => {
        prismaMock.deck.findMany.mockRejectedValue(new Error("Internal Server Error"))

        const response = await request(app)
            .get('/api/decks/mine')

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error', 'Erreur serveur')
    });
})

describe('GET /decks/:id', () => {
    it('should return a deck by id', async () => {
        const deck = {
            id: 1,
            name: "Test Deck",
            userId: 1,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            deckCards: []
        }

        prismaMock.deck.findUnique.mockResolvedValue(deck)

        const response = await request(app)
            .get('/api/decks/1')

        expect(response.status).toBe(200)
        expect(response.body).toMatchObject({
            id: 1,
            name: "Test Deck",
            userId: 1,
            deckCards: []
        })
    });

    it('should return 404 for invalid deck id', async () => {
        const response = await request(app)
            .get('/api/decks/invalid')

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error', 'Deck invalide')
    });

    it('should return 404 when deck does not exist', async () => {
        prismaMock.deck.findUnique.mockResolvedValue(null)

        const response = await request(app)
            .get('/api/decks/999')

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error', 'Deck invalide')
    });

    it('should return 403 when deck does not belong to user', async () => {
        const deck = {
            id: 1,
            name: "Test Deck",
            userId: 2,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            deckCards: []
        }

        prismaMock.deck.findUnique.mockResolvedValue(deck)

        const response = await request(app)
            .get('/api/decks/1')

        expect(response.status).toBe(403)
        expect(response.body).toHaveProperty('error', 'Ce deck n\'appartient pas à l\'utilisateur')
    });

    it('should return 500 for internal server error', async () => {
        prismaMock.deck.findUnique.mockRejectedValue(new Error("Internal Server Error"))

        const response = await request(app)
            .get('/api/decks/1')

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error', 'Erreur serveur')
    });
})

describe('PATCH /decks/:id', () => {
    it('should update a deck', async () => {
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

        const existingDeck = {
            id: 1,
            name: "Old Name",
            userId: 1,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        }

        const updatedDeck = {
            id: 1,
            name: "Updated Deck",
            userId: 1,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 10, 0, 0, 0)
        }

        prismaMock.deck.findUnique.mockResolvedValue(existingDeck)
        prismaMock.card.findMany.mockResolvedValue(foundCards)
        prismaMock.deck.update.mockResolvedValue(updatedDeck)

        const response = await request(app)
            .patch('/api/decks/1')
            .send({
                name: "Updated Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Deck mis à jour avec succès')
    });

    it('should return 404 for invalid deck id', async () => {
        const response = await request(app)
            .patch('/api/decks/invalid')
            .send({
                name: "Updated Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error', 'Deck invalide')
    });

    it('should return 404 for invalid name', async () => {
        const response = await request(app)
            .patch('/api/decks/1')
            .send({
                name: "",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error', 'Deck invalide')
    });

    it('should return 404 when deck does not exist', async () => {
        prismaMock.deck.findUnique.mockResolvedValue(null)

        const response = await request(app)
            .patch('/api/decks/999')
            .send({
                name: "Updated Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error', 'Deck invalide')
    });

    it('should return 403 when deck does not belong to user', async () => {
        const deck = {
            id: 1,
            name: "Test Deck",
            userId: 2,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        }

        prismaMock.deck.findUnique.mockResolvedValue(deck)

        const response = await request(app)
            .patch('/api/decks/1')
            .send({
                name: "Updated Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(403)
        expect(response.body).toHaveProperty('error', 'Ce deck n\'appartient pas à l\'utilisateur')
    });

    it('should return 400 for invalid cards length (less than 10)', async () => {
        const deck = {
            id: 1,
            name: "Test Deck",
            userId: 1,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        }

        prismaMock.deck.findUnique.mockResolvedValue(deck)

        const response = await request(app)
            .patch('/api/decks/1')
            .send({
                name: "Updated Deck",
                cards: [1, 2, 3]
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'Cartes invalides')
    });

    it('should return 400 when not all cards exist', async () => {
        const deck = {
            id: 1,
            name: "Test Deck",
            userId: 1,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        }

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
            }
        ]

        prismaMock.deck.findUnique.mockResolvedValue(deck)
        prismaMock.card.findMany.mockResolvedValue(foundCards)

        const response = await request(app)
            .patch('/api/decks/1')
            .send({
                name: "Updated Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error', 'Cartes invalides')
    });

    it('should return 500 for internal server error', async () => {
        prismaMock.deck.findUnique.mockRejectedValue(new Error("Internal Server Error"))

        const response = await request(app)
            .patch('/api/decks/1')
            .send({
                name: "Updated Deck",
                cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            })

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error', 'Erreur serveur')
    });
})

describe('DELETE /decks/:id', () => {
    it('should delete a deck', async () => {
        const deck = {
            id: 1,
            name: "Test Deck",
            userId: 1,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            deckCards: []
        }

        prismaMock.deck.findUnique.mockResolvedValue(deck)
        prismaMock.deckCard.deleteMany.mockResolvedValue({count: 0})
        prismaMock.deck.delete.mockResolvedValue({
            id: 1,
            name: "Test Deck",
            userId: 1,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0)
        })

        const response = await request(app)
            .delete('/api/decks/1')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('message', 'Deck supprimé avec succès')
    });

    it('should return 404 for invalid deck id', async () => {
        const response = await request(app)
            .delete('/api/decks/invalid')

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error', 'Deck invalide')
    });

    it('should return 404 when deck does not exist', async () => {
        prismaMock.deck.findUnique.mockResolvedValue(null)

        const response = await request(app)
            .delete('/api/decks/999')

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error', 'Deck invalide')
    });

    it('should return 403 when deck does not belong to user', async () => {
        const deck = {
            id: 1,
            name: "Test Deck",
            userId: 2,
            createdAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            updatedAt: new Date(2026, 2, 6, 9, 0, 0, 0),
            deckCards: []
        }

        prismaMock.deck.findUnique.mockResolvedValue(deck)

        const response = await request(app)
            .delete('/api/decks/1')

        expect(response.status).toBe(403)
        expect(response.body).toHaveProperty('error', 'Ce deck n\'appartient pas à l\'utilisateur')
    });

    it('should return 500 for internal server error', async () => {
        prismaMock.deck.findUnique.mockRejectedValue(new Error("Internal Server Error"))

        const response = await request(app)
            .delete('/api/decks/1')

        expect(response.status).toBe(500)
        expect(response.body).toHaveProperty('error', 'Erreur serveur')
    });
})