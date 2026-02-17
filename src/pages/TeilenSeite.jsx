import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import './TeilenSeite.css';

const STORAGE_KEY = 'teilen_items';

const ART_OPTIONS = ['Lebensmittel', 'Fertiges Gericht', 'Reste', 'Getränk'];
const BEHAELTER_OPTIONS = ['Keiner', 'Eigener Behälter mitbringen', 'Tupper wird mitgegeben', 'Glas'];

const STATUS_LABELS = {
    verfuegbar: 'Verfügbar',
    reserviert: 'Reserviert',
    abgeholt: 'Abgeholt'
};

const STATUS_NEXT = {
    verfuegbar: 'reserviert',
    reserviert: 'abgeholt'
};

function getExpiryText(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffMs = expiry - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Vor ${Math.abs(diffDays)} Tag${Math.abs(diffDays) !== 1 ? 'en' : ''} abgelaufen`;
    if (diffDays === 0) return 'Läuft heute ab';
    if (diffDays === 1) return 'Läuft morgen ab';
    if (diffDays <= 3) return `Noch ${diffDays} Tage`;
    return `Noch ${diffDays} Tage haltbar`;
}

function getExpiryClass(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 1) return 'expiring-soon';
    if (diffDays <= 3) return 'expiring-warning';
    return 'expiring-ok';
}

const emptyForm = {
    name: '',
    art: 'Lebensmittel',
    menge: '',
    haltbar_bis: '',
    ort: '',
    behaelter: 'Keiner',
    notizen: ''
};

const TeilenSeite = () => {
    const { activeUserId } = useUser();
    const [items, setItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...emptyForm });

    // Persist to localStorage on every change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.warn('Could not save teilen items to localStorage', e);
        }
    }, [items]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.menge.trim()) return;

        const newItem = {
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
            created_at: new Date().toISOString()
        };

        setItems(prev => [newItem, ...prev]);
        setForm({ ...emptyForm });
        setShowForm(false);
    };

    const handleCancel = () => {
        setForm({ ...emptyForm });
        setShowForm(false);
    };

    const advanceStatus = (id) => {
        setItems(prev =>
            prev.map(item => {
                if (item.id !== id) return item;
                const next = STATUS_NEXT[item.status];
                return next ? { ...item, status: next } : item;
            })
        );
    };

    const withdrawItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    // Show items for all users (community sharing), sorted by creation date
    const activeItems = items.filter(item => item.status !== 'abgeholt');
    const completedItems = items.filter(item => item.status === 'abgeholt');

    return (
        <div className="teilen-page">
            <div className="teilen-header">
                <h2>Teilen statt Wegwerfen</h2>
                <p className="teilen-subtitle">Lebensmittel retten, Nachbarn helfen</p>
            </div>

            <button
                className="teilen-anbieten-btn"
                onClick={() => setShowForm(!showForm)}
            >
                {showForm ? '✕ Schließen' : '🤝 Anbieten'}
            </button>

            {showForm && (
                <form className="teilen-form" onSubmit={handleSubmit}>
                    <div className="teilen-form-field">
                        <label htmlFor="teilen-name">Was?</label>
                        <input
                            id="teilen-name"
                            type="text"
                            placeholder="Produkt oder Gericht"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                        />
                    </div>

                    <div className="teilen-form-field">
                        <label htmlFor="teilen-art">Art</label>
                        <select
                            id="teilen-art"
                            value={form.art}
                            onChange={(e) => handleChange('art', e.target.value)}
                        >
                            {ART_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    <div className="teilen-form-field">
                        <label htmlFor="teilen-menge">Menge</label>
                        <input
                            id="teilen-menge"
                            type="text"
                            placeholder="z.B. 500g, 1 Portion"
                            value={form.menge}
                            onChange={(e) => handleChange('menge', e.target.value)}
                            required
                        />
                    </div>

                    <div className="teilen-form-field">
                        <label htmlFor="teilen-haltbar">Haltbar bis</label>
                        <input
                            id="teilen-haltbar"
                            type="date"
                            value={form.haltbar_bis}
                            onChange={(e) => handleChange('haltbar_bis', e.target.value)}
                        />
                    </div>

                    <div className="teilen-form-field">
                        <label htmlFor="teilen-ort">Übergabeort</label>
                        <input
                            id="teilen-ort"
                            type="text"
                            placeholder="z.B. Vor der Haustür, Briefkasten"
                            value={form.ort}
                            onChange={(e) => handleChange('ort', e.target.value)}
                        />
                    </div>

                    <div className="teilen-form-field">
                        <label htmlFor="teilen-behaelter">Behälter</label>
                        <select
                            id="teilen-behaelter"
                            value={form.behaelter}
                            onChange={(e) => handleChange('behaelter', e.target.value)}
                        >
                            {BEHAELTER_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    <div className="teilen-form-field">
                        <label htmlFor="teilen-notizen">Notizen (optional)</label>
                        <textarea
                            id="teilen-notizen"
                            placeholder="Zusätzliche Hinweise..."
                            value={form.notizen}
                            onChange={(e) => handleChange('notizen', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="teilen-form-actions">
                        <button type="button" className="teilen-btn-cancel" onClick={handleCancel}>
                            Abbrechen
                        </button>
                        <button type="submit" className="teilen-btn-submit">
                            Anbieten
                        </button>
                    </div>
                </form>
            )}

            {activeItems.length === 0 && completedItems.length === 0 && !showForm && (
                <div className="teilen-empty">
                    <span className="teilen-empty-icon">🫶</span>
                    <h3>Noch keine Angebote</h3>
                    <p>
                        Hast du Lebensmittel, die du nicht mehr schaffst?
                        Biete sie deinen Nachbarn an, statt sie wegzuwerfen!
                    </p>
                </div>
            )}

            {activeItems.length > 0 && (
                <div className="teilen-list">
                    <h3 className="teilen-list-title">Aktive Angebote</h3>
                    {activeItems.map(item => (
                        <div key={item.id} className={`teilen-card teilen-card--${item.status}`}>
                            <div className="teilen-card-header">
                                <span className="teilen-card-name">{item.name}</span>
                                <span className={`teilen-badge teilen-badge--${item.status}`}>
                                    {STATUS_LABELS[item.status]}
                                </span>
                            </div>

                            <div className="teilen-card-details">
                                <span className="teilen-card-art">{item.art}</span>
                                <span className="teilen-card-menge">{item.menge}</span>
                            </div>

                            {item.haltbar_bis && (
                                <div className={`teilen-card-expiry ${getExpiryClass(item.haltbar_bis)}`}>
                                    📅 Haltbar bis: {new Date(item.haltbar_bis).toLocaleDateString('de-DE')}
                                    <span className="teilen-expiry-text">{getExpiryText(item.haltbar_bis)}</span>
                                </div>
                            )}

                            {item.ort && (
                                <div className="teilen-card-ort">
                                    📍 {item.ort}
                                </div>
                            )}

                            {item.behaelter && item.behaelter !== 'Keiner' && (
                                <div className="teilen-card-behaelter">
                                    📦 {item.behaelter}
                                </div>
                            )}

                            {item.notizen && (
                                <div className="teilen-card-notizen">
                                    💬 {item.notizen}
                                </div>
                            )}

                            <div className="teilen-card-actions">
                                {item.status !== 'abgeholt' && (
                                    <button
                                        className="teilen-btn-action"
                                        onClick={() => advanceStatus(item.id)}
                                    >
                                        {item.status === 'verfuegbar' ? '🤝 Reservieren' : '✅ Als abgeholt markieren'}
                                    </button>
                                )}
                                <button
                                    className="teilen-btn-withdraw"
                                    onClick={() => withdrawItem(item.id)}
                                >
                                    Zurückziehen
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {completedItems.length > 0 && (
                <div className="teilen-list teilen-list--completed">
                    <h3 className="teilen-list-title">Abgeholt</h3>
                    {completedItems.map(item => (
                        <div key={item.id} className="teilen-card teilen-card--abgeholt">
                            <div className="teilen-card-header">
                                <span className="teilen-card-name">{item.name}</span>
                                <span className="teilen-badge teilen-badge--abgeholt">
                                    {STATUS_LABELS.abgeholt}
                                </span>
                            </div>
                            <div className="teilen-card-details">
                                <span className="teilen-card-art">{item.art}</span>
                                <span className="teilen-card-menge">{item.menge}</span>
                            </div>
                            <button
                                className="teilen-btn-withdraw"
                                onClick={() => withdrawItem(item.id)}
                            >
                                Entfernen
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeilenSeite;
