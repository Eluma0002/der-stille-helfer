import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import { matchRecipesToInventory } from '../utils/recipeMatching';
import { KochBot } from '../bots/KochBot';
import './AlgoKoch.css';

const kochBot = new KochBot();

// ─── Chef-Nachrichten ────────────────────────────────────────────────────────

const DENK_NACHRICHTEN = [
    '🍳 Ich schaue was du hast...',
    '🥄 Überlege mir was Leckeres...',
    '🧑‍🍳 Durchsuche meine Rezeptsammlung...',
];

function buildChefMessage(canCook, almostReady, expiringProducts) {
    const parts = [];

    if (expiringProducts.length > 0) {
        const names = expiringProducts.slice(0, 3).map(p => p.name).join(', ');
        parts.push(`⚠️ ${names} ${expiringProducts.length === 1 ? 'läuft' : 'laufen'} bald ab – ich zeige dir Gerichte die ${expiringProducts.length === 1 ? 'es' : 'sie'} verbrauchen!`);
    }

    if (canCook.length > 0) {
        parts.push(`Du kannst sofort ${canCook.length} ${canCook.length === 1 ? 'Gericht' : 'Gerichte'} kochen!`);
    } else if (almostReady.length > 0) {
        parts.push(`${almostReady.length} ${almostReady.length === 1 ? 'Gericht fehlt' : 'Gerichten fehlen'} nur noch 1-2 Zutaten.`);
    } else {
        parts.push('Ich habe deinen Kühlschrank durchsucht. Füge mehr Produkte hinzu für bessere Vorschläge!');
    }

    return parts.join(' ');
}

function buildRecipeReason(result) {
    const { score, available, total, missingItems, expiringIngredients, usesExpiring } = result;

    if (score === 100) {
        if (usesExpiring && expiringIngredients.length > 0) {
            const names = expiringIngredients.slice(0, 2).join(' und ');
            return `Perfekt für dein${expiringIngredients.length === 1 ?'e' : ''} ${names} ${expiringIngredients.length === 1 ? 'das' : 'die'} bald ablaufen!`;
        }
        return `Du hast alle ${total} Zutaten!`;
    }

    if (missingItems.length === 1) {
        return `Nur ${missingItems[0]} fehlt dir noch.`;
    }
    if (missingItems.length <= 3) {
        return `Noch ${missingItems.length} Zutaten fehlen: ${missingItems.slice(0, 3).join(', ')}.`;
    }
    return `${available} von ${total} Zutaten vorhanden (${Math.round(score)}%).`;
}

function getExpiryDays(ablauf) {
    if (!ablauf) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(ablauf);
    exp.setHours(0, 0, 0, 0);
    return Math.round((exp - today) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ days }) {
    if (days === null) return null;
    if (days < 0) return <span className="expiry-badge expired">abgelaufen</span>;
    if (days === 0) return <span className="expiry-badge today">heute</span>;
    if (days === 1) return <span className="expiry-badge soon">morgen</span>;
    if (days <= 3) return <span className="expiry-badge soon">noch {days} Tage</span>;
    return null;
}

// ─── Rezept-Karte ─────────────────────────────────────────────────────────────

function AlgoRecipeCard({ result, profile, onAddToShoppingList, compact = false }) {
    const { recipe, score, missingItems, usesExpiring, expiringIngredients } = result;
    const title = recipe.title || recipe.name || 'Rezept';
    const timeMinutes = recipe.timeMinutes || recipe.zeit;
    const reason = buildRecipeReason(result);

    const safety = useMemo(() => {
        if (!profile) return null;
        return kochBot.checkSafety(recipe, profile);
    }, [recipe, profile]);

    if (compact) {
        return (
            <div className="algo-recipe-card compact">
                <div className="arc-title">{title}</div>
                <div className="arc-meta">
                    <span className="arc-score">{Math.round(score)}%</span>
                    {timeMinutes && <span className="arc-time">⏱ {timeMinutes} Min.</span>}
                    {usesExpiring && <span className="arc-expiring-dot" title="Verbraucht ablaufende Zutaten">🔴</span>}
                </div>
            </div>
        );
    }

    return (
        <div className={`algo-recipe-card${usesExpiring ? ' uses-expiring' : ''}`}>
            <div className="arc-header">
                <div className="arc-title">{title}</div>
                <div className="arc-badges">
                    {usesExpiring && (
                        <span className="arc-badge expiring" title="Verbraucht ablaufende Zutaten">🔴 Reste</span>
                    )}
                    {safety && safety.status === 'warning' && (
                        <span className="arc-badge warning" title={safety.message}>⚠️</span>
                    )}
                    {safety && safety.status === 'adapted' && (
                        <span className="arc-badge adapted" title={safety.message}>🔄</span>
                    )}
                </div>
            </div>

            <div className="arc-reason">{reason}</div>

            {expiringIngredients && expiringIngredients.length > 0 && (
                <div className="arc-expiring-ingredients">
                    {expiringIngredients.map(ing => (
                        <span key={ing} className="arc-expiring-tag">{ing}</span>
                    ))}
                </div>
            )}

            <div className="arc-footer">
                <div className="arc-meta">
                    <span className="arc-score-pill">{Math.round(score)}% vorhanden</span>
                    {timeMinutes && <span className="arc-time">⏱ {timeMinutes} Min.</span>}
                </div>
                {missingItems && missingItems.length > 0 && (
                    <button
                        className="arc-btn-add"
                        onClick={() => onAddToShoppingList(missingItems)}
                    >
                        + Zur Einkaufsliste
                    </button>
                )}
            </div>

            {safety && safety.status !== 'safe' && safety.replacements && safety.replacements.length > 0 && (
                <div className="arc-safety">
                    <span className="arc-safety-label">{safety.message}</span>
                    {safety.replacements.slice(0, 2).map((r, i) => (
                        <span key={i} className="arc-safety-item">
                            {r.ingredient} → {r.alternatives.slice(0, 2).join(' / ') || '?'}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Haupt-Komponente ──────────────────────────────────────────────────────────

export default function AlgoKoch() {
    const { activeUserId } = useUser();

    const [isThinking, setIsThinking] = useState(true);
    const [thinkMsg, setThinkMsg] = useState(DENK_NACHRICHTEN[0]);
    const [mealFilter, setMealFilter] = useState('all');
    const [showOnlyExpiring, setShowOnlyExpiring] = useState(false);
    const [showOnlyFast, setShowOnlyFast] = useState(false);

    // ── Daten laden ──
    const produkte = useLiveQuery(
        () => activeUserId
            ? db.produkte.where('person_id').equals(activeUserId).toArray()
            : [],
        [activeUserId]
    );

    const baseRezepte = useLiveQuery(() => db.base_rezepte.toArray(), []);
    const eigeneRezepte = useLiveQuery(
        () => activeUserId
            ? db.eigene_rezepte.where('person_id').equals(activeUserId).toArray()
            : [],
        [activeUserId]
    );
    const profileRecord = useLiveQuery(
        () => activeUserId
            ? db.profile.where('person_id').equals(activeUserId).first()
            : null,
        [activeUserId]
    );

    // ── "Denken"-Animation beim ersten Laden und bei Filter-Wechsel ──
    useEffect(() => {
        setIsThinking(true);
        const msgs = DENK_NACHRICHTEN;
        let idx = 0;
        const iv = setInterval(() => {
            idx = (idx + 1) % msgs.length;
            setThinkMsg(msgs[idx]);
        }, 500);
        const t = setTimeout(() => {
            clearInterval(iv);
            setIsThinking(false);
        }, 1500);
        return () => { clearInterval(iv); clearTimeout(t); };
    }, [mealFilter, showOnlyExpiring, showOnlyFast]);

    // ── Rezepte filtern ──
    const allRezepte = useMemo(() => [
        ...(baseRezepte || []),
        ...(eigeneRezepte || [])
    ], [baseRezepte, eigeneRezepte]);

    const filteredRezepte = useMemo(() => {
        let r = allRezepte;
        if (mealFilter !== 'all') {
            r = r.filter(rz => {
                const mt = (rz.mealTime || rz.mahlzeit || '').toLowerCase();
                return mt === mealFilter || mt.includes(mealFilter);
            });
        }
        if (showOnlyFast) {
            r = r.filter(rz => {
                const t = rz.timeMinutes || rz.zeit;
                return t && Number(t) <= 30;
            });
        }
        return r;
    }, [allRezepte, mealFilter, showOnlyFast]);

    // ── Matching ──
    const matchResult = useMemo(() => {
        if (!filteredRezepte.length || produkte === undefined) {
            return { canCook: [], almostReady: [], needMore: [] };
        }
        const inv = produkte || [];
        let result = matchRecipesToInventory(filteredRezepte, inv);
        if (showOnlyExpiring) {
            result = {
                canCook: result.canCook.filter(r => r.usesExpiring),
                almostReady: result.almostReady.filter(r => r.usesExpiring),
                needMore: result.needMore.filter(r => r.usesExpiring)
            };
        }
        return result;
    }, [filteredRezepte, produkte, showOnlyExpiring]);

    // ── Ablaufende Produkte (nächste 3 Tage) ──
    const expiringProducts = useMemo(() => {
        if (!produkte) return [];
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return produkte.filter(p => p.ablauf && new Date(p.ablauf) <= threeDaysFromNow);
    }, [produkte]);

    // ── Chef-Nachricht ──
    const chefMessage = useMemo(() => {
        if (isThinking) return thinkMsg;
        return buildChefMessage(matchResult.canCook, matchResult.almostReady, expiringProducts);
    }, [isThinking, thinkMsg, matchResult, expiringProducts]);

    // ── Zur Einkaufsliste hinzufügen ──
    const addToShoppingList = async (items) => {
        if (!activeUserId || !items.length) return;
        for (const name of items) {
            await db.einkaufsliste.add({
                id: `el-${Date.now()}-${Math.random()}`,
                person_id: activeUserId,
                name,
                checked: false,
                created_at: Date.now(),
                liste_id: null
            });
        }
    };

    const { canCook, almostReady, needMore } = matchResult;
    const isLoading = produkte === undefined || baseRezepte === undefined;

    return (
        <div className="algo-koch">
            {/* ── Chef-Header ── */}
            <div className="chef-header">
                <span className="chef-icon">👨‍🍳</span>
                <div>
                    <div className="chef-title">Dein stiller Helfer</div>
                    <div className="chef-subtitle">Algorithmischer Koch – kein Internet nötig</div>
                </div>
            </div>

            {/* ── Sprechblase ── */}
            <div className={`chef-speech${isThinking ? ' thinking' : ''}`}>
                {isThinking ? (
                    <span>
                        {thinkMsg}
                        <span className="thinking-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </span>
                ) : (
                    <span>{chefMessage}</span>
                )}
            </div>

            {/* ── Ablauf-Alarm-Banner ── */}
            {!isThinking && expiringProducts.length > 0 && (
                <div className="expiry-alert">
                    <span className="expiry-alert-icon">⚠️</span>
                    <div>
                        <strong>{expiringProducts.length} {expiringProducts.length === 1 ? 'Produkt läuft' : 'Produkte laufen'} bald ab:</strong>
                        <div className="expiry-alert-list">
                            {expiringProducts.map(p => (
                                <span key={p.id} className="expiry-alert-item">
                                    {p.name}
                                    <ExpiryBadge days={getExpiryDays(p.ablauf)} />
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filter-Chips ── */}
            <div className="algo-filter-chips">
                <button
                    className={`filter-chip${mealFilter === 'all' && !showOnlyExpiring && !showOnlyFast ? ' active' : ''}`}
                    onClick={() => { setMealFilter('all'); setShowOnlyExpiring(false); setShowOnlyFast(false); }}
                >
                    Alle
                </button>
                <button
                    className={`filter-chip${showOnlyFast ? ' active' : ''}`}
                    onClick={() => setShowOnlyFast(v => !v)}
                >
                    ⚡ Schnell
                </button>
                <button
                    className={`filter-chip${mealFilter === 'fruehstueck' ? ' active' : ''}`}
                    onClick={() => setMealFilter(v => v === 'fruehstueck' ? 'all' : 'fruehstueck')}
                >
                    🌅 Frühstück
                </button>
                <button
                    className={`filter-chip${mealFilter === 'mittag' ? ' active' : ''}`}
                    onClick={() => setMealFilter(v => v === 'mittag' ? 'all' : 'mittag')}
                >
                    ☀️ Mittag
                </button>
                <button
                    className={`filter-chip${mealFilter === 'abend' ? ' active' : ''}`}
                    onClick={() => setMealFilter(v => v === 'abend' ? 'all' : 'abend')}
                >
                    🌙 Abend
                </button>
                <button
                    className={`filter-chip expiring-chip${showOnlyExpiring ? ' active' : ''}`}
                    onClick={() => setShowOnlyExpiring(v => !v)}
                >
                    🔴 Reste
                </button>
            </div>

            {/* ── Lade-Zustand ── */}
            {isLoading && (
                <div className="algo-loading">
                    <div className="thinking-dots large">
                        <span>.</span><span>.</span><span>.</span>
                    </div>
                </div>
            )}

            {/* ── Sektionen ── */}
            {!isLoading && !isThinking && (
                <>
                    {/* Sofort kochen */}
                    {canCook.length > 0 && (
                        <div className="algo-section">
                            <div className="algo-section-title">
                                <span>✅ Sofort kochen</span>
                                <span className="algo-section-count">{canCook.length}</span>
                            </div>
                            <div className="algo-cards">
                                {canCook.map((result, i) => (
                                    <AlgoRecipeCard
                                        key={result.recipe.id || i}
                                        result={result}
                                        profile={profileRecord}
                                        onAddToShoppingList={addToShoppingList}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fast fertig */}
                    {almostReady.length > 0 && (
                        <div className="algo-section">
                            <div className="algo-section-title">
                                <span>🔸 Fast fertig (1-2 Zutaten fehlen)</span>
                                <span className="algo-section-count">{almostReady.length}</span>
                            </div>
                            <div className="algo-cards">
                                {almostReady.map((result, i) => (
                                    <AlgoRecipeCard
                                        key={result.recipe.id || i}
                                        result={result}
                                        profile={profileRecord}
                                        onAddToShoppingList={addToShoppingList}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ideen */}
                    {needMore.length > 0 && (
                        <div className="algo-section">
                            <div className="algo-section-title">
                                <span>💡 Ideen (mehr Zutaten nötig)</span>
                                <span className="algo-section-count">{needMore.length}</span>
                            </div>
                            <div className="algo-cards compact-list">
                                {needMore.map((result, i) => (
                                    <AlgoRecipeCard
                                        key={result.recipe.id || i}
                                        result={result}
                                        profile={profileRecord}
                                        onAddToShoppingList={addToShoppingList}
                                        compact
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Leer-Zustand */}
                    {canCook.length === 0 && almostReady.length === 0 && needMore.length === 0 && (
                        <div className="algo-empty">
                            <div className="algo-empty-icon">🛒</div>
                            <div className="algo-empty-title">
                                {showOnlyExpiring
                                    ? 'Keine ablaufenden Zutaten in Rezepten gefunden'
                                    : 'Keine passenden Rezepte gefunden'}
                            </div>
                            <div className="algo-empty-hint">
                                {showOnlyExpiring
                                    ? 'Deaktiviere den Reste-Filter um alle Rezepte zu sehen.'
                                    : 'Füge mehr Produkte unter Kühlschrank hinzu!'}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
