import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import { generateMealPlan, isKIConfigured } from '../utils/aiService';
import './Essensplan.css';

const TAGE_DE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MAHLZEIT_ICONS = {
    'Frühstück': '🌅',
    'Mittagessen': '☀️',
    'Abendessen': '🌙',
    'Snack': '🍿',
};

const getTodayDeName = () => {
    const idx = new Date().getDay(); // 0=So
    const map = [6, 0, 1, 2, 3, 4, 5]; // Mo=0
    return TAGE_DE[map[idx]];
};

const Essensplan = () => {
    const { activeUserId } = useUser();
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [expandedDay, setExpandedDay] = useState(getTodayDeName());

    const kiReady = isKIConfigured();

    // Lade aktuellen Wochenplan
    const latestPlan = useLiveQuery(async () => {
        const plans = await db.meal_plans
            .where('person_id').equals(activeUserId)
            .sortBy('created_at');
        return plans.length > 0 ? plans[plans.length - 1] : null;
    }, [activeUserId]);

    // Lade Inventar für KI
    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    // Lade Profil
    const profile = useLiveQuery(
        () => activeUserId ? db.profile.where('person_id').equals(activeUserId).first() : null,
        [activeUserId]
    );

    const handleGenerate = async () => {
        if (!kiReady) return;
        setGenerating(true);
        setError('');
        try {
            const plan = await generateMealPlan(produkte || [], profile);
            const weekStart = new Date();
            // Auf Montag zurücksetzen
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);

            await db.meal_plans.add({
                person_id: activeUserId,
                created_at: new Date().toISOString(),
                week_start: weekStart.toISOString().split('T')[0],
                zusammenfassung: plan.zusammenfassung,
                tage: plan.tage
            });
        } catch (err) {
            setError(err.message || 'Fehler beim Erstellen des Essensplans');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!latestPlan) return;
        if (!window.confirm('Aktuellen Wochenplan löschen?')) return;
        await db.meal_plans.delete(latestPlan.id);
    };

    const today = getTodayDeName();

    // Tagesplan für "Heute"
    const todayPlan = useMemo(() => {
        if (!latestPlan?.tage) return null;
        return latestPlan.tage.find(t => t.tag === today);
    }, [latestPlan, today]);

    return (
        <div className="page essensplan-page">
            <div className="essensplan-header">
                <h2>📅 Wochenessensplan</h2>
                {latestPlan && (
                    <button className="btn small secondary" onClick={handleDelete}>🗑️</button>
                )}
            </div>

            {error && <div className="error">{error}</div>}

            {!kiReady && (
                <div className="card essensplan-ki-hinweis">
                    <p>🔑 Für den KI-Essensplan wird ein API-Key benötigt.</p>
                    <p>Gehe zu <strong>Einstellungen → KI-Einstellungen</strong> und trage deinen Key ein.</p>
                </div>
            )}

            {/* Generieren-Button */}
            {kiReady && (
                <button
                    className={`btn primary essensplan-generate-btn ${generating ? 'loading' : ''}`}
                    onClick={handleGenerate}
                    disabled={generating}
                >
                    {generating ? (
                        <>⏳ KI erstellt deinen Plan...</>
                    ) : latestPlan ? (
                        <>🔄 Neuen Plan erstellen</>
                    ) : (
                        <>✨ Wochenplan erstellen</>
                    )}
                </button>
            )}

            {/* Kein Plan vorhanden */}
            {!latestPlan && !generating && (
                <div className="essensplan-empty">
                    <div className="essensplan-empty-icon">📅</div>
                    <p>Noch kein Wochenplan vorhanden</p>
                    {kiReady ? (
                        <p className="essensplan-empty-sub">Klicke auf "Wochenplan erstellen" — die KI analysiert deinen Vorrat und schlägt passende Mahlzeiten vor.</p>
                    ) : (
                        <p className="essensplan-empty-sub">Richte zuerst einen KI-API-Key ein.</p>
                    )}
                </div>
            )}

            {/* Plan vorhanden */}
            {latestPlan && (
                <>
                    {/* Zusammenfassung */}
                    <div className="card essensplan-summary">
                        <p className="essensplan-summary-text">💡 {latestPlan.zusammenfassung}</p>
                        <p className="essensplan-created">
                            Erstellt: {new Date(latestPlan.created_at).toLocaleDateString('de-DE', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Tages-Karten */}
                    <div className="essensplan-days">
                        {TAGE_DE.map(tag => {
                            const tagPlan = latestPlan.tage?.find(t => t.tag === tag);
                            const isToday = tag === today;
                            const isOpen = expandedDay === tag;

                            return (
                                <div
                                    key={tag}
                                    className={`essensplan-day-card ${isToday ? 'today' : ''}`}
                                >
                                    <button
                                        className="essensplan-day-header"
                                        onClick={() => setExpandedDay(isOpen ? null : tag)}
                                    >
                                        <div className="essensplan-day-title">
                                            {isToday && <span className="today-badge">Heute</span>}
                                            <span className="day-name">{tag}</span>
                                        </div>
                                        {tagPlan && (
                                            <span className="day-preview">
                                                {tagPlan.mahlzeiten?.map(m => m.rezept).join(' · ')}
                                            </span>
                                        )}
                                        <span className="day-arrow">{isOpen ? '▲' : '▼'}</span>
                                    </button>

                                    {isOpen && tagPlan && (
                                        <div className="essensplan-day-meals">
                                            {tagPlan.mahlzeiten?.map((mahlzeit, i) => (
                                                <div key={i} className="meal-row">
                                                    <div className="meal-type">
                                                        <span className="meal-icon">{MAHLZEIT_ICONS[mahlzeit.zeit] || '🍽️'}</span>
                                                        <span className="meal-zeit">{mahlzeit.zeit}</span>
                                                    </div>
                                                    <div className="meal-details">
                                                        <strong className="meal-rezept">{mahlzeit.rezept}</strong>
                                                        {mahlzeit.zutaten && mahlzeit.zutaten.length > 0 && (
                                                            <span className="meal-zutaten">
                                                                {mahlzeit.zutaten.slice(0, 3).join(', ')}
                                                                {mahlzeit.zutaten.length > 3 && ` +${mahlzeit.zutaten.length - 3}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {isOpen && !tagPlan && (
                                        <div className="essensplan-day-meals">
                                            <p className="meal-empty">Kein Plan für diesen Tag</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default Essensplan;
