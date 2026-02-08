import React from 'react';
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
        <div className="favoriten-page">
            <h2>Deine Favoriten ❤️</h2>
            <div className="favoriten-grid">
                {favorites?.length > 0 ? (
                    favorites.map(fav => (
                        <div key={fav.id} className="card">
                            <h3>Favorit ID: {fav.rezept_id}</h3>
                            <p>Typ: {fav.rezept_type}</p>
                        </div>
                    ))
                ) : (
                    <p>Noch keine Favoriten gespeichert.</p>
                )}
            </div>
        </div>
    );
};

export default FavoritenListe;
