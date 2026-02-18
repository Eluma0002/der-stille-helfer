import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import './Wochenplan.css';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const MEALS = [
    { id: 'fruehstueck', label: 'Frühstück', icon: '🌅', color: '#FCD34D' },
    { id: 'mittag',      label: 'Mittag',    icon: '☀️', color: '#60A5FA' },
    { id: 'abend',       label: 'Abend',     icon: '🌙', color: '#A78BFA' },
    { id: 'snack',       label: 'Snack',     icon: '🍿', color: '#34D399' },
];

const STORAGE_KEY = 'wochenplan_v1';

function getMonday() {
    const t = new Date();
    const d = t.getDay();
    t.setDate(t.getDate() - (d === 0 ? 6 : d - 1));
    t.setHours(0, 0, 0, 0);
    return t;
}

function dayDate(monday, idx) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return d;
}

function fmtShort(d) {
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

function isToday(d) {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

export default function Wochenplan() {
    const [plan, setPlan] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
        catch { return {}; }
    });
    const [picker, setPicker] = useState(null); // { dayIdx, mealId }
    const [search, setSearch] = useState('');

    const monday = useMemo(() => getMonday(), []);

    const baseRezepte = useLiveQuery(() => db.base_rezepte.toArray(), []);
    const eigeneRezepte = useLiveQuery(() => db.eigene_rezepte.toArray(), []);

    const allRecipes = useMemo(() => {
        const all = [...(baseRezepte || []), ...(eigeneRezepte || [])];
        if (!search.trim()) return all;
        return all.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    }, [baseRezepte, eigeneRezepte, search]);

    // Filter by meal category if picker is open
    const pickerRecipes = useMemo(() => {
        if (!picker) return allRecipes;
        const byMeal = allRecipes.filter(r => r.mahlzeit === picker.mealId);
        return byMeal.length > 0 ? byMeal : allRecipes;
    }, [allRecipes, picker]);

    const savePlan = (next) => {
        setPlan(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };

    const assign = (recipe) => {
        if (!picker) return;
        const key = `${picker.dayIdx}-${picker.mealId}`;
        savePlan({ ...plan, [key]: { id: recipe.id, name: recipe.name, zeit: recipe.zeit } });
        setPicker(null);
        setSearch('');
    };

    const remove = (e, dayIdx, mealId) => {
        e.stopPropagation();
        const key = `${dayIdx}-${mealId}`;
        const next = { ...plan };
        delete next[key];
        savePlan(next);
    };

    const clearWeek = () => {
        if (window.confirm('Ganzen Wochenplan löschen?')) savePlan({});
    };

    return (
        <div className="wochenplan-page">
            <div className="wochenplan-header">
                <div>
                    <h2>📅 Wochenplan</h2>
                    <p className="wochenplan-subtitle">
                        {fmtShort(dayDate(monday, 0))} – {fmtShort(dayDate(monday, 6))}
                    </p>
                </div>
                <button className="wp-clear-btn" onClick={clearWeek}>🗑 Leeren</button>
            </div>

            <div className="wochenplan-grid">
                {/* Header: Tage */}
                <div className="wp-corner" />
                {DAYS.map((day, i) => {
                    const d = dayDate(monday, i);
                    return (
                        <div key={day} className={`wp-day-header ${isToday(d) ? 'today' : ''}`}>
                            <span className="wp-day-name">{day}</span>
                            <span className="wp-day-date">{fmtShort(d)}</span>
                        </div>
                    );
                })}

                {/* Mahlzeit-Zeilen */}
                {MEALS.map(meal => (
                    <React.Fragment key={meal.id}>
                        <div className="wp-meal-label" style={{ borderLeftColor: meal.color }}>
                            <span className="wp-meal-icon">{meal.icon}</span>
                            <span className="wp-meal-name">{meal.label}</span>
                        </div>
                        {DAYS.map((day, dayIdx) => {
                            const entry = plan[`${dayIdx}-${meal.id}`] || null;
                            const d = dayDate(monday, dayIdx);
                            return (
                                <div
                                    key={day}
                                    className={`wp-cell ${isToday(d) ? 'today-col' : ''}`}
                                >
                                    {entry ? (
                                        <div
                                            className="wp-entry"
                                            style={{ borderTopColor: meal.color }}
                                        >
                                            <span className="wp-entry-name">{entry.name}</span>
                                            {entry.zeit && (
                                                <span className="wp-entry-time">⏱{entry.zeit}m</span>
                                            )}
                                            <button
                                                className="wp-entry-remove"
                                                onClick={(e) => remove(e, dayIdx, meal.id)}
                                                title="Entfernen"
                                            >✕</button>
                                        </div>
                                    ) : (
                                        <button
                                            className="wp-add-btn"
                                            onClick={() => setPicker({ dayIdx, mealId: meal.id })}
                                        >+</button>
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            {/* Einkaufsliste aus Plan generieren */}
            <div className="wp-hint">
                💡 Tippe auf ein Rezept im Koch-Assistent um Zutaten zur Einkaufsliste hinzuzufügen
            </div>

            {/* Rezept-Picker Modal */}
            {picker && (
                <div className="wp-picker-overlay" onClick={() => { setPicker(null); setSearch(''); }}>
                    <div className="wp-picker" onClick={e => e.stopPropagation()}>
                        <div className="wp-picker-header">
                            <div>
                                <h3>Rezept wählen</h3>
                                <p className="wp-picker-sub">
                                    {MEALS.find(m => m.id === picker.mealId)?.icon}{' '}
                                    {MEALS.find(m => m.id === picker.mealId)?.label} –{' '}
                                    {DAYS[picker.dayIdx]}
                                </p>
                            </div>
                            <button className="wp-picker-close" onClick={() => { setPicker(null); setSearch(''); }}>✕</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Rezept suchen..."
                            className="wp-picker-search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                        <div className="wp-picker-list">
                            {pickerRecipes.map(r => (
                                <button key={r.id} className="wp-picker-item" onClick={() => assign(r)}>
                                    <span className="wp-picker-name">{r.name}</span>
                                    {r.zeit && <span className="wp-picker-time">⏱ {r.zeit} Min.</span>}
                                </button>
                            ))}
                            {pickerRecipes.length === 0 && (
                                <p className="wp-picker-empty">Kein Rezept gefunden</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
