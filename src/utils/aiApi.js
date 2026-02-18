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

function buildSystemPrompt({ produkte, profile }) {
    const inventar = produkte?.length > 0
        ? produkte.map(p => p.name).join(', ')
        : 'Kein Inventar erfasst';

    const verboten = profile?.allergyProfile?.forbidden?.length > 0
        ? profile.allergyProfile.forbidden.join(', ')
        : 'keine';

    const erlaubt = profile?.allergyProfile?.allowed?.length > 0
        ? ` (erlaubt trotzdem: ${profile.allergyProfile.allowed.join(', ')})`
        : '';

    return `Du bist "KI-Koch", ein freundlicher Koch-Assistent in der App "Der Stille Helfer".
Antworte immer auf Deutsch. Sei kurz, praktisch und ermutigend.

Inventar des Nutzers: ${inventar}
Allergien/Unverträglichkeiten: ${verboten}${erlaubt}

Hilf beim: Rezeptvorschläge (nur mit vorhandenen Zutaten), Kochtipps, Zutaten ersetzen, Fragen rund ums Kochen.`;
}

async function callOpenAI(url, model, apiKey, messages) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({ model, messages, max_tokens: 600, temperature: 0.7 }),
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
    if (!cfg)          throw new Error(`Unbekannter Anbieter: ${provider}`);
    if (!apiKey?.trim()) throw new Error('Kein API-Key – bitte in den Einstellungen eintragen.');

    const messages = [
        { role: 'system', content: buildSystemPrompt(context) },
        ...history.slice(-8),
        { role: 'user', content: question },
    ];

    if (cfg.format === 'gemini') return callGemini(apiKey, messages);
    return callOpenAI(cfg.url, cfg.model, apiKey, messages);
}
