/**
 * kochProfil.js – Koch-Profil Einstellungen
 *
 * Gespeichert in localStorage pro Nutzer.
 * Gilt für Chef Aivo (KI-Prompts) und Chef Luigi (Algo-Filter).
 */

export const DEFAULT_PROFIL = {
    // ── Ernährung ──
    keinSchwein:  false,
    keinFisch:    false,
    keinGefluegel:false,
    vegetarisch:  false,
    vegan:        false,
    glutenfrei:   false,
    laktosefrei:  false,
    keinNuesse:   false,

    // ── Küchen-Präferenzen (Array von Strings) ──
    kuechen: [],          // z.B. ['mediterran', 'asiatisch']

    // ── Zeit & Portionen ──
    maxZeit:   0,         // 0 = egal, sonst Minuten
    portionen: 2,

    // ── Freitext (eigene Regeln) ──
    freitext: '',

    // ── Luigi-spezifischer Prompt ──
    luigiPrompt: '',
};

export const KUECHEN_OPTIONEN = [
    { id: 'mediterran', label: '🌊 Mediterran' },
    { id: 'asiatisch',  label: '🥢 Asiatisch'  },
    { id: 'italienisch',label: '🍝 Italienisch' },
    { id: 'klassisch',  label: '🥩 Klassisch'   },
    { id: 'vegetarisch',label: '🥗 Vegetarisch' },
    { id: 'schnell',    label: '⚡ Schnell'      },
    { id: 'suppe',      label: '🍲 Suppen'       },
    { id: 'backen',     label: '🧁 Backen'       },
];

export const ZEIT_OPTIONEN = [
    { wert: 0,  label: 'Egal'      },
    { wert: 15, label: '15 Min.'   },
    { wert: 30, label: '30 Min.'   },
    { wert: 60, label: '1 Stunde'  },
];

const key = (userId) => `koch_profil_${userId}`;

export function loadProfil(userId) {
    try {
        const raw = localStorage.getItem(key(userId));
        if (!raw) return { ...DEFAULT_PROFIL };
        return { ...DEFAULT_PROFIL, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_PROFIL };
    }
}

export function saveProfil(userId, profil) {
    localStorage.setItem(key(userId), JSON.stringify(profil));
}

/**
 * Baut einen lesbaren Profil-String für KI-Prompts
 */
export function buildProfilText(profil) {
    const regeln = [];

    if (profil.vegan)         regeln.push('vegan');
    else if (profil.vegetarisch) regeln.push('vegetarisch');
    if (profil.keinSchwein)   regeln.push('kein Schweinefleisch');
    if (profil.keinFisch)     regeln.push('kein Fisch/Meeresfrüchte');
    if (profil.keinGefluegel) regeln.push('kein Geflügel');
    if (profil.glutenfrei)    regeln.push('glutenfrei');
    if (profil.laktosefrei)   regeln.push('laktosefrei');
    if (profil.keinNuesse)    regeln.push('keine Nüsse');

    const parts = [];
    if (regeln.length > 0)
        parts.push(`Ernährungsregeln: ${regeln.join(', ')}`);
    if (profil.kuechen?.length > 0)
        parts.push(`Bevorzugte Küchen: ${profil.kuechen.join(', ')}`);
    if (profil.maxZeit > 0)
        parts.push(`Maximale Kochzeit: ${profil.maxZeit} Minuten`);
    if (profil.portionen > 0)
        parts.push(`Portionen: ${profil.portionen} Personen`);
    if (profil.freitext?.trim())
        parts.push(`Weitere Wünsche: ${profil.freitext.trim()}`);

    return parts.length > 0 ? parts.join(' | ') : 'Keine speziellen Einschränkungen';
}

/**
 * Prüft ob ein Rezept gegen das Profil verstösst (für Luigi-Filter)
 */
export function rezeptErlaubt(rezept, profil) {
    if (!profil) return true;
    const zutaten = (rezept.zutaten || []).map(z =>
        (z.name || z).toLowerCase()
    );
    const text = [rezept.name || '', rezept.title || '', ...zutaten].join(' ').toLowerCase();

    if (profil.keinSchwein   && /schwein|speck|schinken|salami|wurst/.test(text)) return false;
    if (profil.keinFisch     && /fisch|lachs|thunfisch|garnele|shrimp|meeresfrüchte|kabeljau/.test(text)) return false;
    if (profil.keinGefluegel && /hähnchen|hühnchen|pute|truthahn|ente|geflügel/.test(text)) return false;
    if (profil.keinNuesse    && /nuss|nüsse|mandel|cashew|erdnuss|haselnuss/.test(text)) return false;
    if (profil.glutenfrei    && /weizen|mehl|brot|pasta|nudel|semmel/.test(text)) return false;
    if (profil.laktosefrei   && /milch|sahne|butter|käse|joghurt|quark/.test(text)) return false;
    if (profil.vegan         && /fleisch|fisch|ei|milch|sahne|butter|käse|honig|gelatine/.test(text)) return false;
    if (profil.vegetarisch   && /fleisch|hähnchen|schwein|rind|lamm|fisch|wurst|speck/.test(text)) return false;

    return true;
}
