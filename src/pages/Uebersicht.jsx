import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import ProductIcon from '../components/ProductIcon';
import { DEFAULT_CATEGORIES, SAMPLE_RECIPES, MEAL_CATEGORIES } from '../constants';
import './Uebersicht.css';

/**
 * Helper: format today's date in German
 */
const formatGermanDate = () => {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return now.toLocaleDateString('de-DE', options);
};

/**
 * Helper: compute human-readable expiry label
 */
const getExpiryLabel = (ablaufDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(ablaufDate);
    expiry.setHours(0, 0, 0, 0);
    const diffMs = expiry - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'abgelaufen';
    if (diffDays === 0) return 'heute';
    if (diffDays === 1) return 'noch 1 Tag';
    return `noch ${diffDays} Tage`;
};

/**
 * Helper: pick one random element from an array
 */
const pickRandom = (arr) => {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
};

const Uebersicht = () => {
    const { activeUser, activeUserId } = useUser();

    // --- Data queries ---
    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    const baseRezepte = useLiveQuery(
        () => db.base_rezepte.toArray(),
        []
    );

    const eigeneRezepte = useLiveQuery(
        () => db.eigene_rezepte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    const einkaufsliste = useLiveQuery(
        () => db.einkaufsliste.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    // --- Meal suggestions: one random recipe per meal time ---
    const mealSuggestions = useMemo(() => {
        const allRecipes = [
            ...(baseRezepte || []).map(r => ({ ...r, type: 'base' })),
            ...(eigeneRezepte || []).map(r => ({ ...r, type: 'eigene' }))
        ];

        const mealTimes = MEAL_CATEGORIES.filter(m => m.id !== 'all');

        return mealTimes.map(meal => {
            const matching = allRecipes.filter(r => r.mahlzeit === meal.id);
            const recipe = pickRandom(matching);
            return {
                ...meal,
                recipe
            };
        });
    }, [baseRezepte, eigeneRezepte]);

    // --- Products grouped by storage location ---
    const groupedProducts = useMemo(() => {
        if (!produkte) return {};

        const groups = {};
        DEFAULT_CATEGORIES.forEach(cat => {
            groups[cat.id] = [];
        });

        produkte.forEach(p => {
            const location = p.ort || p.kategorie || 'vorrat';
            if (groups[location]) {
                groups[location].push(p);
            } else {
                groups['vorrat'].push(p);
            }
        });

        return groups;
    }, [produkte]);

    // --- Products expiring within 3 days ---
    const expiringProducts = useMemo(() => {
        if (!produkte) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        return produkte
            .filter(p => {
                if (!p.ablauf) return false;
                const expiry = new Date(p.ablauf);
                expiry.setHours(0, 0, 0, 0);
                return expiry <= threeDaysFromNow;
            })
            .sort((a, b) => new Date(a.ablauf) - new Date(b.ablauf));
    }, [produkte]);

    // --- Unchecked shopping list items ---
    const uncheckedItems = useMemo(() => {
        if (!einkaufsliste) return [];
        return einkaufsliste.filter(item => !item.checked);
    }, [einkaufsliste]);

    // --- Toggle shopping list item ---
    const toggleShoppingItem = async (item) => {
        await db.einkaufsliste.update(item.id, { checked: !item.checked });
    };

    // --- Build recipe link path ---
    const getRecipeLink = (recipe) => {
        if (!recipe) return '/rezepte';
        return recipe.type === 'base'
            ? `/rezept/${recipe.id}`
            : `/eigenes-rezept/${recipe.id}`;
    };

    return (
        <div className="overview-page">

            {/* 1. Greeting Header */}
            <div className="overview-header">
                <h2>Hallo {activeUser?.emoji} {activeUser?.name}!</h2>
                <p className="overview-subtitle">{formatGermanDate()}</p>
            </div>

            {/* 2. Today's Meal Suggestions */}
            <section className="meal-suggestions-section">
                <h3 className="section-title">Heutige Vorschläge</h3>
                <div className="meal-suggestions-scroll">
                    {mealSuggestions.map(meal => (
                        <div key={meal.id} className="meal-suggestion-card">
                            <div className="meal-card-header">
                                <span className="meal-icon">{meal.icon}</span>
                                <span className="meal-label">{meal.name}</span>
                            </div>
                            {meal.recipe ? (
                                <Link to={getRecipeLink(meal.recipe)} className="meal-card-body">
                                    <span className="meal-recipe-name">{meal.recipe.name}</span>
                                    <span className="meal-recipe-time">{meal.recipe.zeit} Min.</span>
                                </Link>
                            ) : (
                                <div className="meal-card-body meal-empty">
                                    <span className="meal-recipe-name">Kein Rezept</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Quick Actions */}
            <div className="quick-actions">
                <button
                    className="action-btn"
                    onClick={() => window.location.hash = '#/produkte'}
                >
                    <span className="action-icon">🧊</span>
                    <span className="action-label">Inventar</span>
                </button>
                <button
                    className="action-btn"
                    onClick={() => window.location.hash = '#/koch-assistent'}
                >
                    <span className="action-icon">🤖</span>
                    <span className="action-label">Koch-AI</span>
                </button>
                <button
                    className="action-btn"
                    onClick={() => window.location.hash = '#/rezepte'}
                >
                    <span className="action-icon">📖</span>
                    <span className="action-label">Rezepte</span>
                </button>
                <button
                    className="action-btn"
                    onClick={() => window.location.hash = '#/einkauf'}
                >
                    <span className="action-icon">🛒</span>
                    <span className="action-label">Einkauf</span>
                </button>
            </div>

            {/* 4. Fridge Visualization - products grouped by storage location */}
            <section className="storage-section">
                <h3 className="section-title">Dein Vorrat</h3>
                {DEFAULT_CATEGORIES.map(cat => {
                    const items = groupedProducts[cat.id] || [];
                    if (items.length === 0) return null;
                    return (
                        <div key={cat.id} className="storage-group">
                            <div className="storage-group-header">
                                <span
                                    className="storage-group-badge"
                                    style={{ backgroundColor: cat.color }}
                                >
                                    {cat.icon}
                                </span>
                                <span className="storage-group-name">{cat.name}</span>
                                <span className="storage-group-count">{items.length}</span>
                            </div>
                            <div className="storage-items-scroll">
                                {items.map(p => (
                                    <div
                                        key={p.id}
                                        className="storage-item"
                                        onClick={() => window.location.hash = '#/produkte'}
                                    >
                                        <ProductIcon productName={p.name} size="medium" />
                                        <span className="storage-item-name">{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {produkte && produkte.length === 0 && (
                    <div className="fridge-empty">
                        <p>Noch keine Produkte vorhanden</p>
                        <button
                            className="btn secondary small"
                            onClick={() => window.location.hash = '#/produkte'}
                        >
                            Produkte hinzufügen
                        </button>
                    </div>
                )}
            </section>

            {/* 5. Expiring Soon Alert */}
            {expiringProducts.length > 0 && (
                <div className="card alert-card">
                    <h3>&#x26A0;&#xFE0F; Bald ablaufend</h3>
                    <div className="expiring-list">
                        {expiringProducts.map(p => {
                            const label = getExpiryLabel(p.ablauf);
                            const isExpired = label === 'abgelaufen';
                            return (
                                <div key={p.id} className="expiring-item">
                                    <ProductIcon productName={p.name} size="medium" />
                                    <span className="item-name">{p.name}</span>
                                    <span className={`item-date ${isExpired ? 'expired' : ''}`}>
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 6. Quick Shopping List */}
            {uncheckedItems.length > 0 && (
                <section className="shopping-quick-section">
                    <div className="shopping-quick-header">
                        <h3 className="section-title">Einkaufsliste</h3>
                        <button
                            className="shopping-quick-link"
                            onClick={() => window.location.hash = '#/einkauf'}
                        >
                            Alle anzeigen
                        </button>
                    </div>
                    <div className="shopping-quick-list">
                        {uncheckedItems.map(item => (
                            <label key={item.id} className="shopping-quick-item">
                                <input
                                    type="checkbox"
                                    checked={false}
                                    onChange={() => toggleShoppingItem(item)}
                                    className="shopping-quick-checkbox"
                                />
                                <span className="shopping-quick-name">{item.name}</span>
                                {item.menge && (
                                    <span className="shopping-quick-menge">{item.menge}</span>
                                )}
                            </label>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Uebersicht;
