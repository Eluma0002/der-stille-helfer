import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import './KochAssistent.css';

const MEAL_CATEGORIES = [
    { id: 'all', name: 'Alle', icon: '🍽️' },
    { id: 'fruehstueck', name: 'Frühstück', icon: '🌅' },
    { id: 'mittag', name: 'Mittag', icon: '☀️' },
    { id: 'abend', name: 'Abend', icon: '🌙' },
    { id: 'snack', name: 'Snacks', icon: '🍿' }
];

const KochAssistent = () => {
    const { activeUserId } = useUser();
    const [mealFilter, setMealFilter] = useState('all');

    // Load user's inventory
    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    // Load all recipes (base + user's own)
    const baseRezepte = useLiveQuery(() => db.base_rezepte.toArray());
    const eigeneRezepte = useLiveQuery(
        () => db.eigene_rezepte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    // Combine all recipes
    const allRezepte = useMemo(() => {
        const base = baseRezepte?.map(r => ({ ...r, type: 'base' })) || [];
        const eigene = eigeneRezepte?.map(r => ({ ...r, type: 'eigene' })) || [];
        return [...base, ...eigene];
    }, [baseRezepte, eigeneRezepte]);

    // Normalize product names for matching
    const normalizeText = (text) => {
        return text.toLowerCase()
            .replace(/ä/g, 'a')
            .replace(/ö/g, 'o')
            .replace(/ü/g, 'u')
            .replace(/ß/g, 'ss')
            .trim();
    };

    // Check if product is in inventory
    const hasIngredient = (ingredientName) => {
        if (!produkte) return false;
        const normalized = normalizeText(ingredientName);
        return produkte.some(p => {
            const productName = normalizeText(p.name);
            // Match if product name contains ingredient or vice versa
            return productName.includes(normalized) || normalized.includes(productName);
        });
    };

    // Calculate recipe match score
    const analyzeRecipe = (recipe) => {
        if (!recipe.zutaten || recipe.zutaten.length === 0) {
            return { available: 0, missing: 0, score: 0, missingItems: [] };
        }

        let available = 0;
        const missingItems = [];

        recipe.zutaten.forEach(zutat => {
            if (hasIngredient(zutat.name)) {
                available++;
            } else {
                missingItems.push(zutat.name);
            }
        });

        const total = recipe.zutaten.length;
        const score = total > 0 ? (available / total) * 100 : 0;

        return {
            available,
            missing: total - available,
            total,
            score,
            missingItems
        };
    };

    // Get products expiring soon (within 3 days)
    const expiringProducts = useMemo(() => {
        if (!produkte) return [];
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return produkte
            .filter(p => new Date(p.ablauf) <= threeDaysFromNow)
            .map(p => normalizeText(p.name));
    }, [produkte]);

    // Check if recipe uses expiring products
    const usesExpiringProducts = (recipe) => {
        if (!recipe.zutaten || expiringProducts.length === 0) return false;
        return recipe.zutaten.some(z => {
            const normalized = normalizeText(z.name);
            return expiringProducts.some(exp =>
                normalized.includes(exp) || exp.includes(normalized)
            );
        });
    };

    // Categorize recipes
    const categorizedRecipes = useMemo(() => {
        if (!allRezepte || !produkte) {
            return { canCook: [], almostReady: [], needMore: [] };
        }

        const analyzed = allRezepte.map(recipe => ({
            ...recipe,
            match: analyzeRecipe(recipe),
            usesExpiring: usesExpiringProducts(recipe)
        }));

        // Filter by meal category
        const filtered = mealFilter === 'all'
            ? analyzed
            : analyzed.filter(r => r.mahlzeit === mealFilter);

        return {
            canCook: filtered
                .filter(r => r.match.score === 100)
                .sort((a, b) => b.usesExpiring - a.usesExpiring),
            almostReady: filtered
                .filter(r => r.match.score >= 70 && r.match.score < 100)
                .sort((a, b) => b.match.score - a.match.score),
            needMore: filtered
                .filter(r => r.match.score > 0 && r.match.score < 70)
                .sort((a, b) => b.match.score - a.match.score)
                .slice(0, 5) // Show only top 5
        };
    }, [allRezepte, produkte, mealFilter, expiringProducts]);

    const getMealIcon = (mahlzeit) => {
        const cat = MEAL_CATEGORIES.find(c => c.id === mahlzeit);
        return cat ? cat.icon : '🍽️';
    };

    const addMissingToShoppingList = async (missingItems) => {
        try {
            for (const item of missingItems) {
                await db.einkaufsliste.add({
                    id: `shopping-${Date.now()}-${Math.random()}`,
                    person_id: activeUserId,
                    name: item,
                    menge: '',
                    checked: false,
                    kategorie: 'sonstiges',
                    created_at: new Date().toISOString()
                });
            }
            alert(`${missingItems.length} Zutaten zur Einkaufsliste hinzugefügt!`);
        } catch (err) {
            console.error('Error adding to shopping list:', err);
            alert('Fehler beim Hinzufügen zur Einkaufsliste');
        }
    };

    if (!produkte || produkte.length === 0) {
        return (
            <div className="page koch-assistent">
                <h2>🤖 Koch-Assistent</h2>
                <div className="empty-state">
                    <p>🧊 Dein Kühlschrank ist leer</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Füge erst Produkte hinzu, damit ich Rezepte vorschlagen kann!
                    </p>
                    <Link to="/produkte" className="btn primary">
                        📦 Produkte hinzufügen
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page koch-assistent">
            <h2>🤖 Koch-Assistent</h2>
            <p className="subtitle">
                {produkte.length} Produkte im Inventar · {categorizedRecipes.canCook.length} Rezepte sofort kochbar
            </p>

            {/* Meal Filter */}
            <div className="card meal-filter">
                <div className="meal-buttons">
                    {MEAL_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`btn small ${mealFilter === cat.id ? 'primary' : 'secondary'}`}
                            onClick={() => setMealFilter(cat.id)}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Can Cook Now */}
            {categorizedRecipes.canCook.length > 0 && (
                <div className="recipe-section">
                    <h3 className="section-title">
                        ✅ Jetzt kochen ({categorizedRecipes.canCook.length})
                    </h3>
                    <div className="recipe-grid">
                        {categorizedRecipes.canCook.map(recipe => (
                            <Link
                                key={`${recipe.type}-${recipe.id}`}
                                to={recipe.type === 'base' ? `/rezept/${recipe.id}` : `/eigenes-rezept/${recipe.id}`}
                                className="recipe-card-link"
                            >
                                <div className={`recipe-card ${recipe.usesExpiring ? 'expiring' : ''}`}>
                                    {recipe.usesExpiring && (
                                        <div className="expiring-badge">⚠️ Bald ablaufend</div>
                                    )}
                                    <div className="recipe-icon">{getMealIcon(recipe.mahlzeit)}</div>
                                    <h4>{recipe.name}</h4>
                                    <div className="recipe-meta">
                                        <span>{recipe.portionen} Portionen</span>
                                        <span>{recipe.zeit} Min.</span>
                                    </div>
                                    <div className="match-badge complete">
                                        ✓ Alle Zutaten da
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Almost Ready */}
            {categorizedRecipes.almostReady.length > 0 && (
                <div className="recipe-section">
                    <h3 className="section-title">
                        🔸 Fast fertig ({categorizedRecipes.almostReady.length})
                    </h3>
                    <div className="recipe-grid">
                        {categorizedRecipes.almostReady.map(recipe => (
                            <div key={`${recipe.type}-${recipe.id}`} className="recipe-card-container">
                                <Link
                                    to={recipe.type === 'base' ? `/rezept/${recipe.id}` : `/eigenes-rezept/${recipe.id}`}
                                    className="recipe-card-link"
                                >
                                    <div className="recipe-card">
                                        <div className="recipe-icon">{getMealIcon(recipe.mahlzeit)}</div>
                                        <h4>{recipe.name}</h4>
                                        <div className="recipe-meta">
                                            <span>{recipe.portionen} Portionen</span>
                                            <span>{recipe.zeit} Min.</span>
                                        </div>
                                        <div className="match-badge partial">
                                            {recipe.match.available}/{recipe.match.total} Zutaten
                                        </div>
                                        <div className="missing-items">
                                            <strong>Fehlt:</strong> {recipe.match.missingItems.slice(0, 2).join(', ')}
                                            {recipe.match.missingItems.length > 2 && ` +${recipe.match.missingItems.length - 2}`}
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    className="btn small secondary add-to-list-btn"
                                    onClick={() => addMissingToShoppingList(recipe.match.missingItems)}
                                >
                                    + Einkaufsliste
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Need More */}
            {categorizedRecipes.needMore.length > 0 && (
                <div className="recipe-section">
                    <h3 className="section-title">
                        💡 Brauchst mehr Zutaten
                    </h3>
                    <div className="recipe-list-compact">
                        {categorizedRecipes.needMore.map(recipe => (
                            <div key={`${recipe.type}-${recipe.id}`} className="recipe-item-compact">
                                <Link
                                    to={recipe.type === 'base' ? `/rezept/${recipe.id}` : `/eigenes-rezept/${recipe.id}`}
                                >
                                    <span className="recipe-icon-small">{getMealIcon(recipe.mahlzeit)}</span>
                                    <span className="recipe-name">{recipe.name}</span>
                                    <span className="match-score">{Math.round(recipe.match.score)}%</span>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No recipes found */}
            {categorizedRecipes.canCook.length === 0 &&
             categorizedRecipes.almostReady.length === 0 &&
             categorizedRecipes.needMore.length === 0 && (
                <div className="empty-state">
                    <p>🔍 Keine passenden Rezepte gefunden</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Probiere einen anderen Filter oder füge mehr Produkte hinzu!
                    </p>
                </div>
            )}
        </div>
    );
};

export default KochAssistent;
