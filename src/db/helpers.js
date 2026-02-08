import { db } from './schema';

export const getActiveProfile = async (personId) => {
    return await db.profile.where('person_id').equals(personId).first();
};

export const getInventory = async (personId) => {
    return await db.produkte.where('person_id').equals(personId).toArray();
};

export const getShoppingList = async (personId) => {
    return await db.einkaufsliste.where('person_id').equals(personId).toArray();
};

export const getFavorites = async (personId) => {
    return await db.favoriten.where('person_id').equals(personId).toArray();
};
