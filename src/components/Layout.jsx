import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import WelcomeScreen from './WelcomeScreen';
import UserSwitcher from './UserSwitcher';

export default function Layout({ children }) {
    const { isFirstRun } = useUser();

    // Show welcome screen for first-time users
    if (isFirstRun) {
        return <WelcomeScreen />;
    }

    return (
        <div className="fridge-app">
            <header>
                <h1>Der Stille Helfer</h1>
                <UserSwitcher />
            </header>
            <main>{children}</main>
            <nav>
                <Link to="/uebersicht">🏠</Link>
                <Link to="/produkte">🧊</Link>
                <Link to="/rezepte">👨‍🍳</Link>
                <Link to="/einkauf">🛒</Link>
                <Link to="/notizen">📝</Link>
                <Link to="/einstellungen">⚙️</Link>
            </nav>
        </div>
    );
}
