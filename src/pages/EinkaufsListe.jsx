import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';

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

    return (
        <div className="page">
            <h2>🛒 Einkaufsliste</h2>
            <div className="card">
                <input
                    type="text"
                    placeholder="Was fehlt?..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ padding: '10px', width: '70%' }}
                />
                <button onClick={addItem} className="btn-primary" style={{ width: '25%', marginLeft: '5%', padding: '10px' }}>Add</button>
            </div>

            <div className="list">
                {items?.map(item => (
                    <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', opacity: item.checked ? 0.5 : 1 }}>
                        <span onClick={() => db.einkaufsliste.update(item.id, { checked: !item.checked })} style={{ cursor: 'pointer', textDecoration: item.checked ? 'line-through' : 'none' }}>
                            {item.checked ? '✅' : '⬜'} {item.name}
                        </span>
                        <button onClick={() => db.einkaufsliste.delete(item.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>🗑️</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EinkaufListe;
