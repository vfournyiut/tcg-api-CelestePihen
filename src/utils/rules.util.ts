/**
 * @file Règles du jeu Pokemon TCG
 * @description Contient les fonctions pures pour le calcul des dégâts et le système de types
 */

import {PokemonType} from "../generated/prisma/client";

/**
 * Retourne la faiblesse principale d'un type Pokemon
 *
 * @param {PokemonType} defenderType - Le type du Pokemon défenseur
 * @returns {PokemonType|null} Le type auquel le défenseur est faible, ou null si aucune faiblesse définie
 *
 * @description
 * Détermine le type qui infligera des dégâts super-efficaces (x2) contre le type défenseur.
 * Basé sur les mécaniques classiques du jeu Pokemon TCG.
 *
 * @example
 * getWeakness(PokemonType.Fire) // Returns PokemonType.Water
 * getWeakness(PokemonType.Water) // Returns PokemonType.Electric
 */
export function getWeakness(defenderType: PokemonType): PokemonType | null {
    switch (defenderType) {
        case PokemonType.Normal:
            return PokemonType.Fighting;
        case PokemonType.Fire:
            return PokemonType.Water;
        case PokemonType.Water:
            return PokemonType.Electric;
        case PokemonType.Electric:
            return PokemonType.Ground;
        case PokemonType.Grass:
            return PokemonType.Fire;
        case PokemonType.Ice:
            return PokemonType.Fire;
        case PokemonType.Fighting:
            return PokemonType.Psychic;
        case PokemonType.Poison:
            return PokemonType.Psychic;
        case PokemonType.Ground:
            return PokemonType.Water;
        case PokemonType.Flying:
            return PokemonType.Electric;
        case PokemonType.Psychic:
            return PokemonType.Dark;
        case PokemonType.Bug:
            return PokemonType.Fire;
        case PokemonType.Rock:
            return PokemonType.Water;
        case PokemonType.Ghost:
            return PokemonType.Dark;
        case PokemonType.Dragon:
            return PokemonType.Ice;
        case PokemonType.Dark:
            return PokemonType.Fighting;
        case PokemonType.Steel:
            return PokemonType.Fire;
        case PokemonType.Fairy:
            return PokemonType.Poison;
        default:
            return null;
    }
}

/**
 * Calcule le multiplicateur de dégâts selon les types de l'attaquant et du défenseur
 *
 * @param {PokemonType} attackerType - Le type du Pokemon attaquant
 * @param {PokemonType} defenderType - Le type du Pokemon défenseur
 * @returns {number} Le multiplicateur de dégâts (2.0 pour super-efficace, 1.0 pour normal)
 *
 * @description
 * Détermine si l'attaque sera super-efficace en comparant le type de l'attaquant
 * avec la faiblesse du défenseur.
 * - Si le type de l'attaquant correspond à la faiblesse du défenseur : x2.0 dégâts
 * - Sinon : x1.0 dégâts (normaux)
 *
 * @example
 * getDamageMultiplier(PokemonType.Water, PokemonType.Fire) // Returns 2.0 (super-efficace)
 * getDamageMultiplier(PokemonType.Fire, PokemonType.Water) // Returns 1.0 (normal)
 */
export function getDamageMultiplier(attackerType: PokemonType, defenderType: PokemonType): number {
    const weakness = getWeakness(defenderType);

    // Si le type de l'attaquant correspond à la faiblesse du défenseur
    if (weakness === attackerType) {
        return 2.0; // Super efficace (x2 dégâts)
    }

    return 1.0; // Dégâts normaux
}

/**
 * Calcule les dégâts infligés lors d'une attaque Pokemon
 *
 * @param {number} attackerAttack - La valeur d'attaque du Pokemon attaquant
 * @param {PokemonType} attackerType - Le type du Pokemon attaquant
 * @param {PokemonType} defenderType - Le type du Pokemon défenseur
 * @returns {number} Les dégâts finaux après application du multiplicateur (minimum 1)
 *
 * @description
 * Calcule les dégâts en multipliant la valeur d'attaque par le multiplicateur de type.
 * Les dégâts sont arrondis à l'entier inférieur et ne peuvent pas être inférieurs à 1.
 *
 * @example
 * calculateDamage(50, PokemonType.Water, PokemonType.Fire) // Returns 100 (50 * 2.0)
 * calculateDamage(30, PokemonType.Fire, PokemonType.Water) // Returns 30 (30 * 1.0)
 * calculateDamage(0, PokemonType.Normal, PokemonType.Ghost) // Returns 1 (minimum damage)
 */
export function calculateDamage(
    attackerAttack: number,
    attackerType: PokemonType,
    defenderType: PokemonType
): number {
    const multiplier = getDamageMultiplier(attackerType, defenderType);

    const damage = Math.floor(attackerAttack * multiplier);

    return Math.max(1, damage);
}
