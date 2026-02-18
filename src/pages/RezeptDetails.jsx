import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureProfileExists } from '../db/schema';
import { useUser } from '../context/UserContext';
import { strings } from '../strings/de';
import { KochBot } from '../bots/KochBot';
import './RezeptDetails.css';

const MEAL_COLORS = {
    fruehstueck: '#FCD34D',
    mittag:      '#60A5FA',
    abend:       '#A78BFA',
    snack:       '#34D399',
    salat:       '#86EFAC',
};

const MEAL_ICONS = {
    fruehstueck: '🌅',
    mittag:      '☀️',
    abend:       '🌙',
    snack:       '🍿',
    salat:       '🥗',
};

const RezeptDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { activeUserId } = useUser();
    const [profileReady, setProfileReady] = useState(false);
    const [listMessage, setListMessage] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [favAnim, setFavAnim] = useState(false);

    useEffect(() => {
        if (activeUserId) {
            ensureProfileExists(activeUserId).then(() => setProfileReady(true));
        }
    }, [activeUserId]);

    const baseRezept = useLiveQuery(() => db.base_rezepte.get(id), [id]);
    const userRezept = useLiveQuery(
        () => activeUserId ? db.eigene_rezepte.where({ id, person_id: activeUserId }).first() : null,
        [id, activeUserId]
    );
    const isFavorite = useLiveQuery(
        () => activeUserId
            ? db.favoriten.where({ person_id: activeUserId, rezept_id: id }).first().then(f => !!f)
            : false,
        [id, activeUserId]
    );

    const toggleFavorite = async () => {
        const existing = await db.favoriten.where({ person_id: activeUserId, rezept_id: id }).first();
        if (existing) {
            await db.favoriten.delete(existing.id);
        } else {
            await db.favoriten.add({
                id: `fav-${Date.now()}`,
                person_id: activeUserId,
                rezept_type: baseRezept ? 'base' : 'eigene',
                rezept_id: id,
                starred_at: new Date().toISOString()
            });
            setFavAnim(true);
            setTimeout(() => setFavAnim(false), 600);
        }
    };

    const profile = useLiveQuery(
        () => profileReady && activeUserId
            ? db.profile.where('person_id').equals(activeUserId).first()
            : undefined,
        [activeUserId, profileReady]
    );

    const rezept = userRezept || baseRezept;

    const safetyResult = useMemo(() => {
        if (!rezept || !profile) return null;
        return new KochBot().checkSafety(rezept, profile);
    }, [rezept, profile]);

    const mealColor = MEAL_COLORS[rezept?.mahlzeit] || '#F97316';
    const mealIcon  = MEAL_ICONS[rezept?.mahlzeit]  || '🍽️';

    // ── WhatsApp Teilen ───────────────────────────────
    const buildShareText = () => {
        if (!rezept) return '';
        const lines = [`🍽️ *${rezept.name}*`];
        const meta = [];
        if (rezept.zeit)      meta.push(`⏱ ${rezept.zeit} Min.`);
        if (rezept.portionen) meta.push(`👥 ${rezept.portionen} Portionen`);
        if (meta.length)      lines.push(meta.join(' | '));
        lines.push('');
        lines.push('🥘 *Zutaten:*');
        (rezept.zutaten || []).forEach(z => {
            lines.push(`• ${z.menge ? z.menge + ' ' : ''}${z.name}`);
        });
        if (rezept.anleitung) {
            lines.push('');
            lines.push('📋 *Anleitung:*');
            lines.push(rezept.anleitung);
        }
        return lines.join('\n');
    };

    const shareViaWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, '_blank');
    };

    const copyRecipe = async () => {
        try {
            await navigator.clipboard.writeText(buildShareText());
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch { /* ignore */ }
    };

    // ── Einkaufsliste ─────────────────────────────────
    const addToShoppingList = async () => {
        if (!rezept?.zutaten?.length) return;
        const existing = await db.einkaufsliste.where('person_id').equals(activeUserId).toArray();
        const existingNames = existing.map(i => i.name.toLowerCase().trim());
        let added = 0, already = 0;
        for (const z of rezept.zutaten) {
            const label = `${z.menge ? z.menge + ' ' : ''}${z.name}`.trim();
            if (existingNames.includes(label.toLowerCase())) { already++; continue; }
            await db.einkaufsliste.add({
                id: `${Date.now()}-${added}`,
                person_id: activeUserId,
                name: label,
                checked: false,
                created_at: Date.now()
            });
            added++;
            existingNames.push(label.toLowerCase());
        }
        if (added === 0) setListMessage(strings.recipe.allAlreadyOnList);
        else if (already === 0) setListMessage(strings.recipe.addedToList.replace('{count}', added));
        else setListMessage(strings.recipe.someAlreadyOnList.replace('{count}', added).replace('{existing}', already));
        setTimeout(() => setListMessage(null), 3000);
    };

    if (baseRezept === undefined) {
        return <div className="rezept-details"><p>{strings.recipe.loading}</p></div>;
    }
    if (!rezept) {
        return <div className="rezept-details"><p>{strings.recipe.notFound}</p></div>;
    }

    return (
        <div className="rezept-details">

            {/* ── Hero-Header ───────────────────────────── */}
            <div
                className="rezept-hero"
                style={{ background: `linear-gradient(160deg, ${mealColor}cc 0%, ${mealColor}44 100%)` }}
            >
                <button className="rezept-back-btn" onClick={() => navigate(-1)}>←</button>
                <button
                    className={`rezept-fav-btn ${isFavorite ? 'active' : ''} ${favAnim ? 'pop' : ''}`}
                    onClick={toggleFavorite}
                    title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                >{isFavorite ? '❤️' : '🤍'}</button>
                <div className="rezept-hero-icon">{mealIcon}</div>
                <h2 className="rezept-hero-title">{rezept.name}</h2>
                <div className="rezept-hero-meta">
                    {rezept.portionen && <span>👥 {rezept.portionen} Port.</span>}
                    {rezept.zeit      && <span>⏱ {rezept.zeit} Min.</span>}
                    {rezept.kategorie && <span>🍴 {rezept.kategorie}</span>}
                </div>
            </div>

            {/* ── Aktionen ──────────────────────────────── */}
            <div className="rezept-actions">
                <button className="action-btn shopping-btn" onClick={addToShoppingList}>
                    🛒 Einkaufsliste
                </button>
                <button className="action-btn copy-btn" onClick={copyRecipe}>
                    {copySuccess ? '✓ Kopiert!' : '📋 Kopieren'}
                </button>
                <button className="action-btn whatsapp-btn" onClick={shareViaWhatsApp}>
                    📲 WhatsApp
                </button>
            </div>

            {listMessage && <p className="list-message">{listMessage}</p>}

            {/* ── Sicherheits-Badge ─────────────────────── */}
            {safetyResult && (
                <div className={`safety-banner badge-${safetyResult.status}`}>
                    {safetyResult.message}
                </div>
            )}

            {/* ── Ersatz-Empfehlungen ───────────────────── */}
            {safetyResult?.replacements?.length > 0 && (
                <div className="substitutions">
                    <h3>🔄 Empfohlene Anpassungen</h3>
                    <ul>
                        {safetyResult.replacements.map((r, i) => (
                            <li key={i}>
                                <span className="sub-original">{r.quantity} {r.ingredient}</span>
                                {r.alternatives.length > 0 ? (
                                    <span className="sub-arrow"> → <strong>{r.alternatives.join(' oder ')}</strong></span>
                                ) : (
                                    <span className="sub-warning"> (keine sichere Alternative bekannt)</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Zutaten ───────────────────────────────── */}
            {rezept.zutaten?.length > 0 && (
                <div className="rezept-section">
                    <h3>🥘 {strings.recipe.ingredients}</h3>
                    <ul className="zutaten-list">
                        {rezept.zutaten.map((z, i) => (
                            <li key={i} className="zutaten-item">
                                <span className="zutat-menge">{z.menge}</span>
                                <span className="zutat-name">{z.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Anleitung ─────────────────────────────── */}
            {rezept.anleitung && (
                <div className="rezept-section">
                    <h3>📋 {strings.recipe.instructions}</h3>
                    <p className="anleitung-text">{rezept.anleitung}</p>
                </div>
            )}
        </div>
    );
};

export default RezeptDetails;
