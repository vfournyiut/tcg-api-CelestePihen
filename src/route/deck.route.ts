/**
 * @file Routes des decks
 * @description Gère la création, récupération, mise à jour et suppression des decks
 */

import {Request, Response, Router} from 'express'
import {prisma} from '../database'
import {authenticateToken} from "../middleware/auth.middleware";
import {DeckPatchRequest, DeckRequest} from "../types/deck.type";

/**
 * Router Express pour les routes des decks
 * @const {Router}
 */
export const deckRouter = Router()

/**
 * Route de création d'un nouveau deck
 *
 * @route POST /decks
 * @security JWT
 * @param {DeckRequest} req - Requête contenant les données du deck
 * @param {string} req.body.name - Nom du deck
 * @param {number[]} req.body.cards - Tableau des numéros Pokédex des cartes (doit contenir exactement 10 cartes)
 * @param {Response} res - Objet de réponse Express
 * @returns {Object} 201 - Deck créé avec succès
 * @returns {string} 201.message - Message de confirmation
 *
 * @throws {400} Nom invalide - Si le nom n'est pas fourni
 * @throws {400} Cartes invalides - Si le nombre de cartes n'est pas 10 ou si les cartes n'existent pas
 * @throws {401} Token invalide ou expiré - Si l'utilisateur n'est pas authentifié
 * @throws {500} Erreur serveur - En cas d'erreur lors de la création
 *
 * @description
 * - Vérifie l'authentification de l'utilisateur
 * - Valide le nom du deck
 * - Vérifie que le deck contient exactement 10 cartes
 * - Vérifie que toutes les cartes existent en base de données
 * - Crée le deck et associe les cartes
 */
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

        return res.status(201).json({message: "Deck créé avec succès"})
    } catch (error) {
        console.error('Erreur lors de la création du deck: ', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
});

/**
 * Route de récupération de tous les decks de l'utilisateur connecté
 *
 * @route GET /decks/mine
 * @security JWT
 * @param {Request} req - Objet de requête Express
 * @param {Response} res - Objet de réponse Express
 * @returns {Array<Object>} 200 - Liste des decks de l'utilisateur
 * @returns {number} 200[].id - ID du deck
 * @returns {string} 200[].name - Nom du deck
 * @returns {number} 200[].userId - ID du propriétaire
 * @returns {Array<Object>} 200[].deckCards - Cartes associées au deck
 *
 * @throws {401} Token invalide ou expiré - Si l'utilisateur n'est pas authentifié
 * @throws {500} Erreur serveur - En cas d'erreur lors de la récupération
 *
 * @description
 * - Vérifie l'authentification de l'utilisateur
 * - Récupère tous les decks appartenant à l'utilisateur connecté
 * - Retourne les decks avec leurs cartes associées
 */
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

        return res.status(200).json(decks)
    } catch (error) {
        console.error('Erreur lors de la récupération du deck: ', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
});

/**
 * Route de récupération d'un deck spécifique par son ID
 *
 * @route GET /decks/:id
 * @security JWT
 * @param {Request} req - Objet de requête Express
 * @param {string} req.params.id - ID du deck à récupérer
 * @param {Response} res - Objet de réponse Express
 * @returns {Object} 200 - Deck récupéré avec succès
 * @returns {number} 200.id - ID du deck
 * @returns {string} 200.name - Nom du deck
 * @returns {number} 200.userId - ID du propriétaire
 * @returns {Array<Object>} 200.deckCards - Cartes associées au deck
 *
 * @throws {401} Token invalide ou expiré - Si l'utilisateur n'est pas authentifié
 * @throws {403} Ce deck n'appartient pas à l'utilisateur - Si le deck appartient à un autre utilisateur
 * @throws {404} Deck invalide - Si l'ID n'est pas un nombre ou si le deck n'existe pas
 * @throws {500} Erreur serveur - En cas d'erreur lors de la récupération
 *
 * @description
 * - Vérifie l'authentification de l'utilisateur
 * - Valide que l'ID est un nombre
 * - Vérifie que le deck existe
 * - Vérifie que le deck appartient à l'utilisateur connecté
 * - Retourne le deck avec ses cartes associées
 */
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

/**
 * Route de mise à jour d'un deck existant
 *
 * @route PATCH /decks/:id
 * @security JWT
 * @param {DeckPatchRequest} req - Requête contenant les données de mise à jour
 * @param {string} req.params.id - ID du deck à mettre à jour
 * @param {string} req.body.name - Nouveau nom du deck
 * @param {number[]} req.body.cards - Nouveau tableau des numéros Pokédex des cartes (doit contenir exactement 10 cartes)
 * @param {Response} res - Objet de réponse Express
 * @returns {Object} 200 - Deck mis à jour avec succès
 * @returns {string} 200.message - Message de confirmation
 *
 * @throws {400} Cartes invalides - Si le nombre de cartes n'est pas 10 ou si les cartes n'existent pas
 * @throws {401} Token invalide ou expiré - Si l'utilisateur n'est pas authentifié
 * @throws {403} Ce deck n'appartient pas à l'utilisateur - Si le deck appartient à un autre utilisateur
 * @throws {404} Deck invalide - Si l'ID n'est pas un nombre, si le nom est invalide ou si le deck n'existe pas
 * @throws {500} Erreur serveur - En cas d'erreur lors de la mise à jour
 *
 * @description
 * - Vérifie l'authentification de l'utilisateur
 * - Valide l'ID et le nom du deck
 * - Vérifie que le deck existe et appartient à l'utilisateur
 * - Vérifie que le deck contient exactement 10 cartes
 * - Vérifie que toutes les cartes existent en base de données
 * - Supprime les anciennes associations de cartes
 * - Crée les nouvelles associations de cartes
 */
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

/**
 * Route de suppression d'un deck
 *
 * @route DELETE /decks/:id
 * @security JWT
 * @param {Request} req - Objet de requête Express
 * @param {string} req.params.id - ID du deck à supprimer
 * @param {Response} res - Objet de réponse Express
 * @returns {Object} 200 - Deck supprimé avec succès
 * @returns {string} 200.message - Message de confirmation
 *
 * @throws {401} Token invalide ou expiré - Si l'utilisateur n'est pas authentifié
 * @throws {403} Ce deck n'appartient pas à l'utilisateur - Si le deck appartient à un autre utilisateur
 * @throws {404} Deck invalide - Si l'ID n'est pas un nombre ou si le deck n'existe pas
 * @throws {500} Erreur serveur - En cas d'erreur lors de la suppression
 *
 * @description
 * - Vérifie l'authentification de l'utilisateur
 * - Valide que l'ID est un nombre
 * - Vérifie que le deck existe
 * - Vérifie que le deck appartient à l'utilisateur connecté
 * - Supprime d'abord toutes les associations de cartes
 * - Supprime ensuite le deck
 */
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