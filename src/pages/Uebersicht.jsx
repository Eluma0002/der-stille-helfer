import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import bots from '../bots';
import { useUser } from '../context/UserContext';

const Uebersicht = () => {
    const { activeUser, activeUserId } = useUser();
    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );
    const [suggestion, setSuggestion] = useState(null);

    useEffect(() => {
        if (produkte) {
            const s = bots.planer.suggest(produkte);
            if (s) {
                setSuggestion({
                    reason: 'Dein Planer hat eine Idee:',
                    text: `Da du Hackfleisch im Inventar hast, wie wäre es mit ${s}?`
                });
            } else {
                setSuggestion(null);
            }
        }
    }, [produkte]);

    return (
        <div className="page fade-in">
            <h2>Guten Tag, {activeUser?.name}! {activeUser?.emoji}</h2>

            {suggestion && (
                <div className="card highlight-card" style={{ borderLeft: '5px solid #4CAF50' }}>
                    <h3>💡 Bot-Vorschlag</h3>
                    <p><strong>{suggestion.reason}</strong></p>
                    <p>{suggestion.text}</p>
                </div>
            )}

            <div className="card">
                <h3>Vorrats-Status</h3>
                <p>Du hast aktuell <strong>{produkte?.length || 0}</strong> Produkte im Inventar.</p>
                <button className="btn-primary" onClick={() => window.location.hash = '#/produkte'}>Zum Inventar</button>
            </div>

            <div className="card">
                <h3>Was kochst du heute?</h3>
                <p>Entdecke Rezepte passend zu deinem Vorrat.</p>
                <button className="btn-primary" onClick={() => window.location.hash = '#/rezepte'}>Rezepte suchen</button>
            </div>
        </div>
    );
};

export default Uebersicht;
