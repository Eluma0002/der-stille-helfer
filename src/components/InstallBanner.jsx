import React, { useState, useEffect } from 'react';
import './InstallBanner.css';

export default function InstallBanner() {
    const [prompt, setPrompt] = useState(null);
    const [dismissed, setDismissed] = useState(
        () => localStorage.getItem('install_dismissed') === '1'
    );

    useEffect(() => {
        const handler = (e) => { e.preventDefault(); setPrompt(e); };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    if (!prompt || dismissed) return null;

    const install = async () => {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') setPrompt(null);
    };

    const dismiss = () => {
        setDismissed(true);
        localStorage.setItem('install_dismissed', '1');
    };

    return (
        <div className="install-banner">
            <span className="install-banner-icon">📱</span>
            <div className="install-banner-text">
                <strong>Als App installieren</strong>
                <span>Offline, schneller Start, kein Browser</span>
            </div>
            <button className="install-btn" onClick={install}>Installieren</button>
            <button className="install-close" onClick={dismiss} aria-label="Schliessen">✕</button>
        </div>
    );
}
