import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import { KochBot } from '../bots/KochBot';
import { askAI } from '../utils/aiApi';
import './KochAssistent.css';

const MEAL_CATEGORIES = [
    { id: 'all',         name: 'Alle',      icon: '🍽️' },
    { id: 'fruehstueck', name: 'Frühstück', icon: '🌅' },
    { id: 'mittag',      name: 'Mittag',    icon: '☀️' },
    { id: 'abend',       name: 'Abend',     icon: '🌙' },
    { id: 'snack',       name: 'Snacks',    icon: '🍿' }
];

const MEAL_COLORS = {
    fruehstueck: '#FCD34D',
    mittag:      '#60A5FA',
    abend:       '#A78BFA',
    snack:       '#34D399',
    salat:       '#86EFAC',
    all:         '#F97316'
};

const kochBot = new KochBot();

// ── Rezeptkarte ────────────────────────────────────────────
const RecipeCard = ({ recipe, getMealColor, getMealIcon, showMissing }) => {
    const color = getMealColor(recipe.mahlzeit);
    const safety = recipe.safety;

    return (
        <div className={`recipe-card ${recipe.usesExpiring ? 'expiring' : ''}`}>
            {recipe.usesExpiring && <div className="expiring-badge">⚠️ Bald ablaufend</div>}

            <div className="recipe-card-visual" style={{ background: `${color}33` }}>
                <span className="recipe-icon">{getMealIcon(recipe.mahlzeit)}</span>
            </div>

            <div className="recipe-card-body">
                <h4>{recipe.name}</h4>

                {safety && (
                    <div className={`safety-badge ${safety.status}`}>
                        {safety.status === 'safe'    && '✓ Sicher für dich'}
                        {safety.status === 'adapted' && '↻ Angepasst'}
                        {safety.status === 'warning' && '⚠ Enthält Allergene'}
                    </div>
                )}

                {safety?.status === 'adapted' && safety.replacements.length > 0 && (
                    <div className="substitution-hints">
                        {safety.replacements.slice(0, 2).map((r, i) => (
                            <div key={i} className="substitution-row">
                                <span className="sub-from">{r.ingredient}</span>
                                <span className="sub-arrow">→</span>
                                <span className="sub-to">{r.alternatives[0]}</span>
                            </div>
                        ))}
                        {safety.replacements.length > 2 && (
                            <div className="sub-more">+{safety.replacements.length - 2} weitere</div>
                        )}
                    </div>
                )}

                <div className="recipe-meta">
                    <span>👥 {recipe.portionen}</span>
                    <span>⏱ {recipe.zeit} Min.</span>
                </div>

                {showMissing && recipe.match ? (
                    <>
                        <div className="match-badge partial">
                            {recipe.match.available}/{recipe.match.total} Zutaten
                        </div>
                        <div className="missing-items">
                            <strong>Fehlt:</strong>{' '}
                            {recipe.match.missingItems.slice(0, 2).join(', ')}
                            {recipe.match.missingItems.length > 2 && ` +${recipe.match.missingItems.length - 2}`}
                        </div>
                    </>
                ) : (
                    <div className="match-badge complete">✓ Alle Zutaten da</div>
                )}
            </div>
        </div>
    );
};

// ── Haupt-Komponente ───────────────────────────────────────
const KochAssistent = () => {
    const { activeUserId } = useUser();
    const [mealFilter, setMealFilter] = useState('all');

    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );
    const baseRezepte  = useLiveQuery(() => db.base_rezepte.toArray());
    const eigeneRezepte = useLiveQuery(
        () => db.eigene_rezepte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );
    const userProfile = useLiveQuery(
        () => db.profile.where('person_id').equals(activeUserId).first(),
        [activeUserId]
    );

    const allRezepte = useMemo(() => {
        const base   = baseRezepte?.filter(r => !r.hidden).map(r => ({ ...r, type: 'base' })) || [];
        const eigene = eigeneRezepte?.map(r => ({ ...r, type: 'eigene' })) || [];
        return [...base, ...eigene];
    }, [baseRezepte, eigeneRezepte]);

    const normalizeText = (text) =>
        text.toLowerCase()
            .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').trim();

    const hasIngredient = (ingredientName) => {
        if (!produkte) return false;
        const normalized = normalizeText(ingredientName);
        return produkte.some(p => {
            const pn = normalizeText(p.name);
            return pn.includes(normalized) || normalized.includes(pn);
        });
    };

    const analyzeRecipe = (recipe) => {
        if (!recipe.zutaten?.length) return { available: 0, missing: 0, total: 0, score: 0, missingItems: [] };
        let available = 0;
        const missingItems = [];
        recipe.zutaten.forEach(z => {
            if (hasIngredient(z.name)) available++;
            else missingItems.push(z.name);
        });
        const total = recipe.zutaten.length;
        return { available, missing: total - available, total, score: (available / total) * 100, missingItems };
    };

    const expiringProducts = useMemo(() => {
        if (!produkte) return [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + 3);
        return produkte.filter(p => new Date(p.ablauf) <= cutoff).map(p => normalizeText(p.name));
    }, [produkte]);

    const usesExpiringProducts = (recipe) => {
        if (!recipe.zutaten || !expiringProducts.length) return false;
        return recipe.zutaten.some(z => {
            const n = normalizeText(z.name);
            return expiringProducts.some(exp => n.includes(exp) || exp.includes(n));
        });
    };

    const profile = userProfile || { dietary_restrictions: [] };

    const { categorizedRecipes, tagesplan } = useMemo(() => {
        if (!allRezepte.length || !produkte) {
            return { categorizedRecipes: { canCook: [], almostReady: [], needMore: [] }, tagesplan: {} };
        }

        const analyzed = allRezepte.map(r => ({
            ...r,
            match:       analyzeRecipe(r),
            usesExpiring: usesExpiringProducts(r),
            safety:      kochBot.checkSafety(r, profile)
        }));

        const byFilter = mealFilter === 'all'
            ? analyzed
            : analyzed.filter(r => r.mahlzeit === mealFilter);

        const canCook     = byFilter.filter(r => r.match.score === 100).sort((a, b) => b.usesExpiring - a.usesExpiring);
        const almostReady = byFilter.filter(r => r.match.score >= 70 && r.match.score < 100).sort((a, b) => b.match.score - a.match.score);
        const needMore    = byFilter.filter(r => r.match.score > 0  && r.match.score < 70).sort((a, b) => b.match.score - a.match.score).slice(0, 5);

        // Tagesplan: bestes Rezept pro Mahlzeit-Typ (unabhängig vom Filter)
        const tagesplan = {};
        for (const meal of ['fruehstueck', 'mittag', 'abend', 'snack']) {
            const mealRecipes = analyzed.filter(r => r.mahlzeit === meal);
            tagesplan[meal] =
                mealRecipes.find(r => r.match.score === 100) ||
                mealRecipes.find(r => r.match.score >= 70) ||
                null;
        }

        return { categorizedRecipes: { canCook, almostReady, needMore }, tagesplan };
    }, [allRezepte, produkte, mealFilter, expiringProducts, userProfile]);

    const getMealIcon  = (m) => MEAL_CATEGORIES.find(c => c.id === m)?.icon  ?? '🍽️';
    const getMealName  = (m) => MEAL_CATEGORIES.find(c => c.id === m)?.name  ?? m;
    const getMealColor = (m) => MEAL_COLORS[m] ?? MEAL_COLORS.all;
    const getLink      = (r) => `/rezept/${r.id}`;

    // ── KI-Chat ─────────────────────────────────────────────
    const [chatOpen,    setChatOpen]    = useState(false);
    const [chatInput,   setChatInput]   = useState('');
    const [chatHistory, setChatHistory] = useState([]); // { role, content }
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError,   setChatError]   = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, chatOpen]);

    const sendMessage = async () => {
        const q = chatInput.trim();
        if (!q || chatLoading) return;
        const provider = localStorage.getItem('ai_provider') || 'groq';
        const apiKey   = localStorage.getItem('ai_key') || '';

        setChatHistory(h => [...h, { role: 'user', content: q }]);
        setChatInput('');
        setChatLoading(true);
        setChatError('');

        try {
            const answer = await askAI({
                provider,
                apiKey,
                question: q,
                history: chatHistory,
                context: { produkte, profile: userProfile },
            });
            setChatHistory(h => [...h, { role: 'assistant', content: answer }]);
        } catch (err) {
            setChatError(err.message);
            setChatHistory(h => h.slice(0, -1)); // Remove last user msg on error
        } finally {
            setChatLoading(false);
        }
    };

    const addMissingToShoppingList = async (missingItems) => {
        try {
            for (const item of missingItems) {
                await db.einkaufsliste.add({
                    id: `shopping-${Date.now()}-${Math.random()}`,
                    person_id: activeUserId,
                    name: item,
                    menge: '',
                    checked: false,
                    kategorie: 'sonstiges',
                    created_at: new Date().toISOString()
                });
            }
            alert(`${missingItems.length} Zutat${missingItems.length > 1 ? 'en' : ''} zur Einkaufsliste hinzugefügt!`);
        } catch (err) {
            console.error('Error:', err);
        }
    };

    if (!produkte || produkte.length === 0) {
        return (
            <div className="page koch-assistent">
                <h2>👨‍🍳 Koch-Assistent</h2>
                <div className="empty-state">
                    <p>🧊 Dein Kühlschrank ist leer</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Füge erst Produkte hinzu, damit ich Rezepte vorschlagen kann!
                    </p>
                    <Link to="/produkte" className="btn primary">📦 Produkte hinzufügen</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page koch-assistent">
            <h2>👨‍🍳 Koch-Assistent</h2>
            <p className="subtitle">
                {produkte.length} Produkte · {categorizedRecipes.canCook.length} sofort kochbar
                {profile.dietary_restrictions?.length > 0 && (
                    <span className="allergy-active-hint"> · 🥗 Allergieprofil aktiv</span>
                )}
            </p>

            {/* ── Tagesplan ────────────────────────────────── */}
            <div className="tagesplan-section">
                <h3 className="tagesplan-title">Was koche ich heute?</h3>
                <div className="tagesplan-scroll">
                    {['fruehstueck', 'mittag', 'abend', 'snack'].map(meal => {
                        const recipe = tagesplan[meal];
                        const color  = getMealColor(meal);
                        return (
                            <div key={meal} className="tagesplan-card" style={{ borderTopColor: color }}>
                                <div className="tagesplan-card-header" style={{ background: `${color}28` }}>
                                    <span className="tagesplan-meal-icon">{getMealIcon(meal)}</span>
                                    <span className="tagesplan-meal-name">{getMealName(meal)}</span>
                                </div>
                                {recipe ? (
                                    <Link to={getLink(recipe)} className="tagesplan-card-body">
                                        <span className="tagesplan-recipe-name">{recipe.name}</span>
                                        <div className="tagesplan-meta">
                                            <span>⏱ {recipe.zeit} Min.</span>
                                            {recipe.safety && (
                                                <span className={`safety-badge mini ${recipe.safety.status}`}>
                                                    {recipe.safety.status === 'safe'    && '✓'}
                                                    {recipe.safety.status === 'adapted' && '↻'}
                                                    {recipe.safety.status === 'warning' && '⚠'}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="tagesplan-card-empty">Nichts Passendes</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Mahlzeit-Filter ─────────────────────────── */}
            <div className="card meal-filter">
                <div className="meal-buttons">
                    {MEAL_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`btn small ${mealFilter === cat.id ? 'primary' : 'secondary'}`}
                            onClick={() => setMealFilter(cat.id)}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Jetzt kochen ─────────────────────────────── */}
            {categorizedRecipes.canCook.length > 0 && (
                <div className="recipe-section">
                    <h3 className="section-title">✅ Jetzt kochen ({categorizedRecipes.canCook.length})</h3>
                    <div className="recipe-grid">
                        {categorizedRecipes.canCook.map(r => (
                            <Link key={`${r.type}-${r.id}`} to={getLink(r)} className="recipe-card-link">
                                <RecipeCard recipe={r} getMealColor={getMealColor} getMealIcon={getMealIcon} />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Fast fertig ──────────────────────────────── */}
            {categorizedRecipes.almostReady.length > 0 && (
                <div className="recipe-section">
                    <h3 className="section-title">🔸 Fast fertig ({categorizedRecipes.almostReady.length})</h3>
                    <div className="recipe-grid">
                        {categorizedRecipes.almostReady.map(r => (
                            <div key={`${r.type}-${r.id}`} className="recipe-card-container">
                                <Link to={getLink(r)} className="recipe-card-link">
                                    <RecipeCard recipe={r} getMealColor={getMealColor} getMealIcon={getMealIcon} showMissing />
                                </Link>
                                <button
                                    className="btn small secondary add-to-list-btn"
                                    onClick={() => addMissingToShoppingList(r.match.missingItems)}
                                >
                                    + Einkaufsliste
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Mehr Zutaten nötig ───────────────────────── */}
            {categorizedRecipes.needMore.length > 0 && (
                <div className="recipe-section">
                    <h3 className="section-title">💡 Mehr Zutaten nötig</h3>
                    <div className="recipe-list-compact">
                        {categorizedRecipes.needMore.map(r => (
                            <div key={`${r.type}-${r.id}`} className="recipe-item-compact">
                                <Link to={getLink(r)}>
                                    <span className="recipe-icon-small">{getMealIcon(r.mahlzeit)}</span>
                                    <span className="recipe-name">{r.name}</span>
                                    <span className="match-score">{Math.round(r.match.score)}%</span>
                                    {r.safety && (
                                        <span className={`safety-badge mini ${r.safety.status}`}>
                                            {r.safety.status === 'safe'    && '✓'}
                                            {r.safety.status === 'adapted' && '↻'}
                                            {r.safety.status === 'warning' && '⚠'}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {categorizedRecipes.canCook.length === 0 &&
             categorizedRecipes.almostReady.length === 0 &&
             categorizedRecipes.needMore.length === 0 && (
                <div className="empty-state">
                    <p>🔍 Keine passenden Rezepte gefunden</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Probiere einen anderen Filter oder füge mehr Produkte hinzu!
                    </p>
                </div>
            )}

            {/* ── KI-Koch Chat ─────────────────────────────── */}
            <div className="ai-chat-section">
                <button
                    className="ai-chat-toggle"
                    onClick={() => setChatOpen(o => !o)}
                >
                    <span>🤖 KI-Koch fragen</span>
                    <div className="ai-toggle-right">
                        {chatHistory.length > 0 && (
                            <button
                                className="chat-clear-btn"
                                onClick={e => { e.stopPropagation(); setChatHistory([]); setChatError(''); }}
                                title="Chat zurücksetzen"
                            >↺</button>
                        )}
                        <span className={`ai-chevron ${chatOpen ? 'open' : ''}`}>▼</span>
                    </div>
                </button>

                {chatOpen && (
                    <div className="ai-chat-body">
                        {!localStorage.getItem('ai_key') && (
                            <div className="ai-no-key">
                                🔑 Noch kein API-Key gesetzt.{' '}
                                <a href="#/einstellungen">Einstellungen → KI-Koch</a>
                            </div>
                        )}

                        {/* Vorschläge wenn Chat leer */}
                        {chatHistory.length === 0 && (
                            <div className="ai-suggestions">
                                {[
                                    'Was kann ich heute kochen?',
                                    'Rezept mit Resten aus meinem Kühlschrank',
                                    'Was kann ich statt Milch verwenden?',
                                ].map(s => (
                                    <button
                                        key={s}
                                        className="ai-suggestion-chip"
                                        onClick={() => { setChatInput(s); }}
                                    >{s}</button>
                                ))}
                            </div>
                        )}

                        {/* Nachrichten */}
                        <div className="ai-messages">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`ai-msg ${msg.role}`}>
                                    {msg.role === 'assistant' && (
                                        <span className="ai-msg-avatar">🤖</span>
                                    )}
                                    <div className="ai-msg-bubble">{msg.content}</div>
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="ai-msg assistant">
                                    <span className="ai-msg-avatar">🤖</span>
                                    <div className="ai-msg-bubble ai-typing">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            )}
                            {chatError && (
                                <div className="ai-error">{chatError}</div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="ai-input-row">
                            <input
                                type="text"
                                className="ai-input"
                                placeholder="Frag den KI-Koch..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                disabled={chatLoading}
                            />
                            <button
                                className="ai-send-btn"
                                onClick={sendMessage}
                                disabled={chatLoading || !chatInput.trim()}
                            >
                                {chatLoading ? '⏳' : '↑'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KochAssistent;
