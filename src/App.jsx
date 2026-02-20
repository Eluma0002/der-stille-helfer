import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';
import { useUser } from './context/UserContext';
import { checkAndNotifyExpiring, requestNotificationPermission } from './utils/notifications';
import Layout from './components/Layout';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import InstallBanner from './components/InstallBanner';
import Uebersicht from './pages/Uebersicht';
import ProdukteListe from './pages/ProdukteListe';
import RezepteListe from './pages/RezepteListe';
import KochAssistent from './pages/KochAssistent';
import AlgoKoch from './pages/AlgoKoch';
import EinkaufsListe from './pages/EinkaufsListe';
import FavoritenListe from './pages/FavoritenListe';
import NotizenListe from './pages/NotizenListe';
import Einstellungen from './pages/Einstellungen';
import BackupExport from './pages/BackupExport';
import RezeptDetails from './pages/RezeptDetails';
import TeilenSeite from './pages/TeilenSeite';
import Wochenplan from './pages/Wochenplan';

function NotificationWatcher() {
    const { activeUserId } = useUser();
    const produkte = useLiveQuery(
        () => activeUserId ? db.produkte.where('person_id').equals(activeUserId).toArray() : [],
        [activeUserId]
    );

    useEffect(() => {
        if (!produkte) return;
        requestNotificationPermission().then(granted => {
            if (granted) checkAndNotifyExpiring(produkte);
        });
    }, [produkte]);

    return null;
}

function App() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) { console.log('SW Registered: ' + r); },
        onRegisterError(error) { console.log('SW registration error', error); },
    });

    return (
        <>
            {needRefresh && (
                <PWAUpdatePrompt
                    onUpdate={() => updateServiceWorker(true)}
                    onDismiss={() => setNeedRefresh(false)}
                />
            )}
            <HashRouter>
                <NotificationWatcher />
                <InstallBanner />
                <Layout>
                    <Routes>
                        <Route path="/uebersicht"     element={<Uebersicht />} />
                        <Route path="/produkte"       element={<ProdukteListe />} />
                        <Route path="/rezepte"        element={<RezepteListe />} />
                        <Route path="/koch-assistent" element={<AlgoKoch />} />
                        <Route path="/einkauf"        element={<EinkaufsListe />} />
                        <Route path="/wochenplan"     element={<Wochenplan />} />
                        <Route path="/favoriten"      element={<FavoritenListe />} />
                        <Route path="/notizen"        element={<NotizenListe />} />
                        <Route path="/einstellungen"  element={<Einstellungen />} />
                        <Route path="/backup"         element={<BackupExport />} />
                        <Route path="/teilen"         element={<TeilenSeite />} />
                        <Route path="/rezept/:id"     element={<RezeptDetails />} />
                        <Route path="/"               element={<Navigate to="/uebersicht" replace />} />
                    </Routes>
                </Layout>
            </HashRouter>
        </>
    );
}

export default App;
