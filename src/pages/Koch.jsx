import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import { matchRecipesToInventory } from '../utils/recipeMatching';
import { KochBot } from '../bots/KochBot';
import { askAI, askAivoForRecipes } from '../utils/aiApi';
import { loadProfil, saveProfil, buildProfilText, rezeptErlaubt } from '../utils/kochProfil';
import KochProfil from '../components/KochProfil';
import './Koch.css';

const kochBot = new KochBot();

const MEAL_TYPES = [
    { id: 'fruehstueck', name: 'Frühstück', icon: '🌅' },
    { id: 'mittag',      name: 'Mittag',    icon: '☀️'  },
    { id: 'abend',       name: 'Abend',     icon: '🌙'  },
    { id: 'snack',       name: 'Snack',     icon: '🍿'  },
];

// ── Engine Switcher ───────────────────────────────────────────────────────────

function EngineSwitcher({ engine, onChange }) {
    return (
        <div className="engine-switcher">
            <button className={`engine-btn${engine === 'aivo'  ? ' active aivo'  : ''}`} onClick={() => onChange('aivo')}>
                🧠 Chef Aivo
            </button>
            <button className={`engine-btn${engine === 'beide' ? ' active beide' : ''}`} onClick={() => onChange('beide')}>
                Beide
            </button>
            <button className={`engine-btn${engine === 'luigi' ? ' active luigi' : ''}`} onClick={() => onChange('luigi')}>
                👨‍🍳 Chef Luigi
            </button>
        </div>
    );
}

// ── Chef Badge ────────────────────────────────────────────────────────────────

function ChefBadge({ chef }) {
    if (chef === 'aivo') return <span className="chef-badge aivo">🧠 Chef Aivo</span>;
    return <span className="chef-badge luigi">👨‍🍳 Chef Luigi</span>;
}

// ── KI-Rezeptkarte (Chef Aivo) ────────────────────────────────────────────────

function AivoCard({ rezept, onSave, onDiscard, isSaved }) {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(rezept);
        setSaving(false);
    };

    return (
        <div className={`koch-card aivo-card${isSaved ? ' saved' : ''}`}>
            <div className="kc-top">
                <ChefBadge chef="aivo" />
                <div className="kc-badges">
                    {isSaved && <span className="kc-badge saved">✓ Gespeichert</span>}
                    {rezept.schwierigkeit && (
                        <span className="kc-badge difficulty">{rezept.schwierigkeit}</span>
                    )}
                </div>
            </div>

            <div className="kc-title">{rezept.name}</div>
            {rezept.beschreibung && (
                <div className="kc-reason">{rezept.beschreibung}</div>
            )}

            {rezept.zutaten?.length > 0 && (
                <div className="aivo-zutaten">
                    {rezept.zutaten.slice(0, 4).map((z, i) => (
                        <span key={i} className="aivo-zutat-tag">
                            {z.menge ? `${z.menge} ${z.name}` : z.name}
                        </span>
                    ))}
                    {rezept.zutaten.length > 4 && (
                        <span className="aivo-zutat-more">+{rezept.zutaten.length - 4}</span>
                    )}
                </div>
            )}

            <div className="kc-footer">
                <div className="kc-meta">
                    {rezept.zeit > 0 && <span className="kc-time">⏱ {rezept.zeit} Min.</span>}
                    {rezept.portionen > 0 && <span className="kc-time">👥 {rezept.portionen} P.</span>}
                </div>
                {!isSaved ? (
                    <div className="kc-actions">
                        <button className="kc-btn discard" onClick={() => onDiscard(rezept)}>✕</button>
                        <button className="kc-btn primary" onClick={handleSave} disabled={saving}>
                            {saving ? '⏳' : '+ Speichern'}
                        </button>
                    </div>
                ) : (
                    <span className="aivo-saved-hint">In Rezepten gespeichert</span>
                )}
            </div>
        </div>
    );
}

// ── Luigi-Rezeptkarte (Algo-Match) ─────────────────────────────────────────────

function LuigiCard({ result, profile, onAddToShoppingList, onCook }) {
    const { recipe, score, missingItems, usesExpiring, expiringIngredients } = result;
    const title = recipe.title || recipe.name || 'Rezept';
    const timeMinutes = recipe.timeMinutes || recipe.zeit;

    const safety = useMemo(() => {
        if (!profile) return null;
        return kochBot.checkSafety(recipe, profile);
    }, [recipe, profile]);

    const reason = useMemo(() => {
        if (score === 100) {
            if (usesExpiring && expiringIngredients?.length > 0)
                return `Perfekt für ${expiringIngredients.slice(0, 2).join(' & ')} – läuft bald ab!`;
            return 'Alle Zutaten da – sofort kochbar!';
        }
        if (missingItems?.length === 1) return `Nur noch ${missingItems[0]} fehlt.`;
        if (missingItems?.length <= 3)  return `Noch ${missingItems.length} Zutaten: ${missingItems.slice(0, 2).join(', ')}.`;
        return `${Math.round(score)}% deiner Zutaten passen.`;
    }, [score, missingItems, usesExpiring, expiringIngredients]);

    return (
        <div className={`koch-card${usesExpiring ? ' uses-expiring' : ''}${score === 100 ? ' can-cook' : ''}`}>
            <div className="kc-top">
                <ChefBadge chef="luigi" />
                <div className="kc-badges">
                    {usesExpiring && <span className="kc-badge expiring">🔴 Reste</span>}
                    {safety?.status === 'warning' && <span className="kc-badge warn">⚠️</span>}
                    {recipe.kategorie === 'KI-Rezept' && <span className="kc-badge ai-saved">🧠</span>}
                </div>
            </div>

            <div className="kc-title">{title}</div>
            <div className="kc-reason">{reason}</div>

            {expiringIngredients?.length > 0 && (
                <div className="kc-expiring-tags">
                    {expiringIngredients.map(ing => (
                        <span key={ing} className="kc-exp-tag">{ing}</span>
                    ))}
                </div>
            )}

            <div className="kc-footer">
                <div className="kc-meta">
                    <span className="kc-score">{Math.round(score)}%</span>
                    {timeMinutes && <span className="kc-time">⏱ {timeMinutes} Min.</span>}
                </div>
                <div className="kc-actions">
                    {missingItems?.length > 0 && (
                        <button className="kc-btn secondary" onClick={() => onAddToShoppingList(missingItems)}>
                            + Liste
                        </button>
                    )}
                    {score === 100 && (
                        <button className="kc-btn primary" onClick={() => onCook(recipe)}>
                            Kochen ▶
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Tagesplan (Luigi-Ergebnis, Aivo-Optik) ────────────────────────────────────

function Tagesplan({ plan }) {
    const hasSomething = Object.values(plan).some(Boolean);
    if (!hasSomething) return null;
    return (
        <div className="tagesplan-wrap">
            <div className="tagesplan-label">Heute kochen?</div>
            <div className="tagesplan-row">
                {MEAL_TYPES.map(({ id, name, icon }) => {
                    const r = plan[id];
                    return (
                        <div key={id} className={`tpc${r ? ' has-recipe' : ''}`}>
                            <div className="tpc-header">{icon} {name}</div>
                            {r ? (
                                <>
                                    <div className="tpc-name">{r.recipe?.title || r.recipe?.name}</div>
                                    <div className="tpc-time">⏱ {r.recipe?.timeMinutes || r.recipe?.zeit} Min.</div>
                                </>
                            ) : (
                                <div className="tpc-empty">–</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Chef-Aivo-Chat ────────────────────────────────────────────────────────────

function AivoChat({ produkte, userProfile, kochProfil }) {
    const [open,    setOpen]    = useState(false);
    const [input,   setInput]   = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const endRef = useRef(null);

    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, open]);

    const send = async () => {
        const q = input.trim();
        if (!q || loading) return;
        const provider = localStorage.getItem('ai_provider') || 'groq';
        const apiKey   = localStorage.getItem('ai_key') || '';
        setHistory(h => [...h, { role: 'user', content: q }]);
        setInput('');
        setLoading(true);
        setError('');
        try {
            const answer = await askAI({
                provider, apiKey, question: q, history,
                context: { produkte, profile: userProfile, kochProfil: buildProfilText(kochProfil) },
            });
            setHistory(h => [...h, { role: 'assistant', content: answer }]);
        } catch (err) {
            setError(err.message);
            setHistory(h => h.slice(0, -1));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="aivo-chat">
            <button className="aivo-chat-toggle" onClick={() => setOpen(o => !o)}>
                <span>🧠 Chef Aivo fragen</span>
                <div className="aivo-toggle-right">
                    {history.length > 0 && (
                        <button className="aivo-clear" onClick={e => { e.stopPropagation(); setHistory([]); setError(''); }} title="Chat zurücksetzen">↺</button>
                    )}
                    <span className={`aivo-chevron${open ? ' open' : ''}`}>▼</span>
                </div>
            </button>
            {open && (
                <div className="aivo-chat-body">
                    {!localStorage.getItem('ai_key') && (
                        <div className="aivo-no-key">🔑 Noch kein API-Key. <a href="#/einstellungen">Einstellungen → KI-Koch</a></div>
                    )}
                    {history.length === 0 && (
                        <div className="aivo-suggestions">
                            {['Was kann ich heute kochen?', 'Kreatives Rezept mit meinen Resten', 'Was kann ich statt Milch nehmen?'].map(s => (
                                <button key={s} className="aivo-chip" onClick={() => setInput(s)}>{s}</button>
                            ))}
                        </div>
                    )}
                    <div className="aivo-messages">
                        {history.map((msg, i) => (
                            <div key={i} className={`aivo-msg ${msg.role}`}>
                                {msg.role === 'assistant' && <span className="aivo-avatar">🧠</span>}
                                <div className="aivo-bubble">{msg.content}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="aivo-msg assistant">
                                <span className="aivo-avatar">🧠</span>
                                <div className="aivo-bubble aivo-typing"><span /><span /><span /></div>
                            </div>
                        )}
                        {error && <div className="aivo-error">{error}</div>}
                        <div ref={endRef} />
                    </div>
                    <div className="aivo-input-row">
                        <input
                            type="text" className="aivo-input" placeholder="Frag Chef Aivo…"
                            value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()} disabled={loading}
                        />
                        <button className="aivo-send" onClick={send} disabled={loading || !input.trim()}>
                            {loading ? '⏳' : '↑'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Luigi-Sektion ─────────────────────────────────────────────────────────────

function LuigiSection({ title, results, profile, onAddToShoppingList, onCook }) {
    if (!results.length) return null;
    return (
        <div className="koch-section">
            <div className="koch-section-title">
                <span>{title}</span>
                <span className="koch-section-count">{results.length}</span>
            </div>
            <div className="koch-cards">
                {results.map((result, i) => (
                    <LuigiCard
                        key={result.recipe?.id || i}
                        result={result}
                        profile={profile}
                        onAddToShoppingList={onAddToShoppingList}
                        onCook={onCook}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────

export default function Koch() {
    const { activeUserId } = useUser();

    const [engine, setEngine] = useState(() => localStorage.getItem('koch_engine') || 'beide');
    const [profil, setProfil] = useState(() => loadProfil(activeUserId || 'default'));

    // Chef-Luigi Filter
    const [mealFilter,       setMealFilter]       = useState('all');
    const [showOnlyExpiring, setShowOnlyExpiring] = useState(false);
    const [showOnlyFast,     setShowOnlyFast]     = useState(false);
    const [isThinking,       setIsThinking]       = useState(true);

    // Chef-Aivo KI-Rezepte
    const [aivoRezepte,  setAivoRezepte]  = useState([]);
    const [aivoLoading,  setAivoLoading]  = useState(false);
    const [aivoError,    setAivoError]    = useState('');
    const [savedIds,     setSavedIds]     = useState(new Set());

    const changeEngine = (e) => { setEngine(e); localStorage.setItem('koch_engine', e); };

    // Profil neu laden wenn User wechselt
    useEffect(() => {
        setProfil(loadProfil(activeUserId || 'default'));
    }, [activeUserId]);

    // ── Daten ──
    const produkte = useLiveQuery(
        () => activeUserId ? db.produkte.where('person_id').equals(activeUserId).toArray() : [],
        [activeUserId]
    );
    const baseRezepte   = useLiveQuery(() => db.base_rezepte.toArray(), []);
    const eigeneRezepte = useLiveQuery(
        () => activeUserId ? db.eigene_rezepte.where('person_id').equals(activeUserId).toArray() : [],
        [activeUserId]
    );
    const profileRecord = useLiveQuery(
        () => activeUserId ? db.profile.where('person_id').equals(activeUserId).first() : null,
        [activeUserId]
    );

    // ── Thinking-Animation ──
    useEffect(() => {
        setIsThinking(true);
        const t = setTimeout(() => setIsThinking(false), 900);
        return () => clearTimeout(t);
    }, [mealFilter, showOnlyExpiring, showOnlyFast]);

    // ── Alle Rezepte (Luigi nutzt auch gespeicherte KI-Rezepte!) ──
    const allRezepte = useMemo(() => [
        ...(baseRezepte   || []),
        ...(eigeneRezepte || []),   // enthält KI-Rezepte mit kategorie='KI-Rezept'
    ], [baseRezepte, eigeneRezepte]);

    // ── Luigi-Filter ──
    const filteredRezepte = useMemo(() => {
        let r = allRezepte;
        // Profil-Filter (Ernährungsregeln)
        r = r.filter(rz => rezeptErlaubt(rz, profil));
        if (mealFilter !== 'all') {
            r = r.filter(rz => {
                const mt = (rz.mealTime || rz.mahlzeit || '').toLowerCase();
                return mt === mealFilter || mt.includes(mealFilter);
            });
        }
        if (showOnlyFast) {
            r = r.filter(rz => { const t = rz.timeMinutes || rz.zeit; return t && Number(t) <= 30; });
        }
        if (profil.maxZeit > 0) {
            r = r.filter(rz => { const t = rz.timeMinutes || rz.zeit; return !t || Number(t) <= profil.maxZeit; });
        }
        return r;
    }, [allRezepte, mealFilter, showOnlyFast, profil]);

    // ── Luigi Matching ──
    const matchResult = useMemo(() => {
        if (!filteredRezepte.length || !produkte) return { canCook: [], almostReady: [], needMore: [] };
        let result = matchRecipesToInventory(filteredRezepte, produkte || []);
        if (showOnlyExpiring) {
            result = {
                canCook:     result.canCook.filter(r => r.usesExpiring),
                almostReady: result.almostReady.filter(r => r.usesExpiring),
                needMore:    result.needMore.filter(r => r.usesExpiring),
            };
        }
        return result;
    }, [filteredRezepte, produkte, showOnlyExpiring]);

    // ── Tagesplan ──
    const tagesplan = useMemo(() => {
        const all = [...matchResult.canCook, ...matchResult.almostReady];
        const plan = {};
        for (const { id } of MEAL_TYPES) {
            plan[id] = all.find(r => {
                const mt = (r.recipe?.mealTime || r.recipe?.mahlzeit || '').toLowerCase();
                return mt.includes(id);
            }) || null;
        }
        return plan;
    }, [matchResult]);

    // ── Ablaufende Produkte ──
    const expiringProducts = useMemo(() => {
        if (!produkte) return [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + 3);
        return produkte.filter(p => p.ablauf && new Date(p.ablauf) <= cutoff);
    }, [produkte]);

    // ── Einkaufsliste ──
    const addToShoppingList = async (items) => {
        if (!activeUserId || !items.length) return;
        for (const name of items) {
            await db.einkaufsliste.add({
                id: `el-${Date.now()}-${Math.random()}`,
                person_id: activeUserId, name,
                checked: false, created_at: Date.now(), liste_id: null,
            });
        }
    };

    // ── Kochen starten ──
    const startCooking = (recipe) => { window.location.hash = `#/rezept/${recipe.id}`; };

    // ── Chef Aivo: KI-Rezepte holen ──
    const fetchAivoRezepte = useCallback(async () => {
        const provider = localStorage.getItem('ai_provider') || 'groq';
        const apiKey   = localStorage.getItem('ai_key') || '';
        if (!apiKey) { setAivoError('Kein API-Key – bitte in Einstellungen eintragen.'); return; }

        setAivoLoading(true);
        setAivoError('');
        try {
            const rezepte = await askAivoForRecipes({
                provider, apiKey,
                produkte,
                kochProfil: buildProfilText(profil),
                anzahl: 4,
            });
            setAivoRezepte(rezepte);
            setSavedIds(new Set());
        } catch (err) {
            setAivoError(err.message);
        } finally {
            setAivoLoading(false);
        }
    }, [produkte, profil]);

    // ── KI-Rezept speichern ──
    const saveAivoRezept = async (rezept) => {
        if (!activeUserId) return;
        const id = `ki-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await db.eigene_rezepte.add({
            id,
            person_id:  activeUserId,
            name:       rezept.name,
            kategorie:  'KI-Rezept',
            küche:      (rezept.tags || []).join(', '),
            anleitung:  rezept.anleitung || '',
            portionen:  rezept.portionen || profil.portionen || 2,
            zeit:       rezept.zeit || 0,
            mahlzeit:   rezept.mahlzeit || 'mittag',
            zutaten:    rezept.zutaten || [],
            tags:       rezept.tags || [],
            created_at: new Date().toISOString(),
        });
        setSavedIds(prev => new Set([...prev, rezept.name]));
    };

    // ── KI-Rezept verwerfen ──
    const discardAivoRezept = (rezept) => {
        setAivoRezepte(prev => prev.filter(r => r.name !== rezept.name));
    };

    const isLoading = produkte === undefined || baseRezepte === undefined;
    const { canCook, almostReady, needMore } = matchResult;
    const isEmpty   = !isLoading && !isThinking &&
                      canCook.length === 0 && almostReady.length === 0 && needMore.length === 0;
    const showLuigi = engine === 'luigi' || engine === 'beide';
    const showAivo  = engine === 'aivo'  || engine === 'beide';
    const hasApiKey = !!localStorage.getItem('ai_key');

    return (
        <div className="koch-page">

            {/* ── Page Header ── */}
            <div className="koch-page-header">
                <div className="kph-left">
                    <div className="kph-title">Koch</div>
                    <div className="kph-subtitle">
                        {engine === 'aivo'  ? 'Chef Aivo – kreativ & frisch'  :
                         engine === 'luigi' ? 'Chef Luigi – dein Vorrat zählt' :
                                             'Chef Aivo & Chef Luigi'}
                    </div>
                </div>
                <div className="kph-dots">
                    <span className={`kph-dot${showAivo  ? ' on aivo'  : ''}`} title="Chef Aivo">🧠</span>
                    <span className={`kph-dot${showLuigi ? ' on luigi' : ''}`} title="Chef Luigi">👨‍🍳</span>
                </div>
            </div>

            {/* ── Engine Switcher ── */}
            <EngineSwitcher engine={engine} onChange={changeEngine} />

            {/* ── Ablauf-Alert ── */}
            {!isLoading && expiringProducts.length > 0 && (
                <div className="koch-expiry-alert">
                    ⚠️ <strong>{expiringProducts.length} {expiringProducts.length === 1 ? 'Produkt läuft' : 'Produkte laufen'}</strong> bald ab –{' '}
                    {expiringProducts.slice(0, 3).map(p => p.name).join(', ')}
                </div>
            )}

            {/* ── Chef-Aivo-Profil (klappbar) ── */}
            {showAivo && (
                <KochProfil
                    profil={profil}
                    userId={activeUserId || 'default'}
                    onChange={setProfil}
                    chef="aivo"
                />
            )}

            {/* ── Chef-Luigi-Profil (klappbar) ── */}
            {showLuigi && (
                <KochProfil
                    profil={profil}
                    userId={activeUserId || 'default'}
                    onChange={setProfil}
                    chef="luigi"
                />
            )}

            {/* ── Filter Chips (Luigi + Beide) ── */}
            {showLuigi && (
                <div className="koch-filter-chips">
                    <button className={`kfc${mealFilter === 'all' && !showOnlyExpiring && !showOnlyFast ? ' active' : ''}`}
                        onClick={() => { setMealFilter('all'); setShowOnlyExpiring(false); setShowOnlyFast(false); }}>Alle</button>
                    <button className={`kfc${showOnlyFast ? ' active' : ''}`}
                        onClick={() => setShowOnlyFast(v => !v)}>⚡ Schnell</button>
                    <button className={`kfc${mealFilter === 'fruehstueck' ? ' active' : ''}`}
                        onClick={() => setMealFilter(v => v === 'fruehstueck' ? 'all' : 'fruehstueck')}>🌅 Frühstück</button>
                    <button className={`kfc${mealFilter === 'mittag' ? ' active' : ''}`}
                        onClick={() => setMealFilter(v => v === 'mittag' ? 'all' : 'mittag')}>☀️ Mittag</button>
                    <button className={`kfc${mealFilter === 'abend' ? ' active' : ''}`}
                        onClick={() => setMealFilter(v => v === 'abend' ? 'all' : 'abend')}>🌙 Abend</button>
                    <button className={`kfc expiring${showOnlyExpiring ? ' active' : ''}`}
                        onClick={() => setShowOnlyExpiring(v => !v)}>🔴 Reste</button>
                </div>
            )}

            {/* ── Lade-Zustand ── */}
            {(isLoading || isThinking) && (
                <div className="koch-loading">
                    <div className="koch-dots"><span /><span /><span /></div>
                    <div className="koch-loading-text">
                        {engine === 'aivo' ? '🧠 Chef Aivo denkt…' : engine === 'luigi' ? '👨‍🍳 Chef Luigi schaut nach…' : 'Beide Köche denken…'}
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            {!isLoading && !isThinking && (
                <>
                    {/* ────── CHEF AIVO ────── */}
                    {showAivo && (
                        <div className="aivo-section">
                            <div className="aivo-section-header">
                                <div className="aivo-section-title">🧠 Chef Aivos Vorschläge</div>
                                <button
                                    className={`aivo-fetch-btn${aivoLoading ? ' loading' : ''}`}
                                    onClick={fetchAivoRezepte}
                                    disabled={aivoLoading || !hasApiKey}
                                    title={!hasApiKey ? 'API-Key in Einstellungen eintragen' : 'Neue Rezepte von Chef Aivo holen'}
                                >
                                    {aivoLoading ? '⏳ Denkt…' : '✨ Neue Ideen'}
                                </button>
                            </div>

                            {!hasApiKey && (
                                <div className="aivo-no-key-hint">
                                    🔑 API-Key nötig – <a href="#/einstellungen">Einstellungen → KI-Koch</a>
                                </div>
                            )}

                            {aivoError && (
                                <div className="aivo-fetch-error">⚠️ {aivoError}</div>
                            )}

                            {aivoLoading && (
                                <div className="aivo-loading">
                                    <div className="koch-dots"><span /><span /><span /></div>
                                    <div className="koch-loading-text">Chef Aivo erfindet Rezepte…</div>
                                </div>
                            )}

                            {aivoRezepte.length > 0 && (
                                <div className="koch-cards">
                                    {aivoRezepte.map((rz, i) => (
                                        <AivoCard
                                            key={i}
                                            rezept={rz}
                                            onSave={saveAivoRezept}
                                            onDiscard={discardAivoRezept}
                                            isSaved={savedIds.has(rz.name)}
                                        />
                                    ))}
                                </div>
                            )}

                            {aivoRezepte.length === 0 && !aivoLoading && !aivoError && hasApiKey && (
                                <div className="aivo-empty-hint">
                                    Tippe auf „✨ Neue Ideen" – Chef Aivo erfindet Rezepte passend zu deinem Vorrat!
                                </div>
                            )}
                        </div>
                    )}

                    {/* ────── CHEF LUIGI ────── */}
                    {showLuigi && (
                        <>
                            {showAivo && <div className="chef-divider">👨‍🍳 Chef Luigi – was du jetzt kochen kannst</div>}

                            <Tagesplan plan={tagesplan} />

                            <LuigiSection title="✅ Sofort kochen" results={canCook}
                                profile={profileRecord} onAddToShoppingList={addToShoppingList} onCook={startCooking} />
                            <LuigiSection title="🔸 Fast fertig" results={almostReady}
                                profile={profileRecord} onAddToShoppingList={addToShoppingList} onCook={startCooking} />
                            <LuigiSection title="💡 Ideen" results={needMore}
                                profile={profileRecord} onAddToShoppingList={addToShoppingList} onCook={startCooking} />

                            {isEmpty && (
                                <div className="koch-empty">
                                    <div className="koch-empty-icon">🛒</div>
                                    <div className="koch-empty-title">
                                        {showOnlyExpiring ? 'Keine ablaufenden Zutaten in Rezepten' : 'Keine passenden Rezepte'}
                                    </div>
                                    <div className="koch-empty-hint">
                                        {showOnlyExpiring ? 'Deaktiviere den Reste-Filter.'
                                            : 'Füge Produkte hinzu oder lass Chef Aivo neue Rezepte erfinden!'}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Chef Aivo Chat immer am Ende wenn Aivo aktiv */}
                    {showAivo && (
                        <AivoChat produkte={produkte} userProfile={profileRecord} kochProfil={profil} />
                    )}
                </>
            )}
        </div>
    );
}
