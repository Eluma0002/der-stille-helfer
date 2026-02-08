import { Bot } from './Bot.js';
import { ELVIS_SUBSTITUTIONS } from './substitutions.js';
import { strings } from '../strings/de.js';

export class KochBot extends Bot {
    constructor() {
        super('koch', 'Der Koch', '👨‍🍳');
        // Pre-normalize substitution keys for efficient matching
        this.normalizedSubstitutions = this._buildNormalizedMap();
    }

    /**
     * Normalize German text for case-insensitive, diacritic-insensitive matching
     * @private
     */
    _normalize(text) {
        if (!text) return '';
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    /**
     * Build a map of normalized restriction keys to original + alternatives
     * @private
     */
    _buildNormalizedMap() {
        const map = new Map();
        for (const [original, alternatives] of Object.entries(ELVIS_SUBSTITUTIONS)) {
            const normalized = this._normalize(original);
            map.set(normalized, { original, alternatives });
        }
        return map;
    }

    /**
     * Find restricted ingredients in a recipe
     * @private
     */
    _findRestrictedIngredients(recipe, restrictions) {
        const matches = [];

        if (!recipe.zutaten || !Array.isArray(recipe.zutaten)) {
            return matches;
        }

        for (const zutat of recipe.zutaten) {
            if (!zutat.name) continue;

            const normalizedName = this._normalize(zutat.name);

            // Split on common separators
            const tokens = normalizedName.split(/[\s,]+|(?:^|\s)(?:und|oder)(?:\s|$)/);

            for (const token of tokens) {
                const trimmed = token.trim();
                if (!trimmed) continue;

                // Check if token matches any restriction
                for (const restriction of restrictions) {
                    const normalizedRestriction = this._normalize(restriction);

                    if (trimmed.includes(normalizedRestriction) || normalizedRestriction.includes(trimmed)) {
                        matches.push({
                            ingredient: zutat.name,
                            quantity: zutat.menge || '',
                            restriction: restriction
                        });
                        break; // Only add once per ingredient
                    }
                }
            }
        }

        return matches;
    }

    /**
     * Check if a recipe is safe for a user profile
     * @param {Object} recipe - Recipe object with zutaten array
     * @param {Object} userProfile - User profile with dietary_restrictions array
     * @returns {Object} - {status: 'safe'|'adapted'|'warning', message: string, replacements: array}
     */
    checkSafety(recipe, userProfile) {
        // If no dietary restrictions, recipe is safe
        if (!userProfile.dietary_restrictions || userProfile.dietary_restrictions.length === 0) {
            return {
                status: 'safe',
                message: strings.bots.safe,
                replacements: []
            };
        }

        // Find restricted ingredients
        const matches = this._findRestrictedIngredients(recipe, userProfile.dietary_restrictions);

        // If no matches, recipe is safe
        if (matches.length === 0) {
            return {
                status: 'safe',
                message: strings.bots.safe,
                replacements: []
            };
        }

        // Build replacements array with alternatives
        const replacements = [];
        let hasUnknownRestriction = false;

        for (const match of matches) {
            const normalizedRestriction = this._normalize(match.restriction);
            const substitution = this.normalizedSubstitutions.get(normalizedRestriction);

            if (substitution && substitution.alternatives.length > 0) {
                replacements.push({
                    ingredient: match.ingredient,
                    quantity: match.quantity,
                    alternatives: substitution.alternatives
                });
            } else {
                // Restriction has no known alternatives
                hasUnknownRestriction = true;
                replacements.push({
                    ingredient: match.ingredient,
                    quantity: match.quantity,
                    alternatives: []
                });
            }
        }

        // Determine status
        if (hasUnknownRestriction) {
            return {
                status: 'warning',
                message: strings.bots.warning,
                replacements
            };
        } else {
            return {
                status: 'adapted',
                message: strings.bots.adapted,
                replacements
            };
        }
    }
}
