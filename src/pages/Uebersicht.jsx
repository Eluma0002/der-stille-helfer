import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import ProductIcon from '../components/ProductIcon';
import { DEFAULT_CATEGORIES, MEAL_CATEGORIES } from '../constants';
import './Uebersicht.css';

const MEAL_COLORS = {
    fruehstueck: '#FCD34D',
    mittag:      '#60A5FA',
    abend:       '#A78BFA',
    snack:       '#34D399',
    salat:       '#86EFAC',
};

// Häufige Produkte kommen zuerst
const COMMON_PRODUCTS = [
    'milch', 'butter', 'eier', 'ei', 'joghurt', 'käse', 'quark', 'sahne',
    'rahm', 'frischkäse', 'mozzarella',
    'brot', 'toast', 'brötchen',
    'apfel', 'banane', 'orange', 'traube', 'erdbeere',
    'kartoffel', 'tomate', 'gurke', 'zwiebel', 'karotte', 'paprika',
    'nudeln', 'pasta', 'reis', 'mehl', 'zucker', 'salz', 'öl',
    'wasser', 'saft', 'kaffee', 'tee',
    'fleisch', 'huhn', 'hühnchen', 'hack', 'wurst', 'schinken', 'lachs',
    'schokolade', 'marmelade', 'honig',
];

const getProductPriority = (name) => {
    const lower = name.toLowerCase();
    const idx = COMMON_PRODUCTS.findIndex(p => lower.includes(p));
    return idx === -1 ? COMMON_PRODUCTS.length : idx;
};

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

    // --- Products grouped by storage location (sorted by familiarity) ---
    const groupedProducts = useMemo(() => {
        if (!produkte) return {};

        const groups = {};
        DEFAULT_CATEGORIES.forEach(cat => { groups[cat.id] = []; });

        produkte.forEach(p => {
            const location = p.ort || p.kategorie || 'vorrat';
            if (groups[location]) groups[location].push(p);
            else groups['vorrat'].push(p);
        });

        // Häufige Produkte zuerst, dann nach Ablaufdatum
        DEFAULT_CATEGORIES.forEach(cat => {
            groups[cat.id].sort((a, b) => {
                const pDiff = getProductPriority(a.name) - getProductPriority(b.name);
                if (pDiff !== 0) return pDiff;
                return new Date(a.ablauf) - new Date(b.ablauf);
            });
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
        return `/rezept/${recipe.id}`;
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
                    {mealSuggestions.map(meal => {
                        const color = MEAL_COLORS[meal.id] || '#F97316';
                        return (
                            <div
                                key={meal.id}
                                className="meal-suggestion-card"
                                style={{ '--meal-color': color }}
                            >
                                <div
                                    className="meal-card-visual"
                                    style={{ background: `linear-gradient(135deg, ${color}cc, ${color}44)` }}
                                >
                                    <span className="meal-icon">{meal.icon}</span>
                                </div>
                                <div className="meal-card-content">
                                    <span className="meal-label">{meal.name}</span>
                                    {meal.recipe ? (
                                        <Link to={getRecipeLink(meal.recipe)} className="meal-card-body">
                                            <span className="meal-recipe-name">{meal.recipe.name}</span>
                                            <span className="meal-recipe-time">⏱ {meal.recipe.zeit} Min.</span>
                                        </Link>
                                    ) : (
                                        <div className="meal-card-body meal-empty">
                                            <span className="meal-recipe-name">Kein Rezept</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3. Quick Actions – Fernbedienung (2-Spalten, 8 Buttons) */}
            <div className="quick-actions">
                <button className="action-btn" onClick={() => window.location.hash = '#/koch-assistent'}>
                    <span className="action-icon">🍳</span>
                    <span className="action-label">Koch-AI</span>
                </button>
                <button className="action-btn" onClick={() => window.location.hash = '#/produkte'}>
                    <span className="action-icon">🧊</span>
                    <span className="action-label">Inventar</span>
                </button>
                <button className="action-btn" onClick={() => window.location.hash = '#/rezepte'}>
                    <span className="action-icon">📖</span>
                    <span className="action-label">Rezepte</span>
                </button>
                <button className="action-btn" onClick={() => window.location.hash = '#/einkauf'}>
                    <span className="action-icon">🛒</span>
                    <span className="action-label">Einkauf</span>
                </button>
                <button className="action-btn" onClick={() => window.location.hash = '#/wochenplan'}>
                    <span className="action-icon">📅</span>
                    <span className="action-label">Wochenplan</span>
                </button>
                <button className="action-btn" onClick={() => window.location.hash = '#/produkte'}>
                    <span className="action-icon">➕</span>
                    <span className="action-label">Eintragen</span>
                </button>
                <button className="action-btn" onClick={() => window.location.hash = '#/unterwegs'}>
                    <span className="action-icon">🚶</span>
                    <span className="action-label">Unterwegs</span>
                </button>
                <button className="action-btn" onClick={() => window.location.hash = '#/teilen'}>
                    <span className="action-icon">🤝</span>
                    <span className="action-label">Teilen</span>
                </button>
            </div>

            {/* 4. Expiring Soon Alert – VOR Dein Vorrat */}
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

            {/* 5. Vorrat-Überblick – kompaktes Grid */}
            <section className="storage-section">
                <div className="storage-section-header">
                    <h3 className="section-title">Dein Vorrat</h3>
                    <Link to="/produkte" className="storage-see-all">Verwalten →</Link>
                </div>
                {DEFAULT_CATEGORIES.map(cat => {
                    const items = groupedProducts[cat.id] || [];
                    if (items.length === 0) return null;
                    return (
                        <div
                            key={cat.id}
                            className="storage-group"
                            style={{ borderLeftColor: cat.color, background: `${cat.color}0a` }}
                        >
                            <div className="storage-group-header">
                                <span className="storage-group-badge" style={{ backgroundColor: cat.color }}>
                                    {cat.icon}
                                </span>
                                <span className="storage-group-name">{cat.name}</span>
                                <span className="storage-group-count" style={{ background: `${cat.color}22`, color: cat.color }}>
                                    {items.length}
                                </span>
                            </div>
                            <div className="storage-items-grid">
                                {items.map(p => (
                                    <Link key={p.id} to="/produkte" className="storage-item">
                                        <ProductIcon productName={p.name} size="medium" />
                                        <span className="storage-item-name">{p.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {produkte && produkte.length === 0 && (
                    <div className="fridge-empty">
                        <p>Noch keine Produkte vorhanden</p>
                        <Link to="/produkte" className="btn secondary small">
                            Produkte hinzufügen
                        </Link>
                    </div>
                )}
            </section>

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
