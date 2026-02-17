import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Layout from './components/Layout';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import Uebersicht from './pages/Uebersicht';
import ProdukteListe from './pages/ProdukteListe';
import RezepteListe from './pages/RezepteListe';
import KochAssistent from './pages/KochAssistent';
import EinkaufsListe from './pages/EinkaufsListe';
import FavoritenListe from './pages/FavoritenListe';
import NotizenListe from './pages/NotizenListe';
import Einstellungen from './pages/Einstellungen';
import BackupExport from './pages/BackupExport';
import RezeptDetails from './pages/RezeptDetails';
import TeilenSeite from './pages/TeilenSeite';

function App() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const handleUpdate = () => {
        updateServiceWorker(true);
    };

    const handleDismiss = () => {
        setNeedRefresh(false);
    };

    return (
        <>
            {needRefresh && (
                <PWAUpdatePrompt
                    onUpdate={handleUpdate}
                    onDismiss={handleDismiss}
                />
            )}
            <HashRouter>
                <Layout>
                    <Routes>
                        <Route path="/uebersicht" element={<Uebersicht />} />
                        <Route path="/produkte" element={<ProdukteListe />} />
                        <Route path="/rezepte" element={<RezepteListe />} />
                        <Route path="/koch-assistent" element={<KochAssistent />} />
                        <Route path="/einkauf" element={<EinkaufsListe />} />
                        <Route path="/favoriten" element={<FavoritenListe />} />
                        <Route path="/notizen" element={<NotizenListe />} />
                        <Route path="/einstellungen" element={<Einstellungen />} />
                        <Route path="/backup" element={<BackupExport />} />
                        <Route path="/teilen" element={<TeilenSeite />} />
                        <Route path="/rezept/:id" element={<RezeptDetails />} />
                        <Route path="/" element={<Navigate to="/uebersicht" replace />} />
                    </Routes>
                </Layout>
            </HashRouter>
        </>
    );
}

export default App;
