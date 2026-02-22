/**
 * VoiceOverlay – globale Sprachsteuerung
 *
 * - Floating Mic-Button (immer sichtbar, in der App-Navigation)
 * - Tipp: kurz antippen = Push-to-talk (toggle)
 * - Gedrückt halten: Long-Press = Freihändig-Modus (loslassen = stop)
 * - Sprachbefehl-Anleitung als Modal
 * - Alles abschaltbar über localStorage('voice_enabled')
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceControl } from '../hooks/useVoiceControl';
import { parseVoiceCommand, NAV_RULES } from '../utils/voiceCommands';
import './VoiceOverlay.css';

const QUICK_LINKS = [
    { label: '🏠 Home',       path: '/uebersicht'     },
    { label: '🧊 Inventar',   path: '/produkte'       },
    { label: '🍳 Koch',       path: '/koch-assistent' },
    { label: '🛒 Einkauf',    path: '/einkauf'        },
    { label: '📖 Rezepte',    path: '/rezepte'        },
    { label: '📅 Plan',       path: '/wochenplan'     },
    { label: '🚶 Unterwegs',  path: '/unterwegs'      },
    { label: '⚙️ Einstellungen', path: '/einstellungen' },
];

const GUIDE_SECTIONS = [
    {
        title: '🗺️ Navigation',
        items: [
            { cmd: 'Home',              example: '"Home" oder "Hauptseite"' },
            { cmd: 'Inventar',          example: '"Inventar" oder "Kühlschrank"' },
            { cmd: 'Rezepte',           example: '"Rezepte"' },
            { cmd: 'Koch',              example: '"Koch" oder "Chef"' },
            { cmd: 'Einkauf',           example: '"Einkauf" oder "Einkaufsliste"' },
            { cmd: 'Wochenplan',        example: '"Plan" oder "Wochenplan"' },
            { cmd: 'Unterwegs',         example: '"Unterwegs"' },
            { cmd: 'Einstellungen',     example: '"Einstellungen"' },
            { cmd: 'Favoriten',         example: '"Favoriten"' },
            { cmd: 'Notizen',           example: '"Notizen"' },
        ],
    },
    {
        title: '🧠 Befehle mit Trigger',
        items: [
            { cmd: 'Geh zu …',          example: '"Geh zu Rezepten"' },
            { cmd: 'Öffne …',           example: '"Öffne Inventar"' },
            { cmd: 'Zeig …',            example: '"Zeig Wochenplan"' },
            { cmd: 'Wechsel zu …',      example: '"Wechsel zu Koch"' },
        ],
    },
    {
        title: '🍳 Koch & Essen',
        items: [
            { cmd: 'Was kann ich kochen?', example: '"Was kann ich kochen?"' },
            { cmd: 'Reste aufbrauchen',    example: '"Was läuft ab?"' },
            { cmd: 'Rezept vorschlagen',   example: '"Schlag ein Rezept vor"' },
            { cmd: 'Freie Frage (KI)',     example: 'Beliebige lange Frage → geht an Chef Aivo' },
        ],
    },
    {
        title: '💡 Tipps',
        items: [
            { cmd: 'Kurz antippen',     example: 'Einmal tippen = Mikrofon an, nochmal = aus' },
            { cmd: 'Gedrückt halten',   example: 'Halten = Freihändig, loslassen = Ende' },
            { cmd: 'Sprache deaktivieren', example: 'Im Menü (⚡) → deaktivieren' },
        ],
    },
];

const LONG_PRESS_MS = 350;

export default function VoiceOverlay() {
    const navigate  = useNavigate();
    const [enabled, setEnabled]       = useState(
        () => localStorage.getItem('voice_enabled') !== 'false'
    );
    const [menuOpen, setMenuOpen]     = useState(false);
    const [guideOpen, setGuideOpen]   = useState(false);
    const [feedback, setFeedback]     = useState('');
    const [feedbackType, setFeedbackType] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);

    const feedbackTimer  = useRef(null);
    const menuRef        = useRef(null);
    const longPressTimer = useRef(null);
    const holdMode       = useRef(false);   // true = Freihändig-Modus (gedrückt halten)
    const didLongPress   = useRef(false);   // verhindert Tap-Handler nach Long-Press

    // ── Feedback anzeigen ──
    const showMsg = useCallback((msg, type = 'ok', duration = 2800) => {
        setFeedback(msg);
        setFeedbackType(type);
        setShowFeedback(true);
        clearTimeout(feedbackTimer.current);
        feedbackTimer.current = setTimeout(() => setShowFeedback(false), duration);
    }, []);

    // ── Sprachbefehl verarbeiten ──
    const handleResult = useCallback((text) => {
        const cmd = parseVoiceCommand(text);

        if (cmd.type === 'navigate') {
            showMsg(cmd.displayText, 'nav');
            setTimeout(() => navigate(cmd.path), 400);
        } else if (cmd.type === 'query') {
            showMsg(cmd.displayText, 'query', 4000);
            navigate('/koch-assistent');
        } else {
            showMsg(`❓ "${text.slice(0, 35)}"`, 'error', 3000);
        }
    }, [navigate, showMsg]);

    const handleError = useCallback((msg) => {
        showMsg(msg, 'error', 3500);
    }, [showMsg]);

    const { isListening, interimText, supported, startListening, stopListening } =
        useVoiceControl({ onResult: handleResult, onError: handleError });

    // ── Toggle (kurzer Tipp) ──
    const toggleVoice = () => {
        if (!supported) {
            showMsg('Spracherkennung nicht verfügbar in diesem Browser.', 'error', 4000);
            return;
        }
        if (isListening) {
            stopListening();
        } else {
            setMenuOpen(false);
            startListening();
            showMsg('🎙️ Höre zu…', 'ok', 8000);
        }
    };

    // ── Long-Press Logik ──
    const onMicPointerDown = (e) => {
        e.preventDefault();
        didLongPress.current = false;
        holdMode.current = false;

        longPressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            holdMode.current = true;
            if (!isListening && supported) {
                setMenuOpen(false);
                startListening();
                showMsg('🤲 Freihändig – loslassen zum Stoppen', 'ok', 20000);
            }
        }, LONG_PRESS_MS);
    };

    const onMicPointerUp = () => {
        clearTimeout(longPressTimer.current);
        if (holdMode.current && isListening) {
            stopListening();
            holdMode.current = false;
        } else if (!didLongPress.current) {
            // Kurzer Tipp
            toggleVoice();
        }
    };

    const onMicPointerLeave = () => {
        clearTimeout(longPressTimer.current);
        if (holdMode.current && isListening) {
            stopListening();
            holdMode.current = false;
        }
    };

    // ── Toggle enabled ──
    const toggleEnabled = () => {
        const next = !enabled;
        setEnabled(next);
        localStorage.setItem('voice_enabled', String(next));
        if (!next && isListening) stopListening();
    };

    // ── Klick ausserhalb schließt Menu ──
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, []);

    // ── Cleanup ──
    useEffect(() => () => {
        clearTimeout(feedbackTimer.current);
        clearTimeout(longPressTimer.current);
    }, []);

    // Wenn deaktiviert: nur kleinen "Aktivieren"-Button zeigen
    if (!enabled) {
        return (
            <div className="vo-disabled-hint" onClick={toggleEnabled} title="Sprachsteuerung aktivieren">
                🎙️
            </div>
        );
    }

    return (
        <>
        <div className="vo-root" ref={menuRef}>

            {/* ── Feedback-Blase ── */}
            {showFeedback && (
                <div className={`vo-feedback vo-feedback-${feedbackType}`}>
                    {isListening && interimText
                        ? <>🎙️ <span className="vo-interim">"{interimText}"</span></>
                        : feedback
                    }
                </div>
            )}

            {/* ── Interim-Transcript während dem Sprechen ── */}
            {isListening && interimText && !showFeedback && (
                <div className="vo-feedback vo-feedback-ok">
                    🎙️ "{interimText}"
                </div>
            )}

            {/* ── Schnell-Menu (Quick-Switch) ── */}
            {menuOpen && !isListening && (
                <div className="vo-menu">
                    <div className="vo-menu-header">
                        <span>Schnell wechseln</span>
                        <button className="vo-menu-close" onClick={() => setMenuOpen(false)}>✕</button>
                    </div>
                    <div className="vo-quick-links">
                        {QUICK_LINKS.map(({ label, path }) => (
                            <button
                                key={path}
                                className="vo-quick-link"
                                onClick={() => { navigate(path); setMenuOpen(false); }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="vo-menu-footer">
                        <button
                            className="vo-guide-btn"
                            onClick={() => { setMenuOpen(false); setGuideOpen(true); }}
                        >
                            ❓ Sprachbefehle anzeigen
                        </button>
                        <button className="vo-toggle-btn" onClick={toggleEnabled}>
                            🎙️ Sprachsteuerung deaktivieren
                        </button>
                    </div>
                    {!supported && (
                        <div className="vo-no-support">
                            ⚠️ Spracherkennung nur in Chrome/Edge verfügbar.
                        </div>
                    )}
                </div>
            )}

            {/* ── Haupt-Buttons ── */}
            <div className="vo-buttons">
                {/* Quick-Switch Button */}
                <button
                    className={`vo-btn switch${menuOpen ? ' open' : ''}`}
                    onClick={() => { setMenuOpen(o => !o); }}
                    title="Seite wechseln"
                    aria-label="Schnellmenü öffnen"
                >
                    ⚡
                </button>

                {/* Mic Button – Long-Press + Tap */}
                <button
                    className={`vo-btn mic${isListening ? ' listening' : ''}${holdMode.current ? ' hold' : ''}${!supported ? ' disabled' : ''}`}
                    onPointerDown={onMicPointerDown}
                    onPointerUp={onMicPointerUp}
                    onPointerLeave={onMicPointerLeave}
                    title={isListening
                        ? (holdMode.current ? 'Loslassen zum Stoppen' : 'Aufnahme stoppen')
                        : 'Tippen = Push-to-talk | Halten = Freihändig'}
                    aria-label={isListening ? 'Aufnahme stoppen' : 'Mikrofon'}
                >
                    {isListening ? '⏹' : '🎙️'}
                    {isListening && <span className="vo-pulse" />}
                </button>
            </div>
        </div>

        {/* ── Sprach-Anleitung Modal ── */}
        {guideOpen && (
            <div className="vo-guide-overlay" onClick={() => setGuideOpen(false)}>
                <div className="vo-guide-modal" onClick={e => e.stopPropagation()}>
                    <div className="vo-guide-header">
                        <span className="vo-guide-title">🎙️ Sprachbefehle</span>
                        <button className="vo-guide-close" onClick={() => setGuideOpen(false)}>✕</button>
                    </div>
                    <div className="vo-guide-body">
                        {GUIDE_SECTIONS.map(section => (
                            <div key={section.title} className="vo-guide-section">
                                <div className="vo-guide-section-title">{section.title}</div>
                                {section.items.map((item, i) => (
                                    <div key={i} className="vo-guide-item">
                                        <span className="vo-guide-cmd">{item.cmd}</span>
                                        <span className="vo-guide-example">{item.example}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="vo-guide-footer">
                        <button className="vo-guide-close-btn" onClick={() => setGuideOpen(false)}>
                            Schliessen
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
