import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import './EinkaufsListe.css';

const EinkaufListe = () => {
    const { activeUserId } = useUser();
    const items = useLiveQuery(
        () => db.einkaufsliste.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );
    const [name, setName] = useState('');

    const addItem = async () => {
        if (!name) return;
        await db.einkaufsliste.add({
            id: Date.now().toString(),
            person_id: activeUserId,
            name,
            checked: false,
            created_at: Date.now()
        });
        setName('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') addItem();
    };

    const uncheckedItems = items?.filter(i => !i.checked) || [];
    const checkedItems = items?.filter(i => i.checked) || [];

    const clearChecked = async () => {
        if (checkedItems.length === 0) return;
        for (const item of checkedItems) {
            await db.einkaufsliste.delete(item.id);
        }
    };

    return (
        <div className="page einkauf-page">
            <h2>Einkaufsliste</h2>

            <div className="einkauf-input-row">
                <input
                    type="text"
                    placeholder="Was fehlt?..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="einkauf-input"
                />
                <button onClick={addItem} className="btn einkauf-add-btn">+</button>
            </div>

            {uncheckedItems.length === 0 && checkedItems.length === 0 && (
                <div className="empty-state">
                    <p>Alles eingekauft!</p>
                    <p>Deine Einkaufsliste ist leer.</p>
                </div>
            )}

            <div className="einkauf-list">
                {uncheckedItems.map(item => (
                    <div key={item.id} className="einkauf-item">
                        <button
                            className="einkauf-check"
                            onClick={() => db.einkaufsliste.update(item.id, { checked: true })}
                        >
                            <span className="check-circle"></span>
                        </button>
                        <span className="einkauf-name">{item.name}</span>
                        <button
                            className="einkauf-delete"
                            onClick={() => db.einkaufsliste.delete(item.id)}
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>

            {checkedItems.length > 0 && (
                <div className="einkauf-checked-section">
                    <div className="checked-header">
                        <span className="checked-title">Erledigt ({checkedItems.length})</span>
                        <button className="btn small secondary" onClick={clearChecked}>
                            Alle entfernen
                        </button>
                    </div>
                    <div className="einkauf-list">
                        {checkedItems.map(item => (
                            <div key={item.id} className="einkauf-item checked">
                                <button
                                    className="einkauf-check"
                                    onClick={() => db.einkaufsliste.update(item.id, { checked: false })}
                                >
                                    <span className="check-circle checked"></span>
                                </button>
                                <span className="einkauf-name">{item.name}</span>
                                <button
                                    className="einkauf-delete"
                                    onClick={() => db.einkaufsliste.delete(item.id)}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EinkaufListe;
