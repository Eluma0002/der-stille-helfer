/**
 * aiService.js — Der stille Helfer GSD
 * Zentrale KI-Anbindung: OpenAI GPT-4o-mini für Foto, Kassenbon, Essensplan
 * API-Key wird in localStorage gespeichert (bleibt lokal auf dem Gerät)
 */

const LS_KEY_PROVIDER = 'gsd_ki_provider';
const LS_KEY_OPENAI   = 'gsd_ki_openai_key';
const LS_KEY_ANTHROPIC = 'gsd_ki_anthropic_key';

export function getKIProvider() {
    return localStorage.getItem(LS_KEY_PROVIDER) || 'openai';
}

export function getKIKey(provider) {
    if (provider === 'anthropic') return localStorage.getItem(LS_KEY_ANTHROPIC) || '';
    return localStorage.getItem(LS_KEY_OPENAI) || '';
}

export function saveKISettings(provider, key) {
    localStorage.setItem(LS_KEY_PROVIDER, provider);
    if (provider === 'anthropic') {
        localStorage.setItem(LS_KEY_ANTHROPIC, key);
    } else {
        localStorage.setItem(LS_KEY_OPENAI, key);
    }
}

export function isKIConfigured() {
    const provider = getKIProvider();
    const key = getKIKey(provider);
    return key.length > 10;
}

// ─── Bild komprimieren ─────────────────────────────────────────────────────
export function compressImage(file, maxWidth = 1024, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
                resolve(base64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ─── OpenAI-Aufruf ─────────────────────────────────────────────────────────
async function callOpenAI(messages, systemPrompt, apiKey, jsonMode = true) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            response_format: jsonMode ? { type: 'json_object' } : undefined,
            max_tokens: 2048,
            temperature: 0.4
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI Fehler: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('KI hat keine Antwort zurückgegeben');
    return content;
}

// ─── Anthropic-Aufruf ──────────────────────────────────────────────────────
async function callAnthropic(messages, systemPrompt, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2048,
            system: systemPrompt,
            messages
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Anthropic Fehler: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
}

// ─── KI-Aufruf (Provider-unabhängig) ──────────────────────────────────────
async function callKI(messages, systemPrompt) {
    const provider = getKIProvider();
    const key = getKIKey(provider);

    if (!key || key.length < 10) {
        throw new Error('Kein KI-API-Key konfiguriert. Bitte in den Einstellungen eingeben.');
    }

    if (provider === 'anthropic') {
        return callAnthropic(messages, systemPrompt, key);
    }
    return callOpenAI(messages, systemPrompt, key, true);
}

// ─── Kühlschrank-Foto analysieren ──────────────────────────────────────────
const FOTO_PROMPT = `Du bist ein Lebensmittel-Erkennungssystem. Analysiere das Bild eines Kühlschranks oder Lebensmittelbehälters.

Erkenne alle sichtbaren Lebensmittel und gib zurück:
{
  "items": [
    {
      "name": "Produktname auf Deutsch",
      "kategorie": "kuehlschrank|gefrierschrank|fruechte|gemuese|vorrat|getraenke|gewuerze",
      "ablaufTage": 7
    }
  ]
}

Sei präzise. Nur klar erkennbare Produkte. Kategorie passend wählen.`;

export async function analyzePhoto(base64Image) {
    const provider = getKIProvider();
    const key = getKIKey(provider);
    if (!key) throw new Error('Kein KI-API-Key konfiguriert');

    let content;
    if (provider === 'anthropic') {
        const messages = [{
            role: 'user',
            content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
                { type: 'text', text: 'Erkenne alle Lebensmittel auf dem Bild und gib sie als JSON zurück.' }
            ]
        }];
        content = await callAnthropic(messages, FOTO_PROMPT, key);
    } else {
        const messages = [{
            role: 'user',
            content: [
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'low' } },
                { type: 'text', text: 'Erkenne alle Lebensmittel auf dem Bild.' }
            ]
        }];
        content = await callOpenAI(messages, FOTO_PROMPT, key, true);
    }

    const parsed = JSON.parse(content.includes('{') ? content : `{"items":[]}`);
    return parsed.items || [];
}

// ─── Kassenbon analysieren ─────────────────────────────────────────────────
const BON_PROMPT = `Du bist ein Kassenbon-Scanner. Analysiere das Bild eines Kassenbons.

Extrahiere alle Lebensmittel/Produkte und gib zurück:
{
  "laden": "Ladename",
  "datum": "2024-01-15",
  "items": [
    {
      "name": "Produktname auf Deutsch",
      "menge": "1",
      "kategorie": "kuehlschrank|gefrierschrank|fruechte|gemuese|vorrat|getraenke|gewuerze"
    }
  ]
}

Nur Lebensmittel. Keine Haushaltswaren, Steuern oder Zahlungsinfos.`;

export async function analyzeReceipt(base64Image) {
    const provider = getKIProvider();
    const key = getKIKey(provider);
    if (!key) throw new Error('Kein KI-API-Key konfiguriert');

    let content;
    if (provider === 'anthropic') {
        const messages = [{
            role: 'user',
            content: [
                { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
                { type: 'text', text: 'Extrahiere alle Lebensmittel vom Kassenbon als JSON.' }
            ]
        }];
        content = await callAnthropic(messages, BON_PROMPT, key);
    } else {
        const messages = [{
            role: 'user',
            content: [
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'low' } },
                { type: 'text', text: 'Extrahiere alle Lebensmittel vom Kassenbon.' }
            ]
        }];
        content = await callOpenAI(messages, BON_PROMPT, key, true);
    }

    const parsed = JSON.parse(content.includes('{') ? content : `{"items":[]}`);
    return { laden: parsed.laden, datum: parsed.datum, items: parsed.items || [] };
}

// ─── Wochenessensplan erstellen ────────────────────────────────────────────
const PLAN_PROMPT = `Du bist ein Ernährungsplaner. Erstelle einen deutschen Wochenessensplan basierend auf dem vorhandenen Inventar.

Antworte NUR mit diesem JSON-Format:
{
  "zusammenfassung": "Kurze Beschreibung des Wochenplans (1-2 Sätze)",
  "tage": [
    {
      "tag": "Montag",
      "mahlzeiten": [
        { "zeit": "Frühstück", "rezept": "Name", "zutaten": ["Zutat1", "Zutat2"] },
        { "zeit": "Mittagessen", "rezept": "Name", "zutaten": ["Zutat1"] },
        { "zeit": "Abendessen", "rezept": "Name", "zutaten": ["Zutat1", "Zutat2"] }
      ]
    }
  ]
}

Erstelle Pläne für alle 7 Tage (Montag bis Sonntag).
Bevorzuge Produkte die bald ablaufen.
Rezepte sollen einfach und alltagstauglich sein.`;

export async function generateMealPlan(inventar, profil) {
    const inventarText = inventar
        .map(p => {
            const ablauf = p.ablauf ? `(ablauft: ${new Date(p.ablauf).toLocaleDateString('de-DE')})` : '';
            return `- ${p.name} ${ablauf}`;
        })
        .join('\n');

    const profilText = profil
        ? `\nErnährungsprofil: ${profil.nutritionProfile?.basis || 'omnivor'}. Vermeiden: ${profil.allergyProfile?.vermeiden?.join(', ') || 'nichts'}.`
        : '';

    const userMessage = `Mein aktueller Vorrat:\n${inventarText}${profilText}\n\nErstelle einen Wochenplan.`;

    const content = await callKI(
        [{ role: 'user', content: userMessage }],
        PLAN_PROMPT
    );

    const parsed = JSON.parse(content.includes('{') ? content : '{"tage":[]}');
    return {
        zusammenfassung: parsed.zusammenfassung || 'Wochenplan erstellt',
        tage: parsed.tage || []
    };
}
