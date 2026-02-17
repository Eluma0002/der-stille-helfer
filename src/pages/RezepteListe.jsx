import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { SAMPLE_RECIPES } from '../constants';
import { migrateRecipes } from '../utils/migrate-recipes';
import './RezepteListe.css';

const MEAL_CATEGORIES = [
    { id: 'all', name: 'Alle', icon: '🍽️' },
    { id: 'fruehstueck', name: 'Frühstück', icon: '🌅' },
    { id: 'mittag', name: 'Mittag', icon: '☀️' },
    { id: 'abend', name: 'Abend', icon: '🌙' },
    { id: 'snack', name: 'Snacks', icon: '🍿' }
];

const RezepteListe = () => {
    const rezepte = useLiveQuery(() => db.base_rezepte.toArray());
    const [search, setSearch] = useState('');
    const [mealFilter, setMealFilter] = useState('all');

    useEffect(() => {
        const init = async () => {
            const count = await db.base_rezepte.count();
            if (count === 0) {
                await db.base_rezepte.bulkAdd(SAMPLE_RECIPES);
            } else {
                await migrateRecipes();
            }
        };
        init();
    }, []);

    const filtered = rezepte?.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
        const matchesMeal = mealFilter === 'all' || r.mahlzeit === mealFilter;
        return matchesSearch && matchesMeal;
    }) || [];

    return (
        <div className="page rezepte-page">
            <h2>Rezepte</h2>

            <div className="rezepte-search">
                <input
                    type="text"
                    placeholder="Rezept suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
            </div>

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

            <div className="rezepte-grid">
                {filtered.map(r => {
                    const mealCat = MEAL_CATEGORIES.find(c => c.id === r.mahlzeit);
                    return (
                        <Link key={r.id} to={`/rezept/${r.id}`} className="rezept-card-link">
                            <div className="rezept-card">
                                <div className="rezept-card-icon">
                                    {mealCat ? mealCat.icon : '🍽️'}
                                </div>
                                <h3 className="rezept-card-title">{r.name}</h3>
                                <p className="rezept-card-ingredients">
                                    {r.zutaten.slice(0, 3).map(z => z.name).join(', ')}
                                    {r.zutaten.length > 3 && ` +${r.zutaten.length - 3}`}
                                </p>
                                <div className="rezept-card-footer">
                                    {mealCat && <span className="rezept-tag">{mealCat.name}</span>}
                                    {r.zeit && <span className="rezept-time">{r.zeit} Min.</span>}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="empty-state">
                    <p>Keine Rezepte gefunden</p>
                    <p>Probiere einen anderen Suchbegriff.</p>
                </div>
            )}
        </div>
    );
};

export default RezepteListe;
