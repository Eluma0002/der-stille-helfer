import React, { useState, useEffect } from 'react';
import { db, ensureProfileExists } from '../db/schema';
import { useUser } from '../context/UserContext';
import { strings } from '../strings/de';
import { ELVIS_PROFILE } from '../bots/substitutions';
import { AI_PROVIDERS } from '../utils/aiApi';
import './Einstellungen.css';

const EMPTY_ALLERGY_PROFILE = { forbidden: [], allowed: [], excluded: [], substitutions: {} };

const Einstellungen = () => {
    const { activeUser, activeUserId, switchUser, users } = useUser();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({ name: '', preferences: '' });

    // KI-Einstellungen (localStorage)
    const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('ai_provider') || 'groq');
    const [apiKey, setApiKey]         = useState(() => localStorage.getItem('ai_key') || '');
    const [aiSaved, setAiSaved]       = useState(false);
    const [aiOpen, setAiOpen]         = useState(false);

    const saveAiSettings = () => {
        localStorage.setItem('ai_provider', aiProvider);
        localStorage.setItem('ai_key', apiKey);
        setAiSaved(true);
        setTimeout(() => setAiSaved(false), 2500);
    };

    // Allergieprofil
    const [allergyOpen, setAllergyOpen] = useState(false);
    const [allergyProfile, setAllergyProfile] = useState(EMPTY_ALLERGY_PROFILE);
    const [addForbiddenInput, setAddForbiddenInput] = useState('');
    const [addAllowedInput, setAddAllowedInput] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                await ensureProfileExists(activeUserId);
                const existing = await db.profile.where('person_id').equals(activeUserId).first();
                if (existing) {
                    setProfile(existing);
                    setFormData({
                        name: existing.name || activeUser?.name || '',
                        preferences: existing.preferences || ''
                    });
                    setAllergyProfile(existing.allergyProfile || EMPTY_ALLERGY_PROFILE);
                } else {
                    setFormData({ name: activeUser?.name || '', preferences: '' });
                    setAllergyProfile(activeUserId === 'elvis' ? ELVIS_PROFILE : EMPTY_ALLERGY_PROFILE);
                }
            } catch (err) {
                setError('Fehler beim Laden des Profils');
            } finally {
                setIsLoading(false);
            }
        };
        if (activeUserId) loadProfile();
    }, [activeUserId, activeUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const data = {
                person_id: activeUserId,
                name: formData.name,
                preferences: formData.preferences,
                allergyProfile,
                dietary_restrictions: allergyProfile.forbidden,
                updated_at: new Date().toISOString()
            };
            if (profile) {
                await db.profile.update(profile.id, data);
            } else {
                await db.profile.add({ id: `profile-${activeUserId}`, ...data });
            }
            setSuccess('Gespeichert ✓');
            setTimeout(() => setSuccess(null), 2500);
        } catch (err) {
            setError(strings.settings.saveError);
        } finally {
            setIsLoading(false);
        }
    };

    const saveAllergyProfile = async (updated) => {
        setAllergyProfile(updated);
        try {
            const existing = await db.profile.where('person_id').equals(activeUserId).first();
            if (existing) {
                await db.profile.update(existing.id, {
                    allergyProfile: updated,
                    dietary_restrictions: updated.forbidden
                });
            }
        } catch (err) {
            console.error('Fehler beim Speichern des Allergieprofils:', err);
        }
    };

    const removeForbidden = (item) =>
        saveAllergyProfile({ ...allergyProfile, forbidden: allergyProfile.forbidden.filter(x => x !== item) });

    const addForbiddenItem = () => {
        const val = addForbiddenInput.trim();
        if (!val || allergyProfile.forbidden.includes(val)) return;
        saveAllergyProfile({ ...allergyProfile, forbidden: [...allergyProfile.forbidden, val] });
        setAddForbiddenInput('');
    };

    const removeAllowed = (item) =>
        saveAllergyProfile({ ...allergyProfile, allowed: allergyProfile.allowed.filter(x => x !== item) });

    const addAllowedItem = () => {
        const val = addAllowedInput.trim();
        if (!val || allergyProfile.allowed.includes(val)) return;
        saveAllergyProfile({ ...allergyProfile, allowed: [...allergyProfile.allowed, val] });
        setAddAllowedInput('');
    };

    const resetApp = async () => {
        if (!window.confirm(strings.settings.resetConfirm)) return;
        try {
            await db.delete();
            await db.open();
            window.location.reload();
        } catch (err) {
            setError('Fehler beim Zurücksetzen der App');
        }
    };

    return (
        <div className="settings-page">
            <h2>{strings.settings.title} ⚙️</h2>

            {/* Nutzer-Auswahl */}
            <div className="card">
                <h3>Nutzer-Auswahl</h3>
                <div className="user-selection">
                    {Object.entries(users).map(([userId, user]) => (
                        <div key={userId} className="user-option">
                            <span>{user.emoji} {user.name}</span>
                            {activeUserId === userId ? (
                                <span className="active-badge">✓ Aktiv</span>
                            ) : (
                                <button className="btn small" onClick={() => switchUser(userId)}>
                                    Auswählen
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Profil-Formular */}
            <div className="card">
                <h3>{strings.settings.profile}</h3>
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="name">{strings.settings.name}</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="preferences">{strings.settings.preferences}</label>
                        <textarea
                            id="preferences"
                            name="preferences"
                            value={formData.preferences}
                            onChange={handleChange}
                            placeholder="z.B. vegetarisch, wenig Schärfe, schnelle Rezepte..."
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    {success && <p className="success">{success}</p>}
                    <button type="submit" className="btn primary" disabled={isLoading}>
                        {isLoading ? 'Speichern...' : 'Profil speichern'}
                    </button>
                </form>
            </div>

            {/* Allergieprofil – zugeklappt */}
            <div className="card allergy-card">
                <button
                    className="allergy-header"
                    onClick={() => setAllergyOpen(o => !o)}
                    type="button"
                >
                    <span className="allergy-header-title">
                        🥗 Mein Allergieprofil
                        {allergyProfile.forbidden.length > 0 && (
                            <span className="allergy-count">{allergyProfile.forbidden.length}</span>
                        )}
                    </span>
                    <span className={`allergy-chevron ${allergyOpen ? 'open' : ''}`}>▼</span>
                </button>

                {allergyOpen && (
                    <div className="allergy-body">

                        {/* Nicht erlaubt */}
                        <div className="allergy-section">
                            <h4 className="allergy-section-title forbidden-title">Nicht erlaubt</h4>
                            <div className="allergy-tags">
                                {allergyProfile.forbidden.map((item, i) => (
                                    <span key={i} className="allergy-tag forbidden">
                                        {item}
                                        <button
                                            className="tag-remove"
                                            onClick={() => removeForbidden(item)}
                                            title="Entfernen"
                                        >×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="allergy-add-row">
                                <input
                                    type="text"
                                    className="allergy-add-input"
                                    placeholder="Produkt hinzufügen..."
                                    value={addForbiddenInput}
                                    onChange={e => setAddForbiddenInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addForbiddenItem())}
                                />
                                <button
                                    type="button"
                                    className="allergy-add-btn forbidden-add"
                                    onClick={addForbiddenItem}
                                >+</button>
                            </div>
                        </div>

                        {/* Erlaubt */}
                        <div className="allergy-section">
                            <h4 className="allergy-section-title allowed-title">Erlaubt (trotz Unverträglichkeit)</h4>
                            <div className="allergy-tags">
                                {allergyProfile.allowed.map((item, i) => (
                                    <span key={i} className="allergy-tag allowed">
                                        {item} ✓
                                        <button
                                            className="tag-remove"
                                            onClick={() => removeAllowed(item)}
                                            title="Entfernen"
                                        >×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="allergy-add-row">
                                <input
                                    type="text"
                                    className="allergy-add-input"
                                    placeholder="Produkt hinzufügen..."
                                    value={addAllowedInput}
                                    onChange={e => setAddAllowedInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllowedItem())}
                                />
                                <button
                                    type="button"
                                    className="allergy-add-btn allowed-add"
                                    onClick={addAllowedItem}
                                >+</button>
                            </div>
                        </div>

                        {/* Ersatzstoffe */}
                        {Object.keys(allergyProfile.substitutions || {}).length > 0 && (
                            <div className="allergy-section">
                                <h4 className="allergy-section-title sub-title">Ersatzstoffe</h4>
                                <div className="substitution-list">
                                    {Object.entries(allergyProfile.substitutions).map(([original, alts]) => (
                                        <div key={original} className="substitution-row">
                                            <span className="sub-original">{original}</span>
                                            <span className="sub-arrow">→</span>
                                            <span className="sub-alts">{Array.isArray(alts) ? alts.join(', ') : alts}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* KI-Koch Einstellungen */}
            <div className="card allergy-card">
                <button className="allergy-header" onClick={() => setAiOpen(o => !o)} type="button">
                    <span className="allergy-header-title">
                        🤖 KI-Koch Einstellungen
                        {apiKey && <span className="allergy-count" style={{ background: '#27AE60' }}>✓</span>}
                    </span>
                    <span className={`allergy-chevron ${aiOpen ? 'open' : ''}`}>▼</span>
                </button>
                {aiOpen && (
                    <div className="allergy-body">
                        <div className="form-group">
                            <label>KI-Anbieter wählen</label>
                            <div className="ai-provider-grid">
                                {Object.entries(AI_PROVIDERS).map(([key, p]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`ai-provider-btn ${aiProvider === key ? 'active' : ''}`}
                                        onClick={() => setAiProvider(key)}
                                    >
                                        <span className="ai-p-name">{p.name}</span>
                                        <span className="ai-p-desc">{p.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>API-Key für {AI_PROVIDERS[aiProvider]?.name}</label>
                            <input
                                type="password"
                                placeholder="Hier API-Key einfügen..."
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                            />
                            <p className="ai-signup-hint">
                                Noch keinen Key?{' '}
                                <a href={AI_PROVIDERS[aiProvider]?.signupUrl} target="_blank" rel="noreferrer">
                                    Kostenlos registrieren →
                                </a>
                            </p>
                        </div>
                        {aiSaved && <p className="success">KI-Einstellungen gespeichert ✓</p>}
                        <button type="button" className="btn primary" onClick={saveAiSettings}>
                            💾 KI-Einstellungen speichern
                        </button>
                    </div>
                )}
            </div>

            {/* Weitere Seiten */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3>Weitere Funktionen</h3>
                <a href="#/wochenplan"  style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>📅 Wochenplan</a>
                <a href="#/favoriten"  style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>⭐ Favoriten</a>
                <a href="#/backup"     style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>💾 Backup / Export</a>
                <a href="#/notizen"    style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>📝 Notizen & eigene Rezepte</a>
            </div>

            {/* Reset */}
            <div className="reset-section">
                <button className="btn btn-alert" onClick={resetApp} type="button">
                    {strings.settings.resetApp}
                </button>
            </div>
        </div>
    );
};

export default Einstellungen;
