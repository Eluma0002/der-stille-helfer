import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import './TeilenSeite.css';

const STORAGE_KEY = 'teilen_items_v2';

const ART_OPTIONS = [
    { value: 'Lebensmittel',    label: '🥕 Lebensmittel' },
    { value: 'Fertiges Gericht',label: '🍲 Fertiges Gericht' },
    { value: 'Reste',           label: '🥡 Reste' },
    { value: 'Getränk',         label: '🥤 Getränk' },
];

const BEHAELTER_OPTIONS = [
    { value: 'Keiner',                       label: 'Kein Behälter' },
    { value: 'Eigener Behälter mitbringen',   label: '🎒 Eigenen Behälter mitbringen' },
    { value: 'Tupper wird mitgegeben',        label: '📦 Tupper / Dose (wird zurückgebracht)' },
    { value: 'Glas',                          label: '🫙 Glas (wird zurückgebracht)' },
];

const BEHAELTER_NEEDS_RETURN = ['Tupper wird mitgegeben', 'Glas'];

const ART_ICONS = {
    'Lebensmittel':    '🥕',
    'Fertiges Gericht':'🍲',
    'Reste':           '🥡',
    'Getränk':         '🥤',
};

const STATUS_LABELS = {
    verfuegbar: '✓ Verfügbar',
    reserviert: '⏳ Reserviert',
    abgeholt:   '✅ Abgeholt',
};

const STATUS_NEXT = {
    verfuegbar: 'reserviert',
    reserviert: 'abgeholt',
};

const STATUS_NEXT_LABEL = {
    verfuegbar: '🤝 Als reserviert markieren',
    reserviert: '✅ Als abgeholt markieren',
};

function getExpiryText(dateStr) {
    if (!dateStr) return '';
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr); exp.setHours(0, 0, 0, 0);
    const d = Math.round((exp - now) / 86400000);
    if (d < 0)  return `Vor ${Math.abs(d)} Tag(en) abgelaufen`;
    if (d === 0) return 'Läuft heute ab';
    if (d === 1) return 'Läuft morgen ab';
    return `Noch ${d} Tage haltbar`;
}

function getExpiryClass(dateStr) {
    if (!dateStr) return '';
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr); exp.setHours(0, 0, 0, 0);
    const d = Math.round((exp - now) / 86400000);
    if (d < 0)  return 'expired';
    if (d <= 1) return 'expiring-soon';
    if (d <= 3) return 'expiring-warning';
    return 'expiring-ok';
}

const emptyForm = {
    name: '', art: 'Lebensmittel', menge: '',
    haltbar_bis: '', ort: '', behaelter: 'Keiner', notizen: ''
};

const TeilenSeite = () => {
    const { activeUserId } = useUser();

    const [items, setItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]         = useState({ ...emptyForm });

    // Bald ablaufende Produkte aus dem Inventar (≤ 3 Tage)
    const expiringProdukte = useLiveQuery(async () => {
        if (!activeUserId) return [];
        const all = await db.produkte.where('person_id').equals(activeUserId).toArray();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + 3);
        return all
            .filter(p => new Date(p.ablauf) <= cutoff)
            .sort((a, b) => new Date(a.ablauf) - new Date(b.ablauf));
    }, [activeUserId]);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
        catch { /* ignore */ }
    }, [items]);

    const handleChange = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const prefillFromInventar = (produkt) => {
        const ablaufDate = produkt.ablauf
            ? new Date(produkt.ablauf).toISOString().split('T')[0]
            : '';
        setForm({
            ...emptyForm,
            name: produkt.name,
            haltbar_bis: ablaufDate,
            art: 'Lebensmittel',
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.menge.trim()) return;
        setItems(prev => [{
            id: Date.now(),
            person_id: activeUserId,
            name: form.name.trim(),
            art: form.art,
            menge: form.menge.trim(),
            haltbar_bis: form.haltbar_bis,
            ort: form.ort.trim(),
            behaelter: form.behaelter,
            notizen: form.notizen.trim(),
            status: 'verfuegbar',
            behaelter_zurueck: false,
            created_at: new Date().toISOString()
        }, ...prev]);
        setForm({ ...emptyForm });
        setShowForm(false);
    };

    const advanceStatus = (id) =>
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const next = STATUS_NEXT[item.status];
            return next ? { ...item, status: next } : item;
        }));

    const confirmBehaelterReturn = (id) =>
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, behaelter_zurueck: true } : item
        ));

    const withdrawItem = (id) =>
        setItems(prev => prev.filter(item => item.id !== id));

    const activeItems    = items.filter(i => i.status !== 'abgeholt');
    const completedItems = items.filter(i => i.status === 'abgeholt');

    const needsReturn = (item) =>
        item.status === 'abgeholt' &&
        BEHAELTER_NEEDS_RETURN.includes(item.behaelter) &&
        !item.behaelter_zurueck;

    return (
        <div className="teilen-page">

            {/* ── Header ──────────────────────────────── */}
            <div className="teilen-header">
                <h2>🤝 Teilen statt Wegwerfen</h2>
                <p className="teilen-subtitle">Lebensmittel retten · Nachbarn helfen</p>
                <div className="teilen-privacy-hint">
                    🔒 Kein Pflichtfeld für Adresse – nutze einen neutralen Übergabeort wie den Briefkasten
                </div>
            </div>

            {/* ── Anbieten-Button ──────────────────────── */}
            <button
                className="teilen-anbieten-btn"
                onClick={() => setShowForm(!showForm)}
            >
                {showForm ? '✕ Schliessen' : '+ Etwas anbieten'}
            </button>

            {/* ── Formular ─────────────────────────────── */}
            {showForm && (
                <form className="teilen-form card" onSubmit={handleSubmit}>
                    <h3 className="form-title">Was möchtest du teilen?</h3>

                    <div className="teilen-form-row">
                        <div className="teilen-form-field">
                            <label>Was?*</label>
                            <input
                                type="text"
                                placeholder="Produkt oder Gericht"
                                value={form.name}
                                onChange={e => handleChange('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="teilen-form-field">
                            <label>Menge*</label>
                            <input
                                type="text"
                                placeholder="z.B. 500g, 2 Stück"
                                value={form.menge}
                                onChange={e => handleChange('menge', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="teilen-form-field">
                        <label>Art</label>
                        <div className="art-buttons">
                            {ART_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`art-btn ${form.art === opt.value ? 'active' : ''}`}
                                    onClick={() => handleChange('art', opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="teilen-form-row">
                        <div className="teilen-form-field">
                            <label>Haltbar bis</label>
                            <input
                                type="date"
                                value={form.haltbar_bis}
                                onChange={e => handleChange('haltbar_bis', e.target.value)}
                            />
                        </div>
                        <div className="teilen-form-field">
                            <label>Übergabeort</label>
                            <input
                                type="text"
                                placeholder="z.B. Briefkasten, Haustür"
                                value={form.ort}
                                onChange={e => handleChange('ort', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="teilen-form-field">
                        <label>Behälter</label>
                        <select
                            value={form.behaelter}
                            onChange={e => handleChange('behaelter', e.target.value)}
                        >
                            {BEHAELTER_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {BEHAELTER_NEEDS_RETURN.includes(form.behaelter) && (
                            <p className="behaelter-hint">
                                ♻️ Der Behälter wird nach Gebrauch gereinigt zurückgebracht – du bestätigst die Rückgabe.
                            </p>
                        )}
                    </div>

                    <div className="teilen-form-field">
                        <label>Notizen (optional)</label>
                        <textarea
                            placeholder="Allergene, Zutaten, Hinweise..."
                            value={form.notizen}
                            onChange={e => handleChange('notizen', e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="teilen-form-actions">
                        <button type="button" className="teilen-btn-cancel"
                            onClick={() => { setForm({ ...emptyForm }); setShowForm(false); }}>
                            Abbrechen
                        </button>
                        <button type="submit" className="teilen-btn-submit">
                            🤝 Anbieten
                        </button>
                    </div>
                </form>
            )}

            {/* ── Bald ablaufend aus Inventar ──────────── */}
            {expiringProdukte && expiringProdukte.length > 0 && (
                <div className="ablaufend-section">
                    <h3 className="ablaufend-title">⏰ Bald ablaufend – jetzt teilen?</h3>
                    <div className="ablaufend-scroll">
                        {expiringProdukte.map(p => {
                            const cls = getExpiryClass(p.ablauf);
                            return (
                                <div key={p.id} className={`ablaufend-card ${cls}`}>
                                    <span className="ablaufend-name">{p.name}</span>
                                    <span className="ablaufend-date">{getExpiryText(p.ablauf)}</span>
                                    <button
                                        className="ablaufend-share-btn"
                                        onClick={() => prefillFromInventar(p)}
                                    >
                                        Teilen
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Leerer Zustand ───────────────────────── */}
            {activeItems.length === 0 && completedItems.length === 0 && !showForm && (
                <div className="teilen-empty">
                    <span className="teilen-empty-icon">🫶</span>
                    <h3>Noch keine Angebote</h3>
                    <p>Hast du Lebensmittel, die du nicht mehr schaffst?<br />
                       Biete sie an – statt sie wegzuwerfen!</p>
                </div>
            )}

            {/* ── Aktive Angebote ──────────────────────── */}
            {activeItems.length > 0 && (
                <div className="teilen-list">
                    <h3 className="teilen-list-title">Aktive Angebote ({activeItems.length})</h3>
                    {activeItems.map(item => (
                        <div key={item.id} className={`teilen-card teilen-card--${item.status}`}>
                            <div className="teilen-card-header">
                                <span className="teilen-card-icon">
                                    {ART_ICONS[item.art] ?? '📦'}
                                </span>
                                <div className="teilen-card-title-block">
                                    <span className="teilen-card-name">{item.name}</span>
                                    <span className="teilen-card-menge">{item.menge}</span>
                                </div>
                                <span className={`teilen-badge teilen-badge--${item.status}`}>
                                    {STATUS_LABELS[item.status]}
                                </span>
                            </div>

                            <div className="teilen-card-tags">
                                <span className="teilen-tag art-tag">{item.art}</span>
                                {item.behaelter && item.behaelter !== 'Keiner' && (
                                    <span className="teilen-tag behaelter-tag">📦 {item.behaelter}</span>
                                )}
                            </div>

                            {item.haltbar_bis && (
                                <div className={`teilen-card-expiry ${getExpiryClass(item.haltbar_bis)}`}>
                                    <span>📅 {new Date(item.haltbar_bis).toLocaleDateString('de-DE')}</span>
                                    <span className="teilen-expiry-text">{getExpiryText(item.haltbar_bis)}</span>
                                </div>
                            )}

                            {item.ort && (
                                <div className="teilen-card-ort">📍 {item.ort}</div>
                            )}
                            {item.notizen && (
                                <div className="teilen-card-notizen">💬 {item.notizen}</div>
                            )}

                            {/* Status-Fortschritt */}
                            <div className="status-steps">
                                {['verfuegbar', 'reserviert', 'abgeholt'].map((s, i) => (
                                    <div key={s} className={`status-step ${
                                        item.status === s ? 'active' :
                                        ['verfuegbar', 'reserviert', 'abgeholt'].indexOf(item.status) > i ? 'done' : ''
                                    }`}>
                                        <div className="status-dot" />
                                        <span>{s === 'verfuegbar' ? 'Verfügbar' : s === 'reserviert' ? 'Reserviert' : 'Abgeholt'}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="teilen-card-actions">
                                {STATUS_NEXT[item.status] && (
                                    <button className="teilen-btn-action" onClick={() => advanceStatus(item.id)}>
                                        {STATUS_NEXT_LABEL[item.status]}
                                    </button>
                                )}
                                <button className="teilen-btn-withdraw" onClick={() => withdrawItem(item.id)}>
                                    Zurückziehen
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Abgeholt / Behälter-Rückgabe ─────────── */}
            {completedItems.length > 0 && (
                <div className="teilen-list">
                    <h3 className="teilen-list-title">Abgeholt</h3>
                    {completedItems.map(item => (
                        <div key={item.id} className="teilen-card teilen-card--abgeholt">
                            <div className="teilen-card-header">
                                <span className="teilen-card-icon">{ART_ICONS[item.art] ?? '📦'}</span>
                                <div className="teilen-card-title-block">
                                    <span className="teilen-card-name">{item.name}</span>
                                    <span className="teilen-card-menge">{item.menge}</span>
                                </div>
                                <span className="teilen-badge teilen-badge--abgeholt">✅ Abgeholt</span>
                            </div>

                            {/* Behälter-Rückgabe */}
                            {needsReturn(item) && (
                                <div className="behaelter-return-box">
                                    <span>📦 Behälter noch nicht zurück</span>
                                    <button
                                        className="teilen-btn-return"
                                        onClick={() => confirmBehaelterReturn(item.id)}
                                    >
                                        ✓ Zurückgebracht
                                    </button>
                                </div>
                            )}
                            {item.behaelter_zurueck && (
                                <div className="behaelter-return-done">
                                    ♻️ Behälter zurückgebracht – danke!
                                </div>
                            )}

                            <button className="teilen-btn-withdraw" style={{ marginTop: 10 }}
                                onClick={() => withdrawItem(item.id)}>
                                Archivieren
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeilenSeite;
