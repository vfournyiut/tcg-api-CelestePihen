import {Request, Response, Router} from 'express'
import {prisma} from '../database'
import {authenticateToken} from "../middleware/auth.middleware";
import {DeckPatchRequest, DeckRequest} from "../types/deck.type";

export const deckRouter = Router()

// POST /decks
// Accessible via POST /decks
deckRouter.post('/', authenticateToken, async (req: DeckRequest, res: Response) => {
    try {
        const {name, cards} = req.body

        if (!req.userId) {
            return res.status(401).json({error: 'Token invalide ou expiré'})
        }

        if (!name) {
            return res.status(400).json({error: 'Nom invalide'})
        }

        if (cards.length !== 10) {
            return res.status(400).json({error: 'Cartes invalides'})
        }

        const foundCards = await prisma.card.findMany({
            where: {pokedexNumber: {in: cards}}
        });

        if (foundCards.length !== 10) {
            return res.status(400).json({error: 'Cartes invalides'})
        }

        await prisma.deck.create({
            data: {
                name: name,
                userId: req.userId,
                deckCards: {
                    create: foundCards.map((card) => {
                        return {
                            cardId: card.id
                        }
                    })
                }
            },
        });

        return res.status(201).json({message: "Deck crée avec succès"})
    } catch (error) {
        console.error('Erreur lors de la création du deck: ', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
});

// GET /mine
// Accessible via GET /mine
deckRouter.get('/mine', authenticateToken, async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({error: 'Token invalide ou expiré'})
        }

        const decks = await prisma.deck.findMany({
            where: {userId: req.userId},
            select: {
                id: true,
                name: true,
                userId: true,
                deckCards: true
            }
        })

        if (decks.length === 0) {
            return res.status(200).json({message: "Aucun deck trouvé"})
        }

        return res.status(200).json(decks)
    } catch (error) {
        console.error('Erreur lors de la récupération du deck: ', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
});

// GET /:id
// Accessible via GET /:id
deckRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({error: 'Token invalide ou expiré'})
        }

        const deckId = parseInt(req.params.id);

        if (isNaN(deckId)) {
            return res.status(404).json({error: 'Deck invalide'})
        }

        const deck = await prisma.deck.findUnique({
            where: {id: deckId},
            select: {
                id: true,
                name: true,
                userId: true,
                deckCards: true
            }
        })

        if (!deck) {
            return res.status(404).json({error: 'Deck invalide'})
        }

        if (deck.userId !== req.userId) {
            return res.status(403).json({error: 'Ce deck n\'appartient pas à l\'utilisateur'})
        }

        return res.status(200).json(deck)
    } catch (error) {
        console.error('Erreur lors de la récupération du deck: ', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
});

// PATCH /:id
// Accessible via PATCH /:id
deckRouter.patch('/:id', authenticateToken, async (req: DeckPatchRequest, res: Response) => {
    try {
        const { name, cards } = req.body
        const deckId = parseInt(req.params.id)

        if (!req.userId) {
            return res.status(401).json({error: 'Token invalide ou expiré'})
        }

        // vérifie si deckId s'est bien converti en number ou si le nom est invalide
        if (isNaN(deckId) || !name) {
            return res.status(404).json({error: 'Deck invalide'})
        }

        const deck = await prisma.deck.findUnique({
            where: {id: deckId},
        })

        if (!deck) {
            return res.status(404).json({error: 'Deck invalide'})
        }

        if (deck.userId !== req.userId) {
            return res.status(403).json({error: 'Ce deck n\'appartient pas à l\'utilisateur'})
        }

        if (cards.length !== 10) {
            return res.status(400).json({error: 'Cartes invalides'})
        }

        const foundCards = await prisma.card.findMany({
            where: {pokedexNumber: {in: cards}}
        });

        if (foundCards.length !== 10) {
            return res.status(400).json({error: 'Cartes invalides'})
        }

        await prisma.deck.update({
            where: {id: deck.id},
            data: {
                name: name,
                deckCards: {
                    deleteMany: {},
                    create: foundCards.map((card) => {
                        return {
                            cardId: card.id
                        }
                    })
                }
            },
        });

        return res.status(200).json({message: "Deck mis à jour avec succès"})
    } catch (error) {
        console.error('Erreur lors de la mise à jour du deck: ', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
});

// DELETE /:id
// Accessible via DELETE /:id
deckRouter.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({error: 'Token invalide ou expiré'})
        }

        const deckId = parseInt(req.params.id);

        // vérifier si deckId s'est bien converti en number
        if (isNaN(deckId)) {
            return res.status(404).json({error: 'Deck invalide'})
        }

        const deck = await prisma.deck.findUnique({
            where: {id: deckId},
            select: {
                id: true,
                name: true,
                userId: true,
                deckCards: true
            }
        })

        if (!deck) {
            return res.status(404).json({error: 'Deck invalide'})
        }

        if (deck.userId !== req.userId) {
            return res.status(403).json({error: 'Ce deck n\'appartient pas à l\'utilisateur'})
        }

        await prisma.deckCard.deleteMany({
            where: {deckId: deck.id}
        })

        await prisma.deck.delete({
            where: {id: deck.id}
        })

        return res.status(200).json({message: 'Deck supprimé avec succès'})
    } catch (error) {
        console.error('Erreur lors de la récupération du deck: ', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
});