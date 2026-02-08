import Dexie from 'dexie';
import { ELVIS_RESTRICTIONS } from '../bots/substitutions.js';

export const db = new Dexie('DerStilleHelfer');

db.version(1).stores({
    personen: 'id, name, aktiv',
    produkte: 'id, person_id, name, kategorie, ablauf, ort',
    base_rezepte: 'id, name, kategorie, küche, quelle, anleitung, portionen, zeit, *zutaten, *tags',
    eigene_rezepte: 'id, person_id, name, kategorie, küche, anleitung, portionen, created_at, zeit, *zutaten, *tags',
    varianten: 'id, person_id, base_rezept_id, *änderungen, approved, created_at',
    favoriten: 'id, person_id, rezept_type, rezept_id, starred_at',
    einkaufsliste: 'id, person_id, name, menge, checked, kategorie, created_at',
    notizen: 'id, person_id, titel, created_at',
    profile: 'id, person_id',
    bot_settings: 'id, bot_id, person_id, key, value',
    pending_changes: 'id, person_id, entity_type, entity_id, timestamp, synced',
    backups: 'id, person_id, timestamp, size, auto'
});

db.version(2).stores({
    personen: 'id, name, aktiv',
    produkte: 'id, person_id, name, kategorie, ablauf, ort',
    base_rezepte: 'id, name, kategorie, küche, quelle, anleitung, portionen, zeit, *zutaten, *tags',
    eigene_rezepte: 'id, person_id, name, kategorie, küche, anleitung, portionen, created_at, zeit, *zutaten, *tags',
    varianten: 'id, person_id, base_rezept_id, *änderungen, approved, created_at',
    favoriten: 'id, person_id, rezept_type, rezept_id, starred_at',
    einkaufsliste: 'id, person_id, name, menge, checked, kategorie, created_at',
    notizen: 'id, person_id, titel, created_at',
    profile: 'id, person_id',
    bot_settings: 'id, bot_id, person_id, key, value',
    pending_changes: 'id, person_id, entity_type, entity_id, timestamp, synced',
    backups: 'id, person_id, timestamp, size, auto'
}).upgrade(async tx => {
    // Migrate existing profiles to add dietary_restrictions
    const profiles = await tx.table('profile').toArray();
    for (const profile of profiles) {
        if (profile.dietary_restrictions === undefined) {
            const restrictions = profile.person_id === 'elvis' ? ELVIS_RESTRICTIONS : [];
            await tx.table('profile').update(profile.id, { dietary_restrictions: restrictions });
        }
    }
});

// Seed initial profiles on populate (fresh databases)
db.on('populate', async () => {
    // Seed Elvis profile with dietary restrictions
    await db.profile.add({
        id: 'profile-elvis',
        person_id: 'elvis',
        dietary_restrictions: ELVIS_RESTRICTIONS
    });

    // Seed Alberina profile with no restrictions
    await db.profile.add({
        id: 'profile-alberina',
        person_id: 'alberina',
        dietary_restrictions: []
    });
});

/**
 * Ensure profile exists with dietary_restrictions for a user
 * Called on app initialization to handle existing databases
 */
export async function ensureProfileExists(personId) {
    try {
        const existingProfile = await db.profile.where('person_id').equals(personId).first();

        if (!existingProfile) {
            // Create profile if missing
            const restrictions = personId === 'elvis' ? ELVIS_RESTRICTIONS : [];
            await db.profile.add({
                id: `profile-${personId}`,
                person_id: personId,
                dietary_restrictions: restrictions
            });
            console.log(`Created profile for ${personId} with ${restrictions.length} restrictions`);
        } else {
            // Check if Elvis needs dietary_restrictions populated
            const needsRestrictions = personId === 'elvis' &&
                (!existingProfile.dietary_restrictions || existingProfile.dietary_restrictions.length === 0);

            if (needsRestrictions) {
                await db.profile.update(existingProfile.id, { dietary_restrictions: ELVIS_RESTRICTIONS });
                console.log(`Updated Elvis profile with ${ELVIS_RESTRICTIONS.length} restrictions`);
            }
        }
    } catch (err) {
        console.error('Error ensuring profile:', err);
    }
}

export default db;
