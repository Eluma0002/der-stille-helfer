import React, { useMemo, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureProfileExists } from '../db/schema';
import { useUser } from '../context/UserContext';
import { strings } from '../strings/de';
import { KochBot } from '../bots/KochBot';
import './RezeptDetails.css';

const RezeptDetails = () => {
    const { id } = useParams();
    const { activeUserId } = useUser();
    const [profileReady, setProfileReady] = useState(false);
    const [listMessage, setListMessage] = useState(null);

    // Ensure profile exists before querying
    useEffect(() => {
        if (activeUserId) {
            ensureProfileExists(activeUserId).then(() => {
                setProfileReady(true);
            });
        }
    }, [activeUserId]);

    // Fetch recipe data from both base recipes and user recipes
    const baseRezept = useLiveQuery(
        () => db.base_rezepte.get(id),
        [id]
    );

    const userRezept = useLiveQuery(
        () => activeUserId ? db.eigene_rezepte.get({ id, person_id: activeUserId }) : null,
        [id, activeUserId]
    );

    // Only query profile after we've ensured it exists
    const profile = useLiveQuery(
        () => profileReady && activeUserId ? db.profile.where('person_id').equals(activeUserId).first() : undefined,
        [activeUserId, profileReady]
    );

    // Combine results - user recipe takes precedence
    const rezept = userRezept || baseRezept;

    const safetyResult = useMemo(() => {
        if (!rezept || !profile) return null;
        const kochBot = new KochBot();
        return kochBot.checkSafety(rezept, profile);
    }, [rezept, profile]);

    const addToShoppingList = async () => {
        if (!rezept?.zutaten || rezept.zutaten.length === 0) return;

        // Get current shopping list for this user
        const existingItems = await db.einkaufsliste
            .where('person_id').equals(activeUserId)
            .toArray();
        const existingNames = existingItems.map(item =>
            item.name.toLowerCase().trim()
        );

        let addedCount = 0;
        let existingCount = 0;

        for (const zutatenItem of rezept.zutaten) {
            // Create ingredient name from menge + name
            const ingredientName = `${zutatenItem.menge} ${zutatenItem.name}`.trim();
            const normalizedName = ingredientName.toLowerCase().trim();

            if (existingNames.includes(normalizedName)) {
                existingCount++;
            } else {
                await db.einkaufsliste.add({
                    id: `${Date.now()}-${addedCount}`,
                    person_id: activeUserId,
                    name: ingredientName,
                    checked: false,
                    created_at: Date.now()
                });
                addedCount++;
                existingNames.push(normalizedName); // Prevent duplicates within same batch
            }
        }

        // Show feedback
        if (addedCount === 0) {
            setListMessage(strings.recipe.allAlreadyOnList);
        } else if (existingCount === 0) {
            setListMessage(strings.recipe.addedToList.replace('{count}', addedCount));
        } else {
            setListMessage(
                strings.recipe.someAlreadyOnList
                    .replace('{count}', addedCount)
                    .replace('{existing}', existingCount)
            );
        }

        // Clear message after 3 seconds
        setTimeout(() => setListMessage(null), 3000);
    };

    // Show loading while recipes are loading (not dependent on profile)
    if (baseRezept === undefined) {
        return (
            <div className="rezept-details">
                <p>{strings.recipe.loading}</p>
            </div>
        );
    }

    if (!rezept) {
        return (
            <div className="rezept-details">
                <p>{strings.recipe.notFound}</p>
            </div>
        );
    }

    return (
        <div className="rezept-details">
            <h2>{rezept.name}</h2>

            {safetyResult && (
                <div className={`safety-badge badge-${safetyResult.status}`}>
                    {safetyResult.message}
                </div>
            )}

            {safetyResult && safetyResult.replacements.length > 0 && (
                <div className="substitutions">
                    <h3>Empfohlene Anpassungen</h3>
                    <ul>
                        {safetyResult.replacements.map((replacement, idx) => (
                            <li key={idx}>
                                <strong>{replacement.quantity} {replacement.ingredient}</strong>
                                {replacement.alternatives.length > 0 ? (
                                    <> {' → '} {replacement.alternatives.join(' oder ')}</>
                                ) : (
                                    <span className="warning-text"> (keine sichere Alternative bekannt)</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Shopping list button */}
            {rezept?.zutaten && rezept.zutaten.length > 0 && (
                <div className="shopping-list-action">
                    <button
                        className="btn primary shopping-btn"
                        onClick={addToShoppingList}
                    >
                        🛒 {strings.recipe.addToShoppingList}
                    </button>
                    {listMessage && (
                        <p className="list-message">{listMessage}</p>
                    )}
                </div>
            )}

            <div className="rezept-meta">
                {rezept.kategorie && (
                    <span className="rezept-kategorie">
                        <strong>{strings.recipe.category}:</strong> {rezept.kategorie}
                    </span>
                )}
            </div>

            {rezept.zutaten && rezept.zutaten.length > 0 && (
                <div className="rezept-zutaten">
                    <h3>{strings.recipe.ingredients}</h3>
                    <ul>
                        {rezept.zutaten.map((zutatenItem, index) => (
                            <li key={index}>{zutatenItem.menge} {zutatenItem.name}</li>
                        ))}
                    </ul>
                </div>
            )}

            {rezept.anleitung && (
                <div className="rezept-anleitung">
                    <h3>{strings.recipe.instructions}</h3>
                    <p>{rezept.anleitung}</p>
                </div>
            )}

            {rezept.portionen && (
                <div className="rezept-portionen">
                    <p><strong>{strings.recipe.servings}:</strong> {rezept.portionen}</p>
                </div>
            )}

            {rezept.zeit && (
                <div className="rezept-zeit">
                    <p><strong>{strings.recipe.time}:</strong> {rezept.zeit} {strings.recipe.minutes}</p>
                </div>
            )}
        </div>
    );
};

export default RezeptDetails;
