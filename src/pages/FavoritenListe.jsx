import React from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';

const FavoritenListe = () => {
    const { activeUserId } = useUser();
    const favorites = useLiveQuery(
        () => db.favoriten.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    return (
        <div className="page" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2>Deine Favoriten</h2>
            {favorites?.length > 0 ? (
                <div className="list">
                    {favorites.map(fav => (
                        <div key={fav.id} className="card">
                            <h3>{fav.rezept_id}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Typ: {fav.rezept_type}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>Noch keine Favoriten</p>
                    <p>Markiere Rezepte als Favoriten, um sie hier zu finden.</p>
                    <Link to="/rezepte" className="btn" style={{ display: 'inline-flex', marginTop: '16px' }}>
                        Rezepte entdecken
                    </Link>
                </div>
            )}
        </div>
    );
};

export default FavoritenListe;
