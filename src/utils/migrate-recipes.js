// Migration: Add mahlzeit field to existing recipes
import { db } from '../db/schema.js';

export async function migrateRecipes() {
    try {
        const recipes = await db.base_rezepte.toArray();

        for (const recipe of recipes) {
            // Skip if already has mahlzeit field
            if (recipe.mahlzeit) continue;

            // Auto-assign based on category or name
            let mahlzeit = 'mittag'; // default

            if (recipe.kategorie === 'Fruhstuck' ||
                recipe.name.toLowerCase().includes('omelett') ||
                recipe.name.toLowerCase().includes('rührei') ||
                recipe.name.toLowerCase().includes('müsli')) {
                mahlzeit = 'fruehstueck';
            } else if (recipe.kategorie === 'Dessert' ||
                       recipe.kategorie === 'Snack' ||
                       recipe.name.toLowerCase().includes('salat') ||
                       recipe.name.toLowerCase().includes('kuchen')) {
                mahlzeit = 'snack';
            } else if (recipe.kategorie === 'Hauptgericht') {
                // Heavy dishes -> dinner, lighter -> lunch
                if (recipe.zeit && recipe.zeit > 60) {
                    mahlzeit = 'abend';
                } else {
                    mahlzeit = 'mittag';
                }
            }

            await db.base_rezepte.update(recipe.id, { mahlzeit });
        }

        console.log('Migration complete:', recipes.length, 'recipes updated');
        return true;
    } catch (err) {
        console.error('Migration error:', err);
        return false;
    }
}
