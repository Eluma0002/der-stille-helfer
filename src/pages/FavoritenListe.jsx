import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import './FavoritenListe.css';

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

const FavoritenListe = () => {
    const { activeUserId } = useUser();

    const favorites = useLiveQuery(
        () => db.favoriten.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );
    const baseRezepte = useLiveQuery(() => db.base_rezepte.toArray(), []);
    const eigeneRezepte = useLiveQuery(
        () => db.eigene_rezepte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    const favRecipes = useMemo(() => {
        if (!favorites || !baseRezepte || !eigeneRezepte) return null;
        return favorites
            .map(fav => {
                const recipe = fav.rezept_type === 'base'
                    ? baseRezepte.find(r => r.id === fav.rezept_id)
                    : eigeneRezepte.find(r => r.id === fav.rezept_id);
                return recipe ? { ...recipe, favId: fav.id } : null;
            })
            .filter(Boolean)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [favorites, baseRezepte, eigeneRezepte]);

    const removeFavorite = async (e, favId) => {
        e.preventDefault();
        e.stopPropagation();
        await db.favoriten.delete(favId);
    };

    if (favRecipes === null) {
        return <div className="page"><p className="loading">Lade...</p></div>;
    }

    return (
        <div className="page favoriten-page">
            <h2>⭐ Favoriten</h2>

            {favRecipes.length === 0 ? (
                <div className="empty-state">
                    <p>🤍 Noch keine Favoriten</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Tippe auf ❤️ in einem Rezept, um es hier zu speichern.
                    </p>
                    <Link to="/rezepte" className="btn" style={{ display: 'inline-flex' }}>
                        Rezepte entdecken
                    </Link>
                </div>
            ) : (
                <>
                    <p className="fav-count">{favRecipes.length} gespeicherte Rezepte</p>
                    <div className="fav-grid">
                        {favRecipes.map(r => {
                            const color = MEAL_COLORS[r.mahlzeit] || '#F97316';
                            const icon  = MEAL_ICONS[r.mahlzeit]  || '🍽️';
                            return (
                                <div key={r.favId} className="fav-card">
                                    <Link to={`/rezept/${r.id}`} className="fav-card-link">
                                        <div className="fav-card-visual" style={{ background: `${color}33` }}>
                                            <span className="fav-card-icon">{icon}</span>
                                        </div>
                                        <div className="fav-card-body">
                                            <h4>{r.name}</h4>
                                            <div className="fav-card-meta">
                                                {r.portionen && <span>👥 {r.portionen}</span>}
                                                {r.zeit && <span>⏱ {r.zeit} Min.</span>}
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        className="fav-remove-btn"
                                        onClick={(e) => removeFavorite(e, r.favId)}
                                        title="Aus Favoriten entfernen"
                                    >🗑</button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default FavoritenListe;
