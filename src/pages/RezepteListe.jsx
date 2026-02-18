import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import { SAMPLE_RECIPES } from '../constants';
import { migrateRecipes } from '../utils/migrate-recipes';
import './RezepteListe.css';

const MEAL_CATEGORIES = [
    { id: 'all',         name: 'Alle',      icon: '🍽️' },
    { id: 'fruehstueck', name: 'Frühstück', icon: '🌅' },
    { id: 'mittag',      name: 'Mittag',    icon: '☀️' },
    { id: 'abend',       name: 'Abend',     icon: '🌙' },
    { id: 'snack',       name: 'Snacks',    icon: '🍿' },
    { id: 'salat',       name: 'Salat',     icon: '🥗' },
];

const MEAL_COLORS = {
    fruehstueck: '#FCD34D',
    mittag:      '#60A5FA',
    abend:       '#A78BFA',
    snack:       '#34D399',
    salat:       '#86EFAC',
    all:         '#F97316',
};

const RezepteListe = () => {
    const { activeUserId } = useUser();
    const [search, setSearch]         = useState('');
    const [mealFilter, setMealFilter] = useState('all');
    const [sourceTab, setSourceTab]   = useState('alle'); // 'alle' | 'eigene'

    const baseRezepte  = useLiveQuery(() => db.base_rezepte.toArray());
    const eigeneRezepte = useLiveQuery(
        () => activeUserId ? db.eigene_rezepte.where('person_id').equals(activeUserId).toArray() : [],
        [activeUserId]
    );

    useEffect(() => {
        const init = async () => {
            const count = await db.base_rezepte.count();
            if (count === 0) await db.base_rezepte.bulkAdd(SAMPLE_RECIPES);
            else await migrateRecipes();
        };
        init();
    }, []);

    const sourceRecipes = sourceTab === 'eigene'
        ? (eigeneRezepte || [])
        : (baseRezepte   || []);

    const filtered = sourceRecipes.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
        const matchesMeal   = mealFilter === 'all' || r.mahlzeit === mealFilter;
        return matchesSearch && matchesMeal;
    });

    const getMealCat   = (id) => MEAL_CATEGORIES.find(c => c.id === id);
    const getMealColor = (id) => MEAL_COLORS[id] ?? MEAL_COLORS.all;

    return (
        <div className="page rezepte-page">
            <h2>Rezepte</h2>

            {/* Quelle-Tabs */}
            <div className="source-tabs">
                <button
                    className={`source-tab ${sourceTab === 'alle' ? 'active' : ''}`}
                    onClick={() => setSourceTab('alle')}
                >
                    📚 Alle Rezepte
                    {baseRezepte && <span className="tab-count">{baseRezepte.length}</span>}
                </button>
                <button
                    className={`source-tab ${sourceTab === 'eigene' ? 'active' : ''}`}
                    onClick={() => setSourceTab('eigene')}
                >
                    ⭐ Meine Rezepte
                    {eigeneRezepte && eigeneRezepte.length > 0 && (
                        <span className="tab-count">{eigeneRezepte.length}</span>
                    )}
                </button>
            </div>

            {/* Suche */}
            <div className="rezepte-search">
                <input
                    type="text"
                    placeholder="Rezept suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Mahlzeit-Filter */}
            <div className="meal-filter-row">
                {MEAL_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setMealFilter(cat.id)}
                        className={`meal-chip ${mealFilter === cat.id ? 'active' : ''}`}
                    >
                        <span className="meal-chip-icon">{cat.icon}</span>
                        <span className="meal-chip-label">{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Meine Rezepte – Hinweis wenn leer */}
            {sourceTab === 'eigene' && (!eigeneRezepte || eigeneRezepte.length === 0) && (
                <div className="empty-state">
                    <p>⭐ Noch keine eigenen Rezepte</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Füge Rezepte im Notizen-Bereich hinzu.
                    </p>
                    <Link to="/notizen" className="btn primary" style={{ marginTop: 12 }}>
                        + Rezept hinzufügen
                    </Link>
                </div>
            )}

            {/* Rezept-Grid */}
            <div className="rezepte-grid">
                {filtered.map(r => {
                    const cat   = getMealCat(r.mahlzeit);
                    const color = getMealColor(r.mahlzeit);
                    return (
                        <Link key={r.id} to={`/rezept/${r.id}`} className="rezept-card-link">
                            <div className="rezept-card">
                                {/* Visueller Header */}
                                <div
                                    className="rezept-card-visual"
                                    style={{ background: `linear-gradient(135deg, ${color}bb, ${color}44)` }}
                                >
                                    <span className="rezept-card-icon">{cat?.icon ?? '🍽️'}</span>
                                </div>

                                <div className="rezept-card-content">
                                    <h3 className="rezept-card-title">{r.name}</h3>
                                    <p className="rezept-card-ingredients">
                                        {r.zutaten.slice(0, 3).map(z => z.name).join(', ')}
                                        {r.zutaten.length > 3 && ` +${r.zutaten.length - 3}`}
                                    </p>
                                    <div className="rezept-card-footer">
                                        {cat && <span className="rezept-tag">{cat.name}</span>}
                                        {r.zeit && <span className="rezept-time">⏱ {r.zeit} Min.</span>}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {filtered.length === 0 && sourceRecipes.length > 0 && (
                <div className="empty-state">
                    <p>Keine Rezepte für diesen Filter</p>
                </div>
            )}
        </div>
    );
};

export default RezepteListe;
