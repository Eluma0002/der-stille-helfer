import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import './NotizenListe.css';

const MEAL_CATEGORIES = [
    { id: 'fruehstueck', name: 'Frühstück', icon: '🌅' },
    { id: 'mittag', name: 'Mittag', icon: '☀️' },
    { id: 'abend', name: 'Abend', icon: '🌙' },
    { id: 'snack', name: 'Snacks', icon: '🍿' }
];

const RECIPE_CATEGORIES = [
    'Hauptgericht',
    'Beilage',
    'Suppe',
    'Salat',
    'Dessert',
    'Frühstück',
    'Snack',
    'Getränk'
];

const NotizenListe = () => {
    const { activeUserId } = useUser();
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        zutaten: [{ name: '', menge: '' }],
        anleitung: '',
        kategorie: 'Hauptgericht',
        mahlzeit: 'mittag',
        portionen: 2,
        zeit: 30
    });
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load user's own recipes
    const eigeneRezepte = useLiveQuery(
        () => db.eigene_rezepte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    const validateForm = () => {
        if (!formData.name.trim()) {
            return 'Rezeptname ist erforderlich';
        }
        if (formData.name.length > 100) {
            return 'Rezeptname zu lang (max. 100 Zeichen)';
        }
        if (!formData.anleitung.trim()) {
            return 'Anleitung ist erforderlich';
        }
        if (formData.zutaten.length === 0 || !formData.zutaten[0].name.trim()) {
            return 'Mindestens eine Zutat erforderlich';
        }
        if (formData.portionen < 1 || formData.portionen > 20) {
            return 'Portionen müssen zwischen 1 und 20 sein';
        }
        if (formData.zeit < 1 || formData.zeit > 600) {
            return 'Zeit muss zwischen 1 und 600 Minuten sein';
        }
        return null;
    };

    const handleAddRecipe = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Filter out empty ingredients
            const cleanedZutaten = formData.zutaten.filter(z => z.name.trim());

            await db.eigene_rezepte.add({
                id: `user-recipe-${Date.now()}`,
                person_id: activeUserId,
                name: formData.name,
                zutaten: cleanedZutaten,
                anleitung: formData.anleitung,
                kategorie: formData.kategorie,
                mahlzeit: formData.mahlzeit,
                portionen: parseInt(formData.portionen),
                zeit: parseInt(formData.zeit),
                created_at: new Date().toISOString(),
                tags: []
            });

            resetForm();
        } catch (err) {
            setError('Fehler beim Speichern des Rezepts');
            console.error('Error adding recipe:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRecipe = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const cleanedZutaten = formData.zutaten.filter(z => z.name.trim());

            await db.eigene_rezepte.update(editingId, {
                name: formData.name,
                zutaten: cleanedZutaten,
                anleitung: formData.anleitung,
                kategorie: formData.kategorie,
                mahlzeit: formData.mahlzeit,
                portionen: parseInt(formData.portionen),
                zeit: parseInt(formData.zeit)
            });

            resetForm();
        } catch (err) {
            setError('Fehler beim Aktualisieren des Rezepts');
            console.error('Error updating recipe:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRecipe = async (id) => {
        if (!window.confirm('Rezept wirklich löschen?')) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await db.eigene_rezepte.delete(id);
        } catch (err) {
            setError('Fehler beim Löschen des Rezepts');
            console.error('Error deleting recipe:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (recipe) => {
        setFormData({
            name: recipe.name,
            zutaten: recipe.zutaten.length > 0 ? recipe.zutaten : [{ name: '', menge: '' }],
            anleitung: recipe.anleitung,
            kategorie: recipe.kategorie,
            mahlzeit: recipe.mahlzeit || 'mittag',
            portionen: recipe.portionen,
            zeit: recipe.zeit
        });
        setEditingId(recipe.id);
        setIsAdding(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            zutaten: [{ name: '', menge: '' }],
            anleitung: '',
            kategorie: 'Hauptgericht',
            mahlzeit: 'mittag',
            portionen: 2,
            zeit: 30
        });
        setEditingId(null);
        setIsAdding(false);
        setError(null);
    };

    const addIngredient = () => {
        setFormData({
            ...formData,
            zutaten: [...formData.zutaten, { name: '', menge: '' }]
        });
    };

    const removeIngredient = (index) => {
        if (formData.zutaten.length === 1) return;
        const newZutaten = formData.zutaten.filter((_, i) => i !== index);
        setFormData({ ...formData, zutaten: newZutaten });
    };

    const updateIngredient = (index, field, value) => {
        const newZutaten = [...formData.zutaten];
        newZutaten[index][field] = value;
        setFormData({ ...formData, zutaten: newZutaten });
    };

    const getMealIcon = (mahlzeit) => {
        const cat = MEAL_CATEGORIES.find(c => c.id === mahlzeit);
        return cat ? cat.icon : '🍽️';
    };

    return (
        <div className="notizen-page recipe-form-page">
            <h2>👨‍🍳 Eigene Rezepte</h2>

            {!isAdding ? (
                <button
                    className="btn"
                    onClick={() => setIsAdding(true)}
                    disabled={isLoading}
                >
                    + Neues Rezept
                </button>
            ) : (
                <div className="recipe-form card">
                    <h3>{editingId ? 'Rezept bearbeiten' : 'Neues Rezept erstellen'}</h3>

                    {/* Name */}
                    <div className="form-group">
                        <label>Rezeptname *</label>
                        <input
                            type="text"
                            placeholder="z.B. Spaghetti Bolognese"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            maxLength={100}
                            required
                        />
                    </div>

                    {/* Meal Category */}
                    <div className="form-group">
                        <label>Mahlzeit</label>
                        <div className="meal-buttons">
                            {MEAL_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`btn small ${formData.mahlzeit === cat.id ? 'primary' : 'secondary'}`}
                                    onClick={() => setFormData({...formData, mahlzeit: cat.id})}
                                >
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="form-group">
                        <label>Zutaten *</label>
                        <div className="ingredients-list">
                            {formData.zutaten.map((zutat, index) => (
                                <div key={index} className="ingredient-row">
                                    <input
                                        type="text"
                                        placeholder="Zutat"
                                        value={zutat.name}
                                        onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                                        style={{ flex: 2 }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Menge"
                                        value={zutat.menge}
                                        onChange={(e) => updateIngredient(index, 'menge', e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    {formData.zutaten.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn-delete"
                                            onClick={() => removeIngredient(index)}
                                            title="Zutat entfernen"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn small secondary"
                            onClick={addIngredient}
                            style={{ marginTop: '8px' }}
                        >
                            + Zutat hinzufügen
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="form-group">
                        <label>Anleitung *</label>
                        <textarea
                            placeholder="Schritt-für-Schritt Anleitung..."
                            value={formData.anleitung}
                            onChange={(e) => setFormData({...formData, anleitung: e.target.value})}
                            rows={6}
                        />
                    </div>

                    {/* Meta Info */}
                    <div className="meta-row">
                        <div className="form-group">
                            <label>Kategorie</label>
                            <select
                                value={formData.kategorie}
                                onChange={(e) => setFormData({...formData, kategorie: e.target.value})}
                            >
                                {RECIPE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Portionen</label>
                            <input
                                type="number"
                                value={formData.portionen}
                                onChange={(e) => setFormData({...formData, portionen: e.target.value})}
                                min="1"
                                max="20"
                            />
                        </div>

                        <div className="form-group">
                            <label>Zeit (Min.)</label>
                            <input
                                type="number"
                                value={formData.zeit}
                                onChange={(e) => setFormData({...formData, zeit: e.target.value})}
                                min="1"
                                max="600"
                            />
                        </div>
                    </div>

                    {error && <p className="error">{error}</p>}

                    <div className="form-actions">
                        <button
                            className="btn secondary"
                            onClick={resetForm}
                            disabled={isLoading}
                        >
                            Abbrechen
                        </button>
                        <button
                            className="btn primary"
                            onClick={editingId ? handleUpdateRecipe : handleAddRecipe}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Speichern...' : 'Speichern'}
                        </button>
                    </div>
                </div>
            )}

            {isLoading && <p>Laden...</p>}

            {/* Recipe List */}
            <div className="notizen-list recipe-list">
                {eigeneRezepte?.length === 0 ? (
                    <div className="empty-state">
                        <p>📝 Noch keine eigenen Rezepte</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Erstelle dein erstes Rezept mit dem Button oben!
                        </p>
                    </div>
                ) : (
                    eigeneRezepte?.map(r => (
                        <div key={r.id} className="card recipe-card">
                            <div className="card-header">
                                <h3>
                                    {getMealIcon(r.mahlzeit)} {r.name}
                                </h3>
                                <div className="card-actions">
                                    <button
                                        className="btn small"
                                        onClick={() => startEditing(r)}
                                        disabled={isLoading}
                                    >
                                        ✏️ Bearbeiten
                                    </button>
                                    <button
                                        className="btn small danger"
                                        onClick={() => handleDeleteRecipe(r.id)}
                                        disabled={isLoading}
                                    >
                                        🗑️ Löschen
                                    </button>
                                </div>
                            </div>

                            <div className="recipe-meta">
                                <span>{r.kategorie}</span>
                                <span>{r.portionen} Portionen</span>
                                <span>{r.zeit} Min.</span>
                            </div>

                            <div className="recipe-preview">
                                <p><strong>Zutaten:</strong></p>
                                <ul>
                                    {r.zutaten.slice(0, 3).map((z, i) => (
                                        <li key={i}>{z.name} {z.menge && `- ${z.menge}`}</li>
                                    ))}
                                    {r.zutaten.length > 3 && (
                                        <li style={{ color: 'var(--text-muted)' }}>
                                            ... und {r.zutaten.length - 3} weitere
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotizenListe;
