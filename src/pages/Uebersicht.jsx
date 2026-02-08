import React, { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import './Uebersicht.css';

// Emoji mapping for products
const PRODUCT_EMOJIS = {
    // Dairy
    'milch': '🥛',
    'käse': '🧀',
    'butter': '🧈',
    'joghurt': '🥛',
    // Fruits
    'apfel': '🍎',
    'banane': '🍌',
    'orange': '🍊',
    'traube': '🍇',
    'erdbeere': '🍓',
    'zitrone': '🍋',
    // Vegetables
    'tomate': '🍅',
    'karotte': '🥕',
    'paprika': '🫑',
    'zwiebel': '🧅',
    'kartoffel': '🥔',
    'salat': '🥬',
    // Meat & Protein
    'fleisch': '🥩',
    'hähnchen': '🍗',
    'fisch': '🐟',
    'ei': '🥚',
    'eier': '🥚',
    'wurst': '🌭',
    // Bread & Grains
    'brot': '🍞',
    'reis': '🍚',
    'nudel': '🍝',
    // Other
    'wasser': '💧',
    'saft': '🧃',
    'bier': '🍺',
    'wein': '🍷'
};

const getProductEmoji = (name) => {
    if (!name) return '🍽️';
    const lowerName = name.toLowerCase();

    for (const [key, emoji] of Object.entries(PRODUCT_EMOJIS)) {
        if (lowerName.includes(key)) {
            return emoji;
        }
    }

    return '🍽️'; // Default
};

const Uebersicht = () => {
    const { activeUser, activeUserId } = useUser();
    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    // Group products by location
    const groupedProducts = useMemo(() => {
        if (!produkte) return { kuehlschrank: [], gefrierschrank: [], vorrat: [] };

        const groups = {
            kuehlschrank: [],
            gefrierschrank: [],
            vorrat: []
        };

        produkte.forEach(p => {
            const location = p.ort || 'vorrat';
            if (groups[location]) {
                groups[location].push(p);
            } else {
                groups.vorrat.push(p);
            }
        });

        return groups;
    }, [produkte]);

    // Get products expiring soon (within 3 days)
    const expiringProducts = useMemo(() => {
        if (!produkte) return [];
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        return produkte
            .filter(p => new Date(p.ablauf) <= threeDaysFromNow)
            .sort((a, b) => new Date(a.ablauf) - new Date(b.ablauf))
            .slice(0, 4);
    }, [produkte]);

    return (
        <div className="overview-page">
            <div className="overview-header">
                <h2>Hallo {activeUser?.emoji} {activeUser?.name}!</h2>
                <p className="overview-subtitle">Dein Kühlschrank auf einen Blick</p>
            </div>

            {/* Fridge Visualization */}
            <div className="fridge-container">
                <div className="fridge-header">
                    <span className="fridge-title">🧊 Kühlschrank</span>
                    <span className="fridge-count">{groupedProducts.kuehlschrank.length} Produkte</span>
                </div>

                <div className="fridge-interior">
                    {/* Shelves */}
                    <div className="fridge-shelf shelf-top">
                        {groupedProducts.kuehlschrank.slice(0, 4).map(p => (
                            <div key={p.id} className="fridge-item">
                                <span className="item-emoji">{getProductEmoji(p.name)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="fridge-shelf shelf-middle">
                        {groupedProducts.kuehlschrank.slice(4, 8).map(p => (
                            <div key={p.id} className="fridge-item">
                                <span className="item-emoji">{getProductEmoji(p.name)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="fridge-shelf shelf-bottom">
                        {groupedProducts.kuehlschrank.slice(8, 12).map(p => (
                            <div key={p.id} className="fridge-item">
                                <span className="item-emoji">{getProductEmoji(p.name)}</span>
                            </div>
                        ))}
                    </div>

                    {groupedProducts.kuehlschrank.length === 0 && (
                        <div className="fridge-empty">
                            <p>🧊 Kühlschrank ist leer</p>
                            <button
                                className="btn secondary small"
                                onClick={() => window.location.hash = '#/produkte'}
                            >
                                Produkte hinzufügen
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Cards Grid */}
            <div className="product-grid">
                {groupedProducts.kuehlschrank.slice(0, 8).map(p => (
                    <div key={p.id} className="product-card" onClick={() => window.location.hash = '#/produkte'}>
                        <div className="product-icon">{getProductEmoji(p.name)}</div>
                        <div className="product-name">{p.name}</div>
                        <div className="product-info">
                            {new Date(p.ablauf).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Expiring Soon Alert */}
            {expiringProducts.length > 0 && (
                <div className="card alert-card">
                    <h3>⚠️ Bald ablaufend</h3>
                    <div className="expiring-list">
                        {expiringProducts.map(p => (
                            <div key={p.id} className="expiring-item">
                                <span className="item-emoji">{getProductEmoji(p.name)}</span>
                                <span className="item-name">{p.name}</span>
                                <span className="item-date">
                                    {new Date(p.ablauf).toLocaleDateString('de-DE')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
                <button
                    className="action-btn"
                    onClick={() => window.location.hash = '#/produkte'}
                >
                    <span className="action-icon">📦</span>
                    <span className="action-label">Inventar</span>
                </button>
                <button
                    className="action-btn"
                    onClick={() => window.location.hash = '#/rezepte'}
                >
                    <span className="action-icon">👨‍🍳</span>
                    <span className="action-label">Rezepte</span>
                </button>
                <button
                    className="action-btn"
                    onClick={() => window.location.hash = '#/einkauf'}
                >
                    <span className="action-icon">🛒</span>
                    <span className="action-label">Einkauf</span>
                </button>
            </div>
        </div>
    );
};

export default Uebersicht;
