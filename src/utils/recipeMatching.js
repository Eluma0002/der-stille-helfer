/**
 * Recipe Matching Module
 * Matches recipes against inventory items with text normalization and scoring
 * Supports pantry items (Grundzutaten) as always-available ingredients
 */

import { adaptRecipeForMatching } from './recipeAdapter.js';

const PANTRY_DEFAULTS = ['Salz', 'Pfeffer', 'Öl', 'Mehl', 'Zucker', 'Butter', 'Essig', 'Wasser', 'Natron', 'Milch'];

export function getPantryItems() {
    try {
        const stored = localStorage.getItem('gsd_grundzutaten');
        return stored ? JSON.parse(stored) : PANTRY_DEFAULTS;
    } catch {
        return PANTRY_DEFAULTS;
    }
}

export function savePantryItems(items) {
    localStorage.setItem('gsd_grundzutaten', JSON.stringify(items));
}

export { PANTRY_DEFAULTS };

/**
 * Normalize German text for matching (case-insensitive, umlaut-insensitive)
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ß/g, 'ss')
        .trim();
}

/**
 * Check if an ingredient name matches any inventory item
 * Uses substring matching in both directions
 * @param {string} ingredientName
 * @param {string[]} normalizedInventory - pre-normalized inventory names
 * @returns {boolean}
 */
function ingredientInInventory(ingredientName, normalizedInventory) {
    const normalizedIngredient = normalize(ingredientName);
    return normalizedInventory.some(invName =>
        invName.includes(normalizedIngredient) || normalizedIngredient.includes(invName)
    );
}

/**
 * Match recipes against inventory items
 *
 * @param {Object[]} recipes - Array of recipes (old or new schema)
 * @param {Object[]} inventoryItems - Array of inventory products with {name, ablauf, ...}
 * @returns {Object} Categorized results: { canCook, almostReady, needMore }
 *   Each entry: { recipe, score, available, total, missingItems, usesExpiring }
 */
export function matchRecipesToInventory(recipes, inventoryItems) {
    if (!recipes || !inventoryItems) {
        return { canCook: [], almostReady: [], needMore: [] };
    }

    // Add pantry items as virtual inventory entries (always available)
    const pantry = getPantryItems();
    const virtualInventory = [
        ...inventoryItems,
        ...pantry.map(name => ({ name, _isPantry: true }))
    ];

    // Pre-normalize inventory names
    const normalizedInventory = virtualInventory.map(p => normalize(p.name));

    // Find products expiring within 3 days (only real inventory, not pantry)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const expiringNames = inventoryItems
        .filter(p => p.ablauf && new Date(p.ablauf) <= threeDaysFromNow)
        .map(p => normalize(p.name));

    const results = recipes.map(recipe => {
        const adapted = adaptRecipeForMatching(recipe);
        if (!adapted) return null;

        const requiredIngredients = adapted.ingredientNames;
        const optionalIngredients = adapted.optionalIngredientNames;

        if (requiredIngredients.length === 0) {
            return null;
        }

        // Check required ingredients
        let available = 0;
        const missingItems = [];
        const matchedExpiring = [];

        for (const ing of requiredIngredients) {
            if (ingredientInInventory(ing, normalizedInventory)) {
                available++;
                // Check if this ingredient is expiring
                const normalizedIng = normalize(ing);
                if (expiringNames.some(exp => normalizedIng.includes(exp) || exp.includes(normalizedIng))) {
                    matchedExpiring.push(ing);
                }
            } else {
                missingItems.push(ing);
            }
        }

        // Also check optional ingredients for expiring product usage
        for (const ing of optionalIngredients) {
            if (ingredientInInventory(ing, normalizedInventory)) {
                const normalizedIng = normalize(ing);
                if (expiringNames.some(exp => normalizedIng.includes(exp) || exp.includes(normalizedIng))) {
                    matchedExpiring.push(ing);
                }
            }
        }

        const total = requiredIngredients.length;
        const score = total > 0 ? (available / total) * 100 : 0;

        return {
            recipe: adapted,
            score,
            available,
            total,
            missingItems,
            usesExpiring: matchedExpiring.length > 0,
            expiringIngredients: matchedExpiring
        };
    }).filter(Boolean);

    // Sort within categories: expiring products first, then by score
    const sortFn = (a, b) => {
        if (a.usesExpiring !== b.usesExpiring) return b.usesExpiring - a.usesExpiring;
        return b.score - a.score;
    };

    return {
        canCook: results.filter(r => r.score === 100).sort(sortFn),
        almostReady: results.filter(r => r.score >= 70 && r.score < 100).sort(sortFn),
        needMore: results.filter(r => r.score > 0 && r.score < 70).sort(sortFn).slice(0, 5)
    };
}
