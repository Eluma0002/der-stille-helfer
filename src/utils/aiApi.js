// ── KI-Koch API Abstraction ───────────────────────────────
// Unterstützt: Groq (gratis), Gemini (gratis), OpenRouter (gratis)

export const AI_PROVIDERS = {
    groq: {
        name: 'Groq · Llama 3.3',
        description: 'Kostenlos · Sehr schnell · Top-Qualität',
        signupUrl: 'https://console.groq.com',
        format: 'openai',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
    },
    gemini: {
        name: 'Google Gemini Flash',
        description: 'Kostenlos · Schnell · Von Google',
        signupUrl: 'https://aistudio.google.com',
        format: 'gemini',
    },
    openrouter: {
        name: 'OpenRouter · Llama 3.2',
        description: 'Kostenlos · Viele Modelle',
        signupUrl: 'https://openrouter.ai',
        format: 'openai',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'meta-llama/llama-3.2-3b-instruct:free',
    },
};

function buildSystemPrompt({ produkte, profile, kochProfil }) {
    const inventar = produkte?.length > 0
        ? produkte.map(p => p.name).join(', ')
        : 'Kein Inventar erfasst';

    const verboten = profile?.allergyProfile?.forbidden?.length > 0
        ? profile.allergyProfile.forbidden.join(', ')
        : 'keine';

    const erlaubt = profile?.allergyProfile?.allowed?.length > 0
        ? ` (erlaubt trotzdem: ${profile.allergyProfile.allowed.join(', ')})`
        : '';

    const profilText = kochProfil || 'Keine speziellen Einschränkungen';

    return `Du bist "Chef Aivo", ein kreativer, freundlicher Koch-Assistent in der App "Cellara".
Antworte immer auf Deutsch. Sei kurz, praktisch und ermutigend.

Inventar des Nutzers: ${inventar}
Allergien/Unverträglichkeiten: ${verboten}${erlaubt}
Koch-Profil des Nutzers: ${profilText}

Halte dich STRIKT an das Koch-Profil. Schlage niemals Rezepte vor, die dagegen verstossen.
Hilf beim: Rezeptvorschläge, Kochtipps, Zutaten ersetzen, Fragen rund ums Kochen.`;
}

// ── Rezept-Generator Prompt ────────────────────────────────────────────────

function buildRezeptGeneratorPrompt({ produkte, kochProfil, anzahl = 4 }) {
    const inventar = produkte?.length > 0
        ? produkte.map(p => p.name).join(', ')
        : 'unbekannt';

    return `Du bist Chef Aivo, ein kreativer Koch. Erstelle ${anzahl} verschiedene, kreative Rezepte auf Deutsch.

Vorrat des Nutzers: ${inventar}
Koch-Profil: ${kochProfil || 'Keine Einschränkungen'}

WICHTIG: Halte dich STRIKT an das Koch-Profil. Nie dagegen verstossen.
Nutze wenn möglich Zutaten aus dem Vorrat, darf aber auch andere Zutaten vorschlagen.
Rezepte sollen kreativ, lecker und realistisch kochbar sein.

Antworte NUR mit validem JSON, kein Text davor oder danach:
{
  "rezepte": [
    {
      "name": "Rezeptname",
      "beschreibung": "Kurze appetitliche Beschreibung (1-2 Sätze)",
      "zutaten": [
        {"name": "Zutat", "menge": "200g"}
      ],
      "anleitung": "1. Schritt\\n2. Schritt\\n3. Schritt",
      "zeit": 30,
      "portionen": 2,
      "mahlzeit": "mittag",
      "tags": ["kreativ", "mediterran"],
      "schwierigkeit": "einfach"
    }
  ]
}

mahlzeit ist eines von: fruehstueck, mittag, abend, snack
schwierigkeit ist eines von: einfach, mittel, schwer`;
}

async function callOpenAI(url, model, apiKey, messages, maxTokens = 600) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Fehler ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
}

async function callGemini(apiKey, messages) {
    const sys = messages.find(m => m.role === 'system')?.content || '';
    const contents = messages
        .filter(m => m.role !== 'system')
        .map((m, i) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: i === 0 && sys ? `${sys}\n\n${m.content}` : m.content }],
        }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 600, temperature: 0.7 } }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Fehler ${res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

export async function askAI({ provider, apiKey, question, history = [], context = {} }) {
    const cfg = AI_PROVIDERS[provider];
    if (!cfg)            throw new Error(`Unbekannter Anbieter: ${provider}`);
    if (!apiKey?.trim()) throw new Error('Kein API-Key – bitte in den Einstellungen eintragen.');

    const messages = [
        { role: 'system', content: buildSystemPrompt(context) },
        ...history.slice(-8),
        { role: 'user', content: question },
    ];

    if (cfg.format === 'gemini') return callGemini(apiKey, messages);
    return callOpenAI(cfg.url, cfg.model, apiKey, messages);
}

/**
 * Chef Aivo holt frische KI-Rezepte (JSON-Format)
 * Gibt Array von Rezept-Objekten zurück
 */
export async function askAivoForRecipes({ provider, apiKey, produkte, kochProfil, anzahl = 4 }) {
    const cfg = AI_PROVIDERS[provider];
    if (!cfg)            throw new Error(`Unbekannter Anbieter: ${provider}`);
    if (!apiKey?.trim()) throw new Error('Kein API-Key – bitte in den Einstellungen eintragen.');

    const prompt = buildRezeptGeneratorPrompt({ produkte, kochProfil, anzahl });
    const messages = [
        { role: 'system', content: 'Du bist ein Koch-Assistent. Antworte NUR mit validem JSON.' },
        { role: 'user',   content: prompt },
    ];

    let rawText;
    if (cfg.format === 'gemini') {
        rawText = await callGemini(apiKey, messages);
    } else {
        // Höheres Token-Limit für Rezepte
        rawText = await callOpenAI(cfg.url, cfg.model, apiKey, messages, 2000);
    }

    // JSON extrahieren (manchmal kommt Markdown ```json ... ``` darum)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('KI hat kein gültiges JSON zurückgegeben. Bitte nochmal versuchen.');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.rezepte)) throw new Error('Unerwartetes Format von Chef Aivo.');

    return parsed.rezepte;
}
