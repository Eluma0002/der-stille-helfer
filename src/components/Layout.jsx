import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import WelcomeScreen from './WelcomeScreen';
import UserSwitcher from './UserSwitcher';

const NAV_ITEMS = [
    { path: '/uebersicht',     icon: '🏠', label: 'Home'     },
    { path: '/produkte',       icon: '🧊', label: 'Inventar' },
    { path: '/rezepte',        icon: '📖', label: 'Rezepte'  },
    { path: '/wochenplan',     icon: '📅', label: 'Plan'     },
    { path: '/koch-assistent', icon: '🍳', label: 'Koch-AI'  },
    { path: '/einkauf',        icon: '🛒', label: 'Einkauf'  },
    { path: '/teilen',         icon: '🤝', label: 'Teilen'   },
];

export default function Layout({ children }) {
    const { isFirstRun } = useUser();
    const location = useLocation();

    if (isFirstRun) return <WelcomeScreen />;

    return (
        <div className="fridge-app">
            <header>
                <h1>Der Stille Helfer</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <nav>
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
