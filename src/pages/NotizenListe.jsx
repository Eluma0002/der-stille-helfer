import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import { strings } from '../strings/de';

const NotizenListe = () => {
    const { activeUserId } = useUser();
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({ titel: '', inhalt: '' });
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const notizen = useLiveQuery(
        () => db.notizen.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    const validateForm = () => {
        if (!formData.titel.trim()) {
            return strings.notes.validation.required;
        }
        if (formData.titel.length > 50) {
            return strings.notes.validation.maxTitle;
        }
        if (formData.inhalt.length > 1000) {
            return strings.notes.validation.maxContent;
        }
        return null;
    };

    const handleAddNote = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await db.notizen.add({
                id: Date.now().toString(),
                person_id: activeUserId,
                titel: formData.titel,
                inhalt: formData.inhalt,
                created_at: new Date().toISOString()
            });

            resetForm();
        } catch (err) {
            setError('Fehler beim Speichern der Notiz');
            console.error('Error adding note:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateNote = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await db.notizen.update(editingId, {
                titel: formData.titel,
                inhalt: formData.inhalt
            });

            resetForm();
        } catch (err) {
            setError('Fehler beim Aktualisieren der Notiz');
            console.error('Error updating note:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteNote = async (id) => {
        if (!window.confirm(strings.notes.deleteConfirm)) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await db.notizen.delete(id);
        } catch (err) {
            setError('Fehler beim Löschen der Notiz');
            console.error('Error deleting note:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (note) => {
        setFormData({ titel: note.titel, inhalt: note.inhalt });
        setEditingId(note.id);
        setIsAdding(true);
    };

    const resetForm = () => {
        setFormData({ titel: '', inhalt: '' });
        setEditingId(null);
        setIsAdding(false);
        setError(null);
    };

    return (
        <div className="notizen-page">
            <h2>{strings.notes.title} 📝</h2>

            {!isAdding ? (
                <button
                    className="btn"
                    onClick={() => setIsAdding(true)}
                    disabled={isLoading}
                >
                    {strings.notes.addNote}
                </button>
            ) : (
                <div className="notizen-form">
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder={strings.notes.placeholderTitle}
                            value={formData.titel}
                            onChange={(e) => setFormData({...formData, titel: e.target.value})}
                            maxLength={50}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <textarea
                            placeholder={strings.notes.placeholderContent}
                            value={formData.inhalt}
                            onChange={(e) => setFormData({...formData, inhalt: e.target.value})}
                            maxLength={1000}
                        />
                    </div>

                    {error && <p className="error">{error}</p>}

                    <div className="form-actions">
                        <button
                            className="btn secondary"
                            onClick={resetForm}
                            disabled={isLoading}
                        >
                            {strings.common.cancel}
                        </button>
                        <button
                            className="btn primary"
                            onClick={editingId ? handleUpdateNote : handleAddNote}
                            disabled={isLoading}
                        >
                            {strings.common.save}
                        </button>
                    </div>
                </div>
            )}

            {isLoading && <p>{strings.common.loading}...</p>}

            <div className="notizen-list">
                {notizen?.length === 0 ? (
                    <p>{strings.notes.noNotes}</p>
                ) : (
                    notizen?.map(n => (
                        <div key={n.id} className="card">
                            <div className="card-header">
                                <h3>{n.titel}</h3>
                                <div className="card-actions">
                                    <button
                                        className="btn small"
                                        onClick={() => startEditing(n)}
                                        disabled={isLoading}
                                    >
                                        {strings.notes.editNote}
                                    </button>
                                    <button
                                        className="btn small danger"
                                        onClick={() => handleDeleteNote(n.id)}
                                        disabled={isLoading}
                                    >
                                        {strings.notes.deleteNote}
                                    </button>
                                </div>
                            </div>
                            <p>{n.inhalt}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotizenListe;
