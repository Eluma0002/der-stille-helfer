import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import { DEFAULT_CATEGORIES } from '../constants';
import './EinkaufsListe.css';

const DEFAULT_DAYS = 7;

const guessCategory = (name) => {
    const l = name.toLowerCase();
    if (/milch|butter|käse|joghurt|sahne|quark|ei |eier|schinken|wurst|speck|lachs|fleisch|hack|aufschnitt|feta|mozzarella|frischkäse/.test(l)) return 'kuehlschrank';
    if (/tiefkühl|eis |pizza frozen/.test(l)) return 'gefrierschrank';
    if (/apfel|banane|orange|beere|traube|obst|zitrone|mango|erdbeere/.test(l)) return 'fruechte';
    if (/salat|tomate|paprika|gurke|karotte|möhre|zucchini|spinat|sellerie|gemüse|zwiebel|knoblauch|brokkoli|blumenkohl/.test(l)) return 'gemuese';
    if (/wasser|saft|cola|kaffee|tee|getränk|bier|wein|limo/.test(l)) return 'getraenke';
    if (/salz|pfeffer|gewürz|kräuter|zimt|curry|paprikapulver|oregano|basilikum|kurkuma/.test(l)) return 'gewuerze';
    return 'vorrat';
};

const defaultAblauf = () => {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_DAYS);
    return d.toISOString().slice(0, 10);
};

const EinkaufListe = () => {
    const { activeUserId } = useUser();
    const items = useLiveQuery(
        () => db.einkaufsliste.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );
    const [name, setName] = useState('');

    // Ins-Inventar-Modal
    const [toInventory, setToInventory] = useState(null); // { item, kat, ablauf }

    const openInventoryModal = (item) => {
        setToInventory({ item, kat: guessCategory(item.name), ablauf: defaultAblauf() });
    };

    const confirmAddToInventory = async () => {
        if (!toInventory) return;
        await db.produkte.add({
            id: `inv-${Date.now()}`,
            person_id: activeUserId,
            name: toInventory.item.name,
            kategorie: toInventory.kat,
            ort: toInventory.kat,
            ablauf: new Date(toInventory.ablauf).toISOString()
        });
        await db.einkaufsliste.delete(toInventory.item.id);
        setToInventory(null);
    };

    const addAllToInventory = async () => {
        for (const item of checkedItems) {
            await db.produkte.add({
                id: `inv-${Date.now()}-${item.id}`,
                person_id: activeUserId,
                name: item.name,
                kategorie: guessCategory(item.name),
                ort: guessCategory(item.name),
                ablauf: new Date(Date.now() + DEFAULT_DAYS * 86400000).toISOString()
            });
            await db.einkaufsliste.delete(item.id);
        }
    };

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
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn small secondary" onClick={addAllToInventory} title="Alle ins Inventar">
                                📦 Alle ins Inventar
                            </button>
                            <button className="btn small secondary" onClick={clearChecked}>
                                🗑 Entfernen
                            </button>
                        </div>
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
                                    className="einkauf-inv-btn"
                                    onClick={() => openInventoryModal(item)}
                                    title="Ins Inventar"
                                >📦</button>
                                <button
                                    className="einkauf-delete"
                                    onClick={() => db.einkaufsliste.delete(item.id)}
                                >&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ins-Inventar-Modal */}
            {toInventory && (
                <div className="inv-modal-overlay" onClick={() => setToInventory(null)}>
                    <div className="inv-modal" onClick={e => e.stopPropagation()}>
                        <h3>📦 Ins Inventar</h3>
                        <p className="inv-modal-name">„{toInventory.item.name}"</p>
                        <div className="form-group">
                            <label>Kategorie</label>
                            <select
                                value={toInventory.kat}
                                onChange={e => setToInventory(s => ({ ...s, kat: e.target.value }))}
                            >
                                {DEFAULT_CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ablaufdatum</label>
                            <input
                                type="date"
                                value={toInventory.ablauf}
                                onChange={e => setToInventory(s => ({ ...s, ablauf: e.target.value }))}
                            />
                        </div>
                        <div className="inv-modal-actions">
                            <button className="btn secondary" onClick={() => setToInventory(null)}>Abbrechen</button>
                            <button className="btn primary" onClick={confirmAddToInventory}>✓ Hinzufügen</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EinkaufListe;
