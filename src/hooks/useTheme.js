import { useState, useEffect } from 'react';

const STORAGE_KEY = 'app_theme'; // 'auto' | 'light' | 'dark'

function applyTheme(theme) {
    const html = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
    html.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY) || 'auto';
        applyTheme(saved); // apply immediately to avoid flash
        return saved;
    });

    useEffect(() => {
        applyTheme(theme);

        if (theme === 'auto') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => applyTheme('auto');
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, [theme]);

    const setTheme = (t) => {
        localStorage.setItem(STORAGE_KEY, t);
        setThemeState(t);
        applyTheme(t);
    };

    const cycle = () => {
        const next = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto';
        setTheme(next);
    };

    const icon = theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🌓';
    const label = theme === 'light' ? 'Hell' : theme === 'dark' ? 'Dunkel' : 'Auto';

    return { theme, setTheme, cycle, icon, label };
}
