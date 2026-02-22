/**
 * KochProfil – Klappbare Einstellungen für Chef Aivo & Chef Luigi
 */
import React, { useState } from 'react';
import {
    KUECHEN_OPTIONEN, ZEIT_OPTIONEN,
    saveProfil,
} from '../utils/kochProfil';
import './KochProfil.css';

const EINSCHRAENKUNGEN = [
    { key: 'keinSchwein',   label: '🐷 Kein Schwein'    },
    { key: 'keinFisch',     label: '🐟 Kein Fisch'      },
    { key: 'keinGefluegel', label: '🍗 Kein Geflügel'  },
    { key: 'vegetarisch',   label: '🥦 Vegetarisch'     },
    { key: 'vegan',         label: '🌱 Vegan'            },
    { key: 'glutenfrei',    label: '🌾 Glutenfrei'       },
    { key: 'laktosefrei',   label: '🥛 Laktosefrei'     },
    { key: 'keinNuesse',    label: '🥜 Keine Nüsse'     },
];

export default function KochProfil({ profil, userId, onChange, chef = 'aivo' }) {
    const [open, setOpen] = useState(false);

    const update = (field, value) => {
        const next = { ...profil, [field]: value };
        // Vegan impliziert vegetarisch
        if (field === 'vegan' && value) next.vegetarisch = true;
        saveProfil(userId, next);
        onChange(next);
    };

    const toggleKueche = (id) => {
        const current = profil.kuechen || [];
        const next = current.includes(id)
            ? current.filter(k => k !== id)
            : [...current, id];
        update('kuechen', next);
    };

    const isAivo  = chef === 'aivo';
    const accentClass = isAivo ? 'aivo' : 'luigi';
    const icon    = isAivo ? '🧠' : '👨‍🍳';
    const name    = isAivo ? 'Chef Aivo' : 'Chef Luigi';

    return (
        <div className={`kochprofil kochprofil-${accentClass}`}>
            <button
                className="kp-toggle"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
            >
                <span className="kp-toggle-left">
                    {icon} <span className="kp-toggle-name">{name} anpassen</span>
                    {!open && <span className="kp-toggle-hint">Tippe um Einstellungen zu sehen</span>}
                </span>
                <span className={`kp-chevron${open ? ' open' : ''}`}>▼</span>
            </button>

            {open && (
                <div className="kp-body">

                    {/* ── Ernährung ── */}
                    <div className="kp-section-label">Ernährung</div>
                    <div className="kp-toggles">
                        {EINSCHRAENKUNGEN.map(({ key, label }) => (
                            <button
                                key={key}
                                className={`kp-chip${profil[key] ? ' active' : ''}`}
                                onClick={() => update(key, !profil[key])}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Küchen ── */}
                    <div className="kp-section-label">Lieblingsküchen</div>
                    <div className="kp-toggles">
                        {KUECHEN_OPTIONEN.map(({ id, label }) => (
                            <button
                                key={id}
                                className={`kp-chip${(profil.kuechen || []).includes(id) ? ' active' : ''}`}
                                onClick={() => toggleKueche(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Zeit & Portionen ── */}
                    <div className="kp-row">
                        <div className="kp-col">
                            <div className="kp-section-label">Max. Zeit</div>
                            <div className="kp-toggles">
                                {ZEIT_OPTIONEN.map(({ wert, label }) => (
                                    <button
                                        key={wert}
                                        className={`kp-chip${profil.maxZeit === wert ? ' active' : ''}`}
                                        onClick={() => update('maxZeit', wert)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="kp-col">
                            <div className="kp-section-label">Portionen</div>
                            <div className="kp-toggles">
                                {[1, 2, 4, 6].map(n => (
                                    <button
                                        key={n}
                                        className={`kp-chip${profil.portionen === n ? ' active' : ''}`}
                                        onClick={() => update('portionen', n)}
                                    >
                                        {n}×
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Freitext ── */}
                    <div className="kp-section-label">
                        {isAivo ? 'Was Chef Aivo noch wissen soll' : 'Luigis persönliche Regeln'}
                    </div>
                    <textarea
                        className="kp-textarea"
                        placeholder={isAivo
                            ? 'z.B. "Ich mag keine Pilze, lieber leichte Sommergerichte"'
                            : 'z.B. "Ich esse abends nie Fleisch, Pasta max. 2x pro Woche"'}
                        value={isAivo ? (profil.freitext || '') : (profil.luigiPrompt || '')}
                        onChange={e => update(isAivo ? 'freitext' : 'luigiPrompt', e.target.value)}
                        rows={2}
                    />

                    {/* ── Reset ── */}
                    <div className="kp-footer">
                        <button
                            className="kp-reset"
                            onClick={() => {
                                const reset = { ...profil, keinSchwein: false, keinFisch: false,
                                    keinGefluegel: false, vegetarisch: false, vegan: false,
                                    glutenfrei: false, laktosefrei: false, keinNuesse: false,
                                    kuechen: [], maxZeit: 0, portionen: 2, freitext: '',
                                    luigiPrompt: '' };
                                saveProfil(userId, reset);
                                onChange(reset);
                            }}
                        >
                            ↺ Zurücksetzen
                        </button>
                        <button className="kp-close" onClick={() => setOpen(false)}>
                            Schliessen ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
