import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
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
    const { cycle, icon, label } = useTheme();

    if (isFirstRun) return <WelcomeScreen />;

    return (
        <div className="fridge-app">
            <header>
                <h1>Cellara</h1>
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
                <div className="header-controls">
                    <button
                        onClick={cycle}
                        title={`Design: ${label}`}
                        className="header-btn"
                    >{icon}</button>
                    <Link
                        to="/einstellungen"
                        className="header-btn"
                        title="Einstellungen"
                        style={{ opacity: location.pathname === '/einstellungen' ? 1 : 0.75 }}
                    >⚙️</Link>
                    <UserSwitcher />
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}
