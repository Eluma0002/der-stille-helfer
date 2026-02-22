import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
import WelcomeScreen from './WelcomeScreen';
import UserSwitcher from './UserSwitcher';
import VoiceOverlay from './VoiceOverlay';

const NAV_ITEMS = [
    { path: '/uebersicht',     icon: '🏠', label: 'Home'      },
    { path: '/koch-assistent', icon: '🍳', label: 'Koch'      },
    { path: '/rezepte',        icon: '📖', label: 'Rezepte'   },
    { path: '/wochenplan',     icon: '📅', label: 'Plan'      },
    { path: '/einkauf',        icon: '🛒', label: 'Einkauf'   },
    { path: '/unterwegs',      icon: '🗺️', label: 'Unterwegs' },
    { path: '/teilen',         icon: '🤝', label: 'Teilen'    },
];

export default function Layout({ children }) {
    const { isFirstRun } = useUser();
    const location = useLocation();
    const { cycle, icon, label } = useTheme();

    if (isFirstRun) return <WelcomeScreen />;

    return (
        <div className="fridge-app">
            <header>
                <img src="/cellara-logo.png" className="header-logo" alt="Cellara" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <VoiceOverlay />
                    <button
                        onClick={cycle}
                        title={`Design: ${label}`}
                        style={{
                            background: 'rgba(255,255,255,0.18)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '5px 9px',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            lineHeight: 1,
                            color: 'white',
                        }}
                    >{icon}</button>
                    <Link
                        to="/einstellungen"
                        style={{
                            fontSize: '1.3rem',
                            textDecoration: 'none',
                            opacity: location.pathname === '/einstellungen' ? 1 : 0.75,
                            lineHeight: 1,
                        }}
                        title="Einstellungen"
                    >⚙️</Link>
                    <UserSwitcher />
                </div>
            </header>
            <main>{children}</main>
            <nav className="nav-bottom">
                {NAV_ITEMS.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={location.pathname === item.path ? 'active' : ''}
                    >
                        <span>{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
