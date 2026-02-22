import React, { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import { askAI } from '../utils/aiApi';
import { loadProfil, buildProfilText } from '../utils/kochProfil';
import './Unterwegs.css';

const STORAGE_KEY = 'unterwegs_orte_v1';

const ORT_TYPEN = [
    { id: 'imbiss',      label: '🌭 Imbiss'      },
    { id: 'restaurant',  label: '🍽️ Restaurant'  },
    { id: 'bäckerei',    label: '🥐 Bäckerei'    },
    { id: 'supermarkt',  label: '🛒 Supermarkt'  },
    { id: 'takeaway',    label: '🥡 Takeaway'     },
    { id: 'food-truck',  label: '🚐 Food Truck'   },
    { id: 'kantine',     label: '🏢 Kantine'      },
    { id: 'sonstiges',   label: '📍 Sonstiges'    },
];

const ZEIT_OPTIONEN = [
    { wert: 15,  label: '15 Min.' },
    { wert: 30,  label: '30 Min.' },
    { wert: 60,  label: '1 Std.'  },
    { wert: 0,   label: 'Egal'    },
];

const emptyOrtForm = { name: '', typ: 'imbiss', entfernung: '', meistens: '', notizen: '' };

function loadOrte() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
}

function saveOrte(orte) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orte));
}

// ── Ort-Karte ─────────────────────────────────────────────────────────────────

function OrtCard({ ort, onDelete }) {
    const typObj = ORT_TYPEN.find(t => t.id === ort.typ) || ORT_TYPEN[7];
    return (
        <div className="ort-card">
            <div className="ort-card-top">
                <span className="ort-typ-icon">{typObj.label.split(' ')[0]}</span>
                <div className="ort-card-info">
                    <div className="ort-card-name">{ort.name}</div>
                    <div className="ort-card-meta">
                        {ort.entfernung && <span>🚶 {ort.entfernung}</span>}
                        <span className="ort-typ-label">{typObj.label.split(' ').slice(1).join(' ')}</span>
                    </div>
                </div>
                <button className="ort-delete-btn" onClick={() => onDelete(ort.id)} title="Entfernen">✕</button>
            </div>
            {ort.meistens && (
                <div className="ort-meistens">
                    <span className="ort-meistens-label">Meistens:</span> {ort.meistens}
                </div>
            )}
            {ort.notizen && <div className="ort-notizen">💬 {ort.notizen}</div>}
            <a
                className="ort-maps-btn"
                href={`https://www.google.com/maps/search/${encodeURIComponent(ort.name)}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                🗺️ In Maps öffnen
            </a>
        </div>
    );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────

export default function Unterwegs() {
    const { activeUserId } = useUser();
    const [orte, setOrte]         = useState(loadOrte);
    const [zeit, setZeit]         = useState(30);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]         = useState({ ...emptyOrtForm });

    // KI-Vorschlag
    const [kiVorschlag,  setKiVorschlag]  = useState('');
    const [kiLoading,    setKiLoading]    = useState(false);
    const [kiError,      setKiError]      = useState('');

    const produkte = useLiveQuery(
        () => activeUserId ? db.produkte.where('person_id').equals(activeUserId).toArray() : [],
        [activeUserId]
    );

    const ortNamen = orte.map(o => `${o.name} (${o.typ}${o.meistens ? ', meistens: ' + o.meistens : ''})`).join('; ');
    const profil   = loadProfil(activeUserId || 'default');

    // ── Ort hinzufügen ──
    const handleAddOrt = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        const next = [{ id: Date.now(), ...form }, ...orte];
        setOrte(next);
        saveOrte(next);
        setForm({ ...emptyOrtForm });
        setShowForm(false);
    };

    const handleDeleteOrt = (id) => {
        const next = orte.filter(o => o.id !== id);
        setOrte(next);
        saveOrte(next);
    };

    // ── KI-Vorschlag ──
    const fetchKiVorschlag = useCallback(async () => {
        const provider = localStorage.getItem('ai_provider') || 'groq';
        const apiKey   = localStorage.getItem('ai_key') || '';
        if (!apiKey) { setKiError('Kein API-Key – bitte in Einstellungen eintragen.'); return; }

        setKiLoading(true);
        setKiError('');
        setKiVorschlag('');

        const zeitText = zeit > 0 ? `${zeit} Minuten Zeit` : 'genug Zeit';
        const orteText = ortNamen || 'keine gespeicherten Orte';
        const frage    = `Ich bin unterwegs und habe ${zeitText} zum Essen. Meine bekannten Orte: ${orteText}. Mein Koch-Profil: ${buildProfilText(profil)}. Was empfiehlst du mir heute zum Mittagessen? Kurze, praktische Antwort bitte.`;

        try {
            const antwort = await askAI({
                provider, apiKey, question: frage, history: [],
                context: { produkte, profile: null, kochProfil: buildProfilText(profil) },
            });
            setKiVorschlag(antwort);
        } catch (err) {
            setKiError(err.message);
        } finally {
            setKiLoading(false);
        }
    }, [zeit, ortNamen, profil, produkte]);

    const hasApiKey = !!localStorage.getItem('ai_key');

    return (
        <div className="unterwegs-page">

            {/* ── Header ── */}
            <div className="unterwegs-header">
                <div className="uw-header-left">
                    <div className="uw-title">Unterwegs</div>
                    <div className="uw-subtitle">Deine Lieblingsorte & schnelle Ideen</div>
                </div>
                <span className="uw-header-icon">🚶</span>
            </div>

            {/* ── Zeitfilter ── */}
            <div className="uw-zeit-section">
                <div className="uw-label">Wie viel Zeit hast du?</div>
                <div className="uw-zeit-chips">
                    {ZEIT_OPTIONEN.map(opt => (
                        <button
                            key={opt.wert}
                            className={`uw-zeit-chip${zeit === opt.wert ? ' active' : ''}`}
                            onClick={() => setZeit(opt.wert)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── KI-Vorschlag ── */}
            <div className="uw-ki-section">
                <button
                    className={`uw-ki-btn${kiLoading ? ' loading' : ''}`}
                    onClick={fetchKiVorschlag}
                    disabled={kiLoading || !hasApiKey}
                    title={!hasApiKey ? 'API-Key in Einstellungen eintragen' : ''}
                >
                    {kiLoading ? '⏳ Chef Aivo denkt…' : '🧠 Chef Aivo fragen'}
                </button>

                {!hasApiKey && (
                    <div className="uw-no-key">🔑 API-Key nötig – <a href="#/einstellungen">Einstellungen → KI-Koch</a></div>
                )}
                {kiError && <div className="uw-ki-error">⚠️ {kiError}</div>}
                {kiVorschlag && (
                    <div className="uw-ki-antwort">
                        <div className="uw-ki-label">🧠 Chef Aivo sagt:</div>
                        <div className="uw-ki-text">{kiVorschlag}</div>
                    </div>
                )}
            </div>

            {/* ── Meine Orte ── */}
            <div className="uw-orte-section">
                <div className="uw-orte-header">
                    <div className="uw-label">📍 Meine Orte ({orte.length})</div>
                    <button className="uw-add-btn" onClick={() => setShowForm(o => !o)}>
                        {showForm ? '✕' : '+ Ort hinzufügen'}
                    </button>
                </div>

                {/* ── Formular ── */}
                {showForm && (
                    <form className="uw-form" onSubmit={handleAddOrt}>
                        <div className="uw-form-row">
                            <input
                                className="uw-input"
                                type="text"
                                placeholder="Name des Ortes*"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                required
                            />
                            <input
                                className="uw-input"
                                type="text"
                                placeholder="Entfernung (z.B. 5 Min. zu Fuss)"
                                value={form.entfernung}
                                onChange={e => setForm(f => ({ ...f, entfernung: e.target.value }))}
                            />
                        </div>
                        <div className="uw-typ-chips">
                            {ORT_TYPEN.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    className={`uw-typ-chip${form.typ === t.id ? ' active' : ''}`}
                                    onClick={() => setForm(f => ({ ...f, typ: t.id }))}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <input
                            className="uw-input"
                            type="text"
                            placeholder="Was bestellst du meistens? (optional)"
                            value={form.meistens}
                            onChange={e => setForm(f => ({ ...f, meistens: e.target.value }))}
                        />
                        <input
                            className="uw-input"
                            type="text"
                            placeholder="Notizen (optional)"
                            value={form.notizen}
                            onChange={e => setForm(f => ({ ...f, notizen: e.target.value }))}
                        />
                        <div className="uw-form-actions">
                            <button type="button" className="uw-btn-cancel" onClick={() => { setShowForm(false); setForm({ ...emptyOrtForm }); }}>Abbrechen</button>
                            <button type="submit" className="uw-btn-save">📍 Speichern</button>
                        </div>
                    </form>
                )}

                {/* ── Ort-Liste ── */}
                {orte.length === 0 && !showForm && (
                    <div className="uw-empty">
                        <div className="uw-empty-icon">🗺️</div>
                        <div className="uw-empty-title">Noch keine Orte gespeichert</div>
                        <div className="uw-empty-hint">Füge deine Lieblingsimbisse, Restaurants oder Bäckereien hinzu.</div>
                    </div>
                )}

                <div className="uw-orte-list">
                    {orte.map(ort => (
                        <OrtCard key={ort.id} ort={ort} onDelete={handleDeleteOrt} />
                    ))}
                </div>
            </div>
        </div>
    );
}
