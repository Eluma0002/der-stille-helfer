/**
 * voiceCommands.js – Sprachbefehl-Parser
 *
 * Verarbeitet erkannten Text und gibt eine Aktion zurück.
 * Unterstützt Synonyme und flexible Formulierungen.
 */

// ── Navigation ──────────────────────────────────────────────────────────────

const NAV_RULES = [
    {
        path:     '/uebersicht',
        label:    'Hauptseite',
        patterns: ['home', 'hauptseite', 'übersicht', 'anfang', 'start', 'zurück'],
    },
    {
        path:     '/produkte',
        label:    'Inventar',
        patterns: ['inventar', 'kühlschrank', 'vorrat', 'produkte', 'zutaten', 'was habe ich'],
    },
    {
        path:     '/rezepte',
        label:    'Rezepte',
        patterns: ['rezepte', 'rezept', 'rezeptliste'],
    },
    {
        path:     '/einkauf',
        label:    'Einkaufsliste',
        patterns: ['einkauf', 'einkaufsliste', 'einkaufen', 'shopping', 'was brauche ich'],
    },
    {
        path:     '/koch-assistent',
        label:    'Koch',
        patterns: ['koch', 'kochen', 'chef', 'rezeptvorschlag', 'was kann ich kochen'],
    },
    {
        path:     '/wochenplan',
        label:    'Wochenplan',
        patterns: ['wochenplan', 'plan', 'planung', 'woche'],
    },
    {
        path:     '/einstellungen',
        label:    'Einstellungen',
        patterns: ['einstellungen', 'settings', 'konfiguration'],
    },
    {
        path:     '/favoriten',
        label:    'Favoriten',
        patterns: ['favoriten', 'lieblinge', 'lieblingsrezepte'],
    },
    {
        path:     '/notizen',
        label:    'Notizen',
        patterns: ['notizen', 'notiz', 'merkzettel'],
    },
    {
        path:     '/unterwegs',
        label:    'Unterwegs',
        patterns: ['unterwegs', 'essen gehen', 'auswärts', 'restaurant', 'imbiss'],
    },
];

// ── Aktions-Schlüsselwörter ─────────────────────────────────────────────────

const NAV_TRIGGERS = [
    'geh zu', 'gehe zu', 'öffne', 'zeig', 'zeige', 'wechsel zu',
    'wechsle zu', 'navigiere zu', 'gehe nach', 'geh nach', 'geh auf',
];

// ── Haupt-Parser ────────────────────────────────────────────────────────────

/**
 * parseVoiceCommand(text: string) → {
 *   type: 'navigate' | 'query' | 'unknown',
 *   path?: string,
 *   label?: string,
 *   text?: string,
 *   displayText: string,
 * }
 */
export function parseVoiceCommand(rawText) {
    const text    = rawText.trim().toLowerCase();
    const display = rawText.trim();

    // 1) Navigation mit explizitem Trigger-Wort
    const hasTrigger = NAV_TRIGGERS.some(t => text.startsWith(t) || text.includes(t));

    if (hasTrigger) {
        for (const rule of NAV_RULES) {
            if (rule.patterns.some(p => text.includes(p))) {
                return {
                    type:        'navigate',
                    path:        rule.path,
                    label:       rule.label,
                    displayText: `→ ${rule.label}`,
                };
            }
        }
    }

    // 2) Navigation auch ohne Trigger (direktes Keyword)
    for (const rule of NAV_RULES) {
        if (rule.patterns.some(p => text === p || text === `zeig ${p}` || text === `öffne ${p}`)) {
            return {
                type:        'navigate',
                path:        rule.path,
                label:       rule.label,
                displayText: `→ ${rule.label}`,
            };
        }
    }

    // 3) Spezielle Befehle
    if (text.includes('abgelaufen') || text.includes('was läuft ab') || text.includes('reste')) {
        return {
            type:        'navigate',
            path:        '/koch-assistent',
            label:       'Koch (Reste)',
            displayText: '→ Koch: Reste anzeigen',
        };
    }

    // 4) Freie KI-Anfrage
    if (
        text.includes('was kann ich') ||
        text.includes('schlag vor') ||
        text.includes('idee') ||
        text.includes('rezept für') ||
        text.includes('was mache ich') ||
        text.length > 30
    ) {
        return {
            type:        'query',
            text:        rawText.trim(),
            displayText: `🧠 Frage: "${display.slice(0, 40)}${display.length > 40 ? '…' : ''}"`,
        };
    }

    return {
        type:        'unknown',
        text:        rawText.trim(),
        displayText: `"${display}"`,
    };
}

export { NAV_RULES };
