import React from 'react';
import './PWAUpdatePrompt.css';

const PWAUpdatePrompt = ({ onUpdate, onDismiss }) => {
    return (
        <div className="pwa-update-toast">
            <div className="pwa-update-content">
                <span className="pwa-update-icon">✨</span>
                <span className="pwa-update-text">Neue Version verfügbar!</span>
            </div>
            <div className="pwa-update-actions">
                <button className="pwa-update-btn" onClick={onUpdate}>
                    Aktualisieren
                </button>
                <button className="pwa-dismiss-btn" onClick={onDismiss} aria-label="Schließen">
                    &times;
                </button>
            </div>
        </div>
    );
};

export default PWAUpdatePrompt;
