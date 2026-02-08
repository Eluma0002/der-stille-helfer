import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureProfileExists } from '../db/schema';
import { useUser } from '../context/UserContext';
import { strings } from '../strings/de';
import './Einstellungen.css';

const Einstellungen = () => {
    const { activeUser, activeUserId, switchUser, users } = useUser();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        allergies: '',
        preferences: '',
        dietary_restrictions: []
    });

    // Load profile data
    useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Ensure profile exists with dietary_restrictions
                await ensureProfileExists(activeUserId);

                const existingProfile = await db.profile.where('person_id').equals(activeUserId).first();

                if (existingProfile) {
                    setProfile(existingProfile);
                    setFormData({
                        name: existingProfile.name || '',
                        allergies: existingProfile.allergies || '',
                        preferences: existingProfile.preferences || '',
                        dietary_restrictions: existingProfile.dietary_restrictions || []
                    });
                } else {
                    // Set defaults based on user
                    const defaultName = activeUser?.name || '';
                    setFormData({
                        name: defaultName,
                        allergies: activeUserId === 'elvis' ? 'Keine Milch, kein Weizen' : '',
                        preferences: '',
                        dietary_restrictions: []
                    });
                }
            } catch (err) {
                setError('Fehler beim Laden des Profils');
                console.error('Error loading profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeUserId) {
            loadProfile();
        }
    }, [activeUserId, activeUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const profileData = {
                person_id: activeUserId,
                name: formData.name,
                allergies: formData.allergies,
                preferences: formData.preferences,
                dietary_restrictions: formData.dietary_restrictions || [],
                updated_at: new Date().toISOString()
            };

            if (profile) {
                await db.profile.update(profile.id, profileData);
            } else {
                await db.profile.add({
                    id: `profile-${activeUserId}`,
                    ...profileData
                });
            }

            setSuccess(strings.settings.saveSuccess);
            setProfile(profileData);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(strings.settings.saveError);
            console.error('Error saving profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetApp = async () => {
        if (!window.confirm(strings.settings.resetConfirm)) {
            return;
        }

        try {
            // Clear all data from IndexedDB
            await db.delete();
            await db.open();

            // Reload the app
            window.location.reload();
        } catch (err) {
            setError('Fehler beim Zurücksetzen der App');
            console.error('Error resetting app:', err);
        }
    };

    return (
        <div className="settings-page">
            <h2>{strings.settings.title} ⚙️</h2>

            <div className="card">
                <h3>Nutzer-Auswahl</h3>
                <div className="user-selection">
                    {Object.entries(users).map(([userId, user]) => (
                        <div key={userId} className="user-option">
                            <span>{user.emoji} {user.name}</span>
                            {activeUserId === userId ? (
                                <span className="active-badge">✓ Aktiv</span>
                            ) : (
                                <button
                                    className="btn small"
                                    onClick={() => switchUser(userId)}
                                >
                                    Auswählen
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="card">
                <h3>{strings.settings.profile}</h3>
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="name">{strings.settings.name}</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="allergies">{strings.settings.allergies}</label>
                        <textarea
                            id="allergies"
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="preferences">{strings.settings.preferences}</label>
                        <textarea
                            id="preferences"
                            name="preferences"
                            value={formData.preferences}
                            onChange={handleChange}
                        />
                    </div>

                    {error && <p className="error">{error}</p>}
                    {success && <p className="success">{success}</p>}

                    <button
                        type="submit"
                        className="btn primary"
                        disabled={isLoading}
                    >
                        {isLoading ? `${strings.common.loading}...` : 'Profil speichern'}
                    </button>
                </form>
            </div>

            <div className="card">
                <h3>{strings.settings.dietaryRestrictions}</h3>
                {formData.dietary_restrictions && formData.dietary_restrictions.length > 0 ? (
                    <>
                        <p className="restrictions-info">{strings.settings.restrictionsInfo}</p>
                        <div className="restrictions-list">
                            {formData.dietary_restrictions.map((restriction, idx) => (
                                <span key={idx} className="restriction-tag">
                                    {restriction}
                                </span>
                            ))}
                        </div>
                        <p className="restriction-count">
                            {formData.dietary_restrictions.length} {strings.settings.restrictionCount}
                        </p>
                    </>
                ) : (
                    <p className="no-restrictions">{strings.settings.noRestrictions}</p>
                )}
            </div>

            <div className="reset-section">
                <button
                    className="btn btn-alert"
                    onClick={resetApp}
                    type="button"
                >
                    {strings.settings.resetApp}
                </button>
            </div>
        </div>
    );
};

export default Einstellungen;
