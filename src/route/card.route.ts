/**
 * @file Routes des cartes
 * @description Gère la récupération des cartes Pokémon
 */

import {Request, Response, Router} from 'express'

import {prisma} from '../database'

/**
 * Router Express pour les routes des cartes
 * @const {Router}
 */
export const cardRouter = Router()

/**
 * Route de récupération de toutes les cartes
 *
 * @route GET /cards
 * @param {Request} _req - Objet de requête Express (non utilisé)
 * @param {Response} res - Objet de réponse Express
 * @returns {Object} 200 - Liste des cartes récupérée avec succès
 * @returns {Array<Object>} 200.cards - Tableau des cartes
 * @returns {number} 200.cards[].id - ID de la carte
 * @returns {string} 200.cards[].name - Nom du Pokémon
 * @returns {number} 200.cards[].hp - Points de vie
 * @returns {number} 200.cards[].attack - Points d'attaque
 * @returns {string} 200.cards[].type - Type du Pokémon
 * @returns {number} 200.cards[].pokedexNumber - Numéro dans le Pokédex
 * @returns {string} 200.cards[].imgUrl - URL de l'image de la carte
 *
 * @throws {500} Erreur serveur - En cas d'erreur lors de la récupération
 *
 * @description
 * - Récupère toutes les cartes de la base de données
 * - Les cartes sont triées par numéro de Pokédex croissant
 * - Retourne uniquement les champs nécessaires
 */
cardRouter.get('/', async (_req: Request, res: Response) => {
    try {
        const cards = await prisma.card.findMany({
            select: {
                id: true,
                name: true,
                hp: true,
                attack: true,
                type: true,
                pokedexNumber: true,
                imgUrl: true
            },
            orderBy: {
                pokedexNumber: 'asc'
            }
        });

        return res.status(200).json({ cards })
    } catch (error) {
        console.error('Erreur lors de l\'obtention des cartes:', error)
        return res.status(500).json({error: 'Erreur serveur'})
    }
});