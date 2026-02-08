import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { SAMPLE_RECIPES } from '../constants';
import { migrateRecipes } from '../utils/migrate-recipes';

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

    // Init sample recipes if empty & migrate existing recipes
    useEffect(() => {
        const init = async () => {
            const count = await db.base_rezepte.count();
            if (count === 0) {
                await db.base_rezepte.bulkAdd(SAMPLE_RECIPES);
            } else {
                // Migrate existing recipes to add mahlzeit field
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
        <div className="page">
            <h2>👨‍🍳 Rezepte</h2>

            <div className="card">
                <input
                    type="text"
                    placeholder="Suche..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: '10px', width: '100%', marginBottom: '15px' }}
                />

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {MEAL_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setMealFilter(cat.id)}
                            className={`btn small ${mealFilter === cat.id ? 'primary' : 'secondary'}`}
                            style={{ flex: '1', minWidth: '80px' }}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="list">
                {filtered.map(r => {
                    const mealCat = MEAL_CATEGORIES.find(c => c.id === r.mahlzeit);
                    return (
                        <Link key={r.id} to={`/rezept/${r.id}`} className="card-link">
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <h3>{r.name}</h3>
                                    {mealCat && <span style={{ fontSize: '1.5rem' }}>{mealCat.icon}</span>}
                                </div>
                                <p><strong>Zutaten:</strong> {r.zutaten.map(z => z.name).join(', ')}</p>
                                <p className="recipe-meta">
                                    {mealCat && <span>{mealCat.name}</span>}
                                    {r.zeit && <span> · {r.zeit} Min.</span>}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default RezepteListe;
