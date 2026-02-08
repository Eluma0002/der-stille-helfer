import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { SAMPLE_RECIPES } from '../constants';

const RezepteListe = () => {
    const rezepte = useLiveQuery(() => db.base_rezepte.toArray());
    const [search, setSearch] = useState('');

    // Init sample recipes if empty
    useEffect(() => {
        const init = async () => {
            const count = await db.base_rezepte.count();
            if (count === 0) {
                await db.base_rezepte.bulkAdd(SAMPLE_RECIPES);
            }
        };
        init();
    }, []);

    const filtered = rezepte?.filter(r => r.name.toLowerCase().includes(search.toLowerCase())) || [];

    return (
        <div className="page">
            <h2>👨‍🍳 Rezepte</h2>
            <div className="card">
                <input
                    type="text"
                    placeholder="Suche..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: '10px', width: '90%' }}
                />
            </div>

            <div className="list">
                {filtered.map(r => (
                    <Link key={r.id} to={`/rezept/${r.id}`} className="card-link">
                        <div className="card">
                            <h3>{r.name}</h3>
                            <p><strong>Zutaten:</strong> {r.zutaten.map(z => z.name).join(', ')}</p>
                            <p className="recipe-meta">
                                {r.kategorie && <span>{r.kategorie}</span>}
                                {r.zeit && <span> · {r.zeit} Min.</span>}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RezepteListe;
