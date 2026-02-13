/**
 * @file Types TypeScript pour les decks
 * @description Définit les types des requêtes de gestion des decks
 */

import { Request } from 'express'

/**
 * Type du corps de la requête de création de deck
 * @typedef {Object} DeckRequestBody
 * @property {string} name - Nom du deck
 * @property {number[]} cards - Tableau des numéros Pokédex des cartes (doit contenir 10 cartes)
 */
export type DeckRequestBody = {
    name: string;
    cards: number[];
};

/**
 * Interface de requête Express pour la création de deck
 * @interface DeckRequest
 * @extends {Request}
 * @property {DeckRequestBody} body - Corps de la requête contenant les données du deck
 */
export interface DeckRequest extends Request<{}, unknown, DeckRequestBody> {
}

/**
 * Type des paramètres de route pour un deck spécifique
 * @typedef {Object} DeckRequestParam
 * @property {string} id - ID du deck dans l'URL
 */
export type DeckRequestParam = {
    id: string;
}

/**
 * Type du corps de la requête de mise à jour de deck
 * @typedef {Object} DeckPatchRequestBody
 * @property {string} name - Nouveau nom du deck
 * @property {number[]} cards - Nouveau tableau des numéros Pokédex des cartes (doit contenir 10 cartes)
 */
export type DeckPatchRequestBody = {
    name: string;
    cards: number[];
}

/**
 * Interface de requête Express pour la mise à jour de deck
 * @interface DeckPatchRequest
 * @extends {Request}
 * @property {DeckRequestParam} params - Paramètres de route (ID du deck)
 * @property {DeckPatchRequestBody} body - Corps de la requête contenant les nouvelles données du deck
 */
export interface DeckPatchRequest extends Request<DeckRequestParam, unknown, DeckPatchRequestBody> {
}