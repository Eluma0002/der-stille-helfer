/**
 * Recipe Adapter - maps old and new recipe schema to a unified format for matching
 */

/**
 * Parse a German quantity string like "400g", "2 EL", "1 Stück" into {amount, unit}
 * @param {string} mengeStr - e.g. "400g", "2 EL", "1 Prise"
 * @returns {{amount: number|null, unit: string}}
 */
export function parseMenge(mengeStr) {
    if (!mengeStr || typeof mengeStr !== 'string') {
        return { amount: null, unit: '' };
    }

    const trimmed = mengeStr.trim();

    // Match patterns like "400g", "2 EL", "1/2 Stück", "nach Geschmack"
    const match = trimmed.match(/^(\d+[.,/]?\d*)\s*(.*)$/);
    if (match) {
        let amount = match[1];
        // Handle fractions like "1/2"
        if (amount.includes('/')) {
            const [num, den] = amount.split('/');
            amount = parseFloat(num) / parseFloat(den);
        } else {
            amount = parseFloat(amount.replace(',', '.'));
        }
        return { amount, unit: match[2].trim() };
    }

    // No numeric amount found (e.g. "nach Geschmack", "1 Prise")
    return { amount: null, unit: trimmed };
}

/**
 * Adapt a recipe (old or new schema) into a unified format for matching
 *
 * Old schema: { name, zutaten: [{name, menge}], mahlzeit, kategorie, portionen, zeit }
 * New schema: { title, ingredients: [{amount, unit, name, optional}], mealTime, category, baseServings, timeMinutes }
 *
 * @param {Object} recipe - Recipe in either old or new format
 * @returns {Object} Adapted recipe with unified fields
 */
export function adaptRecipeForMatching(recipe) {
    if (!recipe) return null;

    // Determine if new or old schema
    const isNewSchema = recipe.ingredients && Array.isArray(recipe.ingredients);

    let ingredients = [];
    let optionalIngredients = [];

    if (isNewSchema) {
        // New schema: ingredients is already structured
        for (const ing of recipe.ingredients) {
            if (ing.optional) {
                optionalIngredients.push(ing.name);
            } else {
                ingredients.push(ing.name);
            }
        }
    } else if (recipe.zutaten && Array.isArray(recipe.zutaten)) {
        // Old schema: zutaten is [{name, menge}]
        for (const z of recipe.zutaten) {
            if (z.name) {
                ingredients.push(z.name);
            }
        }
    }

    return {
        ...recipe,
        // Unified fields
        title: recipe.title || recipe.name,
        mealTime: recipe.mealTime || recipe.mahlzeit,
        category: recipe.category || recipe.kategorie,
        timeMinutes: recipe.timeMinutes || recipe.zeit,
        baseServings: recipe.baseServings || recipe.portionen,
        cuisine: recipe.cuisine || recipe.küche || 'deutsch',
        // Matching fields
        ingredientNames: ingredients,
        optionalIngredientNames: optionalIngredients,
        allIngredientNames: [...ingredients, ...optionalIngredients]
    };
}
