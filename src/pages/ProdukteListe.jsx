import React, { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { DEFAULT_CATEGORIES } from '../constants';
import { useUser } from '../context/UserContext';
import { strings } from '../strings/de';
import BarcodeScanner from '../components/BarcodeScanner';
import { searchProduct } from '../api/openfoodfacts';
import ProductIcon from '../components/ProductIcon';
import './ProdukteListe.css';

const getExpiryText = (ablaufDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(ablaufDate);
    expiry.setHours(0, 0, 0, 0);
    const diffMs = expiry - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0)  return { text: 'abgelaufen', className: 'expiry-expired' };
    if (diffDays === 0) return { text: 'heute', className: 'expiry-today' };
    if (diffDays === 1) return { text: 'morgen', className: 'expiry-soon' };
    if (diffDays < 7)  return { text: `noch ${diffDays} Tage`, className: 'expiry-ok' };
    const weeks = Math.floor(diffDays / 7);
    if (weeks < 4)     return { text: `noch ${weeks} Wochen`, className: 'expiry-good' };
    return { text: `noch ${diffDays} Tage`, className: 'expiry-good' };
};

// ── Häufigkeits-Sortierung ────────────────────────
const COMMON_PRODUCTS = [
    'milch', 'butter', 'eier', 'ei', 'joghurt', 'käse', 'quark', 'sahne',
    'rahm', 'frischkäse', 'mozzarella', 'cheddar',
    'brot', 'toast', 'brötchen', 'semmel',
    'apfel', 'banane', 'orange', 'traube', 'beere', 'erdbeere',
    'kartoffel', 'tomate', 'gurke', 'zwiebel', 'karotte', 'möhre',
    'paprika', 'spinat', 'salat', 'zucchini',
    'nudeln', 'pasta', 'spaghetti', 'reis', 'mehl', 'zucker',
    'salz', 'pfeffer', 'öl', 'olivenöl', 'essig',
    'wasser', 'saft', 'kaffee', 'tee', 'cola',
    'fleisch', 'huhn', 'hühnchen', 'hack', 'wurst', 'schinken',
    'fisch', 'lachs', 'thunfisch',
    'schokolade', 'marmelade', 'honig', 'nuss',
];

const getProductPriority = (name) => {
    const lower = name.toLowerCase();
    const idx = COMMON_PRODUCTS.findIndex(p => lower.includes(p));
    return idx === -1 ? COMMON_PRODUCTS.length : idx;
};

// hex → "r, g, b" for rgba()
const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
};

// ── Kategorie-Tipp ohne API ──────────────────────────────────────────────────
function guessCategory(name) {
    const n = (name || '').toLowerCase();
    if (/milch|joghurt|käse|butter|sahne|quark|skyr|ei$|eier|kefir|frischkäse/.test(n)) return 'kuehlschrank';
    if (/tiefkühl|eis |gefror|schnitzel|nuggets/.test(n)) return 'gefrierschrank';
    if (/apfel|birne|banane|orange|zitrone|beere|kirsche|traube|erdbeere|mango|melone|pfirsich/.test(n)) return 'fruechte';
    if (/salat|tomate|gurke|möhre|karotte|zucchini|zwiebel|knoblauch|paprika|spinat|brokkoli|kohlrabi|kohl/.test(n)) return 'gemuese';
    if (/wasser|saft|cola|bier|wein|limo|tee|kaffee|sprudel/.test(n)) return 'getraenke';
    if (/salz|pfeffer|oregano|basilikum|cumin|zimt|muskat|curry|paprikapulver/.test(n)) return 'gewuerze';
    return 'vorrat';
}

// ── Artikel-Prüf-Dialog (für Sprache + OCR) ─────────────────────────────────
function ItemsReview({ items, onConfirm, onCancel }) {
    const [selected, setSelected] = useState(items.map((_, i) => i));
    const [itemData, setItemData] = useState(items);

    const toggleItem = (idx) =>
        setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);

    const handleKatChange = (idx, kat) =>
        setItemData(prev => prev.map((item, i) => i === idx ? { ...item, kategorie: kat } : item));

    return (
        <div className="ai-review">
            <h4 className="ai-review-title">Erkannte Produkte ({items.length})</h4>
            <div className="ai-review-list">
                {itemData.map((item, idx) => (
                    <label key={idx} className={`ai-review-item ${selected.includes(idx) ? 'selected' : 'deselected'}`}>
                        <input type="checkbox" checked={selected.includes(idx)} onChange={() => toggleItem(idx)} />
                        <span className="ai-item-name">{item.name}</span>
                        <select
                            value={item.kategorie || 'vorrat'}
                            onChange={(e) => handleKatChange(idx, e.target.value)}
                            className="ai-item-kat"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {DEFAULT_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    </label>
                ))}
            </div>
            <div className="ai-review-actions">
                <button className="btn small secondary" onClick={onCancel}>Abbrechen</button>
                <button
                    className="btn small primary"
                    onClick={() => onConfirm(itemData.filter((_, i) => selected.includes(i)))}
                    disabled={selected.length === 0}
                >
                    {selected.length} hinzufügen
                </button>
            </div>
        </div>
    );
}

const SCANNER_TABS = [
    { id: 'barcode', label: 'Barcode', icon: '📊' },
    { id: 'sprache', label: 'Sprache', icon: '🎤' },
    { id: 'zettel',  label: 'Zettel',  icon: '📝' },
];

const ProdukteListe = () => {
    const { activeUserId } = useUser();

    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    const einkaufItems = useLiveQuery(
        () => db.einkaufsliste.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    // Inventar-Formular
    const [name, setName] = useState('');
    const [kat, setKat] = useState('kuehlschrank');
    const [ablauf, setAblauf] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState('');

    // Produkt bearbeiten
    const [editProduct, setEditProduct] = useState(null);
    const [viewMode, setViewMode] = useState('grid');

    // Scanner-Panel (Sprache / Zettel)
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerTab, setScannerTab] = useState('barcode');

    // Voice-Eingabe (Web Speech API)
    const [listening, setListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [voiceItems, setVoiceItems] = useState([]);
    const [voiceSupported] = useState(
        () => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
    const recognitionRef = useRef(null);

    // OCR-Eingabe (Tesseract.js)
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrError, setOcrError] = useState('');
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrItems, setOcrItems] = useState([]);
    const zettelInputRef = useRef(null);

    // Einkaufsliste
    const [einkaufName, setEinkaufName] = useState('');
    const [einkaufOpen, setEinkaufOpen] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);

    const openEdit = (p) => setEditProduct({
        id: p.id,
        name: p.name,
        kategorie: p.kategorie || p.ort || 'kuehlschrank',
        ablauf: p.ablauf ? new Date(p.ablauf).toISOString().slice(0, 10) : ''
    });

    const saveEdit = async () => {
        if (!editProduct || !editProduct.name.trim()) return;
        await db.produkte.update(editProduct.id, {
            name: editProduct.name.trim(),
            kategorie: editProduct.kategorie,
            ort: editProduct.kategorie,
            ablauf: editProduct.ablauf
                ? new Date(editProduct.ablauf).toISOString()
                : new Date(Date.now() + 7 * 86400000).toISOString()
        });
        setEditProduct(null);
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value.length === 1 ? value.toUpperCase() : value);
    };

    const addProdukt = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            await db.produkte.add({
                id: Date.now().toString(),
                person_id: activeUserId,
                name: name.trim(),
                kategorie: kat,
                ort: kat,
                ablauf: ablauf
                    ? new Date(ablauf).toISOString()
                    : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
            });
            setName('');
            setAblauf('');
        } catch (err) {
            console.error('Error adding product:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const addBulkItems = async (items) => {
        for (const item of items) {
            await db.produkte.add({
                id: `bulk-${Date.now()}-${Math.random()}`,
                person_id: activeUserId,
                name: item.name,
                kategorie: item.kategorie || 'vorrat',
                ort: item.kategorie || 'vorrat',
                ablauf: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
            });
        }
    };

    const handleDelete = async (product) => {
        const addToList = window.confirm(
            `"${product.name}" löschen?\n\nOK = auch zur Einkaufsliste hinzufügen\nAbbrechen = nur löschen`
        );
        setIsLoading(true);
        try {
            await db.produkte.delete(product.id);
            if (addToList) {
                await db.einkaufsliste.add({
                    id: Date.now().toString(),
                    person_id: activeUserId,
                    name: product.name,
                    checked: false,
                    created_at: Date.now()
                });
            }
        } catch (err) {
            console.error('Error deleting product:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScan = async (barcode) => {
        setShowScanner(false);
        setIsLoading(true);
        setScanMessage('Suche Produkt...');
        try {
            const result = await searchProduct(barcode);
            if (result.found) {
                setScanMessage(`Gefunden: ${result.name}`);
                setName(result.brand ? `${result.brand} ${result.name}` : result.name);
                setKat(result.category);
                setTimeout(() => setScanMessage(''), 3000);
            } else {
                setScanMessage(`Barcode ${barcode} nicht gefunden.`);
                setTimeout(() => setScanMessage(''), 5000);
            }
        } catch (err) {
            setScanMessage('Fehler beim Suchen. Bitte manuell eingeben.');
            setTimeout(() => setScanMessage(''), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Voice (Web Speech API) ────────────────────────────────────────────────
    const startVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        const recognition = new SR();
        recognition.lang = 'de-DE';
        recognition.continuous = false;
        recognition.interimResults = true;
        let lastTranscript = '';

        recognition.onresult = (event) => {
            lastTranscript = Array.from(event.results).map(r => r[0].transcript).join('');
            setVoiceTranscript(lastTranscript);
        };
        recognition.onend = () => {
            setListening(false);
            if (lastTranscript.trim()) {
                const items = lastTranscript
                    .split(/[,;]|\s+und\s+|\s+oder\s+/i)
                    .map(s => s.trim())
                    .filter(s => s.length > 1)
                    .map(n => ({ name: n.charAt(0).toUpperCase() + n.slice(1), kategorie: guessCategory(n) }));
                setVoiceItems(items);
            }
            setVoiceTranscript('');
        };
        recognition.onerror = () => setListening(false);

        recognition.start();
        recognitionRef.current = recognition;
        setListening(true);
        setVoiceTranscript('');
        setVoiceItems([]);
    };

    const stopVoice = () => { recognitionRef.current?.stop(); };

    // ── OCR / Zettel (Tesseract.js, läuft lokal) ─────────────────────────────
    const handleZettelSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setOcrLoading(true);
        setOcrError('');
        setOcrProgress(0);
        setOcrItems([]);
        try {
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('deu', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100));
                }
            });
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const items = text
                .split('\n')
                .map(line => line.replace(/^[\s\-•*·\d.)]+/, '').trim())
                .filter(line => line.length > 2 && !/^\d+$/.test(line))
                .map(n => ({
                    name: n.charAt(0).toUpperCase() + n.slice(1).toLowerCase(),
                    kategorie: guessCategory(n)
                }));

            if (items.length === 0) {
                setOcrError('Kein Text erkannt. Blatt gerade halten und gut beleuchten.');
            } else {
                setOcrItems(items);
            }
        } catch (err) {
            setOcrError('Fehler: ' + (err.message || 'OCR nicht verfügbar'));
        } finally {
            setOcrLoading(false);
        }
    };

    const closeScannerTab = (tabId) => {
        setScannerTab(tabId);
        recognitionRef.current?.abort();
        setListening(false); setVoiceTranscript(''); setVoiceItems([]);
        setOcrItems([]); setOcrError(''); setOcrProgress(0);
    };

    // ── Einkaufsliste ──────────────────────────────
    const addEinkaufItem = async () => {
        const val = einkaufName.trim();
        if (!val) return;
        await db.einkaufsliste.add({
            id: Date.now().toString(),
            person_id: activeUserId,
            name: val,
            checked: false,
            created_at: Date.now()
        });
        setEinkaufName('');
    };

    const toggleEinkaufItem = (item) => db.einkaufsliste.update(item.id, { checked: !item.checked });
    const deleteEinkaufItem = (id) => db.einkaufsliste.delete(id);

    const clearCheckedEinkauf = async () => {
        const checked = (einkaufItems || []).filter(i => i.checked);
        for (const item of checked) await db.einkaufsliste.delete(item.id);
    };

    const uncheckedEinkauf = (einkaufItems || []).filter(i => !i.checked);
    const checkedEinkauf   = (einkaufItems || []).filter(i =>  i.checked);

    const buildListText = () => {
        const header = '🛒 Einkaufsliste\n';
        const items = uncheckedEinkauf.map(i => `• ${i.name}`).join('\n');
        return header + (items || '(leer)');
    };

    const shareViaWhatsApp = () => {
        const text = encodeURIComponent(buildListText());
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(buildListText());
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch { /* fallback */ }
    };

    // ── Kategorien ─────────────────────────────────
    const categorizedProducts = useMemo(() => {
        if (!produkte) return {};
        const query = searchQuery.toLowerCase().trim();
        const filtered = query
            ? produkte.filter(p => p.name.toLowerCase().includes(query))
            : produkte;

        const grouped = {};
        for (const cat of DEFAULT_CATEGORIES) {
            const items = filtered
                .filter(p => p.kategorie === cat.id || p.ort === cat.id)
                .sort((a, b) => {
                    const pA = getProductPriority(a.name);
                    const pB = getProductPriority(b.name);
                    if (pA !== pB) return pA - pB;
                    return new Date(a.ablauf) - new Date(b.ablauf);
                });
            if (items.length > 0 || query) grouped[cat.id] = items;
        }
        return grouped;
    }, [produkte, searchQuery]);

    const urgentProducts = useMemo(() => {
        if (!produkte) return [];
        const now = new Date(); now.setHours(0, 0, 0, 0);
        return produkte
            .filter(p => Math.round((new Date(p.ablauf) - now) / 86400000) <= 3)
            .sort((a, b) => new Date(a.ablauf) - new Date(b.ablauf));
    }, [produkte]);

    const allSortedByExpiry = useMemo(() => {
        if (!produkte) return [];
        const query = searchQuery.toLowerCase().trim();
        const filtered = query ? produkte.filter(p => p.name.toLowerCase().includes(query)) : produkte;
        return filtered.slice().sort((a, b) => new Date(a.ablauf) - new Date(b.ablauf));
    }, [produkte, searchQuery]);

    const totalProducts = produkte ? produkte.length : 0;
    const isSearchActive = searchQuery.trim().length > 0;
    const einkaufTotal = (einkaufItems || []).length;

    return (
        <div className="page produkte-page">
            {/* Header */}
            <div className="produkte-header">
                <h2>Inventar</h2>
                <span className="produkte-count">{totalProducts}</span>
                <div className="view-toggle">
                    <button
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Kacheln"
                    >⊞</button>
                    <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="Liste"
                    >☰</button>
                </div>
            </div>

            {/* Search */}
            <div className="produkte-search">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Produkt suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                {searchQuery && (
                    <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
                )}
            </div>

            {/* ── Scanner-Panel (Sprache / Zettel / Barcode) ──────────────── */}
            <div className="scanner-panel-row">
                <button
                    className="btn-add-toggle"
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{ flex: 1 }}
                >
                    {showAddForm ? '✕ Schliessen' : '+ Produkt hinzufügen'}
                </button>
                <button
                    className={`scanner-extra-btn${scannerOpen ? ' active' : ''}`}
                    onClick={() => setScannerOpen(o => !o)}
                    title="Ohne Tippen hinzufügen"
                >
                    🎤📝
                </button>
            </div>

            {scannerOpen && (
                <div className="scanner-panel card">
                    <div className="scanner-tabs">
                        {SCANNER_TABS.map(tab => (
                            <button
                                key={tab.id}
                                className={`scanner-tab-btn ${scannerTab === tab.id ? 'active' : ''}`}
                                onClick={() => closeScannerTab(tab.id)}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Barcode Tab */}
                    {scannerTab === 'barcode' && (
                        <div className="scanner-content">
                            <p className="scanner-hint">Starte die Kamera und halte den Barcode drauf.</p>
                            {showScanner ? (
                                <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
                            ) : (
                                <button className="btn primary scan-start-btn" onClick={() => setShowScanner(true)}>
                                    📷 Kamera starten
                                </button>
                            )}
                        </div>
                    )}

                    {/* Sprache Tab – Web Speech API */}
                    {scannerTab === 'sprache' && (
                        <div className="scanner-content">
                            <div className="scanner-nokey-badge">✅ Kein API-Key nötig</div>
                            <p className="scanner-hint">
                                Sprich Produktnamen aus — getrennt durch Komma oder "und". Funktioniert ohne Internet.
                            </p>
                            {!voiceSupported ? (
                                <div className="scanner-ki-warning">
                                    ⚠️ Spracherkennung nicht unterstützt. Bitte Chrome, Edge oder Safari verwenden.
                                </div>
                            ) : voiceItems.length > 0 ? (
                                <ItemsReview
                                    items={voiceItems}
                                    onConfirm={async (items) => { await addBulkItems(items); setVoiceItems([]); setScannerOpen(false); }}
                                    onCancel={() => setVoiceItems([])}
                                />
                            ) : (
                                <>
                                    {voiceTranscript && (
                                        <div className="voice-transcript">🎙️ <em>{voiceTranscript}</em></div>
                                    )}
                                    <button
                                        className={`btn ${listening ? 'danger' : 'primary'} scan-start-btn`}
                                        onClick={listening ? stopVoice : startVoice}
                                    >
                                        {listening ? '⏹ Aufnahme stoppen' : '🎤 Aufnahme starten'}
                                    </button>
                                    {listening && <p className="scan-loading">🔴 Höre zu... Sprich jetzt!</p>}
                                    <p className="scanner-hint" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        Beispiel: "Milch, Joghurt und Butter"
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Zettel Tab – Tesseract.js OCR */}
                    {scannerTab === 'zettel' && (
                        <div className="scanner-content">
                            <input
                                ref={zettelInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleZettelSelected}
                                style={{ display: 'none' }}
                            />
                            <div className="scanner-nokey-badge">✅ Kein API-Key · Läuft lokal auf deinem Gerät</div>
                            <p className="scanner-hint">
                                Halte eine Einkaufsliste oder ein Blatt Papier in die Kamera — der Text wird lokal erkannt.
                            </p>
                            {ocrItems.length > 0 ? (
                                <ItemsReview
                                    items={ocrItems}
                                    onConfirm={async (items) => { await addBulkItems(items); setOcrItems([]); setScannerOpen(false); }}
                                    onCancel={() => setOcrItems([])}
                                />
                            ) : ocrLoading ? (
                                <div className="ocr-loading-box">
                                    <div className="ocr-loading-icon">📝</div>
                                    <p>Text wird erkannt... {ocrProgress}%</p>
                                    <div className="ocr-progress-bar">
                                        <div className="ocr-progress-fill" style={{ width: `${ocrProgress}%` }} />
                                    </div>
                                    <p className="scanner-hint" style={{ fontSize: '0.78rem' }}>
                                        Beim ersten Mal wird das Sprachpaket heruntergeladen (~10 MB).
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {ocrError && <div className="scanner-ki-warning">{ocrError}</div>}
                                    <button
                                        className="btn primary scan-start-btn"
                                        onClick={() => zettelInputRef.current?.click()}
                                    >
                                        📷 Zettel fotografieren
                                    </button>
                                    <p className="scanner-hint" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        Tipp: Jede Zeile = ein Produkt. Gedruckte Schrift wird besser erkannt. Gut beleuchten!
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Add Product Form */}
            {showAddForm && (
                <div className="card add-form">
                    {scanMessage && <div className="scan-message">{scanMessage}</div>}
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Produktname..."
                            value={name}
                            onChange={handleNameChange}
                            className="form-input"
                            onKeyDown={e => e.key === 'Enter' && addProdukt()}
                        />
                    </div>
                    <div className="form-group">
                        <select value={kat} onChange={(e) => setKat(e.target.value)} className="form-select">
                            {DEFAULT_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="ablauf-input" className="form-label">
                            Ablaufdatum (optional, Standard: +7 Tage)
                        </label>
                        <input
                            id="ablauf-input"
                            type="date"
                            value={ablauf}
                            onChange={(e) => setAblauf(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <div className="button-group">
                        <button
                            onClick={() => setShowScanner(true)}
                            className="btn secondary"
                            disabled={isLoading}
                        >
                            📷 Barcode
                        </button>
                        <button
                            onClick={addProdukt}
                            className="btn primary"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? strings.common.loading : strings.products.add}
                        </button>
                    </div>
                </div>
            )}

            {/* Barcode Scanner (from Add Form button) */}
            {showScanner && (
                <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}

            {/* ⚠️ Bald ablaufend */}
            {urgentProducts.length > 0 && !isSearchActive && (
                <div className="urgent-section">
                    <div className="urgent-header">
                        <span>⚠️ Bald ablaufend</span>
                        <span className="urgent-count">{urgentProducts.length}</span>
                    </div>
                    {urgentProducts.map(p => {
                        const cat = DEFAULT_CATEGORIES.find(c => c.id === (p.kategorie || p.ort));
                        const expiry = getExpiryText(p.ablauf);
                        return (
                            <div key={p.id} className="urgent-item" onClick={() => openEdit(p)}>
                                <span className="urgent-item-icon">{cat?.icon ?? '📦'}</span>
                                <span className="urgent-item-name">{p.name}</span>
                                <span className={`urgent-item-expiry ${expiry.className}`}>{expiry.text}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Produkte – Liste oder Kacheln */}
            {viewMode === 'list' ? (
                <div className="produkt-list">
                    {totalProducts === 0 && !showAddForm && (
                        <div className="empty-state">
                            <p>{strings.products.noProducts}</p>
                            <button className="btn primary" onClick={() => setShowAddForm(true)}>+ Erstes Produkt hinzufügen</button>
                        </div>
                    )}
                    {isSearchActive && allSortedByExpiry.length === 0 && totalProducts > 0 && (
                        <div className="empty-state"><p>Keine Produkte für „{searchQuery}"</p></div>
                    )}
                    {allSortedByExpiry.map(p => {
                        const cat = DEFAULT_CATEGORIES.find(c => c.id === (p.kategorie || p.ort));
                        const expiry = getExpiryText(p.ablauf);
                        return (
                            <div key={p.id} className="produkt-list-item" onClick={() => openEdit(p)}>
                                <span className="produkt-list-icon">{cat?.icon ?? '📦'}</span>
                                <div className="produkt-list-info">
                                    <span className="produkt-list-name">{p.name}</span>
                                    <span className="produkt-list-cat">{cat?.name}</span>
                                </div>
                                <span className={`produkt-list-expiry ${expiry.className}`}>{expiry.text}</span>
                                <button
                                    className="produkt-card-delete"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                                    title="Löschen"
                                >×</button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <>
                    <div className="kategorie-sections">
                        {DEFAULT_CATEGORIES.map(cat => {
                            const items = categorizedProducts[cat.id];
                            if (!items || (items.length === 0 && !isSearchActive)) return null;
                            const rgb = hexToRgb(cat.color);
                            return (
                                <div
                                    key={cat.id}
                                    className="kategorie-section"
                                    style={{ borderLeftColor: cat.color, background: `rgba(${rgb}, 0.04)` }}
                                >
                                    <div className="kategorie-header">
                                        <span className="kategorie-icon" style={{ color: cat.color }}>{cat.icon}</span>
                                        <span className="kategorie-name" style={{ color: cat.color }}>{cat.name}</span>
                                        <span className="kategorie-badge" style={{ background: cat.color }}>{items.length}</span>
                                    </div>
                                    {items.length === 0 ? (
                                        <p className="kategorie-empty">Keine Produkte</p>
                                    ) : (
                                        <div className="kategorie-scroll">
                                            {items.map(p => {
                                                const expiry = getExpiryText(p.ablauf);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className="produkt-card"
                                                        style={{ borderTopColor: cat.color }}
                                                        onClick={() => openEdit(p)}
                                                    >
                                                        <button
                                                            className="produkt-card-delete"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                                                            disabled={isLoading}
                                                            title="Löschen"
                                                        >×</button>
                                                        <div className="produkt-card-icon">
                                                            <ProductIcon productName={p.name} size="medium" />
                                                        </div>
                                                        <div className="produkt-card-info">
                                                            <span className="produkt-card-name">{p.name}</span>
                                                            <span className={`produkt-card-expiry ${expiry.className}`}>{expiry.text}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {totalProducts === 0 && !showAddForm && (
                        <div className="empty-state">
                            <p>{strings.products.noProducts}</p>
                            <button className="btn primary" onClick={() => setShowAddForm(true)}>
                                + Erstes Produkt hinzufügen
                            </button>
                        </div>
                    )}
                    {isSearchActive && Object.values(categorizedProducts).every(arr => arr.length === 0) && totalProducts > 0 && (
                        <div className="empty-state">
                            <p>Keine Produkte gefunden für „{searchQuery}"</p>
                        </div>
                    )}
                </>
            )}

            {/* ── Einkaufsliste (integriert) ────────────── */}
            <div className="inventar-einkauf-section">
                <button
                    className="inventar-einkauf-header"
                    onClick={() => setEinkaufOpen(o => !o)}
                    type="button"
                >
                    <span className="inventar-einkauf-title">
                        🛒 Einkaufsliste
                        {einkaufTotal > 0 && (
                            <span className="einkauf-count-badge">{uncheckedEinkauf.length}</span>
                        )}
                    </span>
                    <span className={`einkauf-chevron ${einkaufOpen ? 'open' : ''}`}>▼</span>
                </button>

                {einkaufOpen && (
                    <div className="inventar-einkauf-body">
                        <div className="einkauf-input-row">
                            <input
                                type="text"
                                placeholder="Was fehlt?..."
                                value={einkaufName}
                                onChange={e => setEinkaufName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addEinkaufItem()}
                                className="einkauf-input"
                            />
                            <button onClick={addEinkaufItem} className="einkauf-add-btn">+</button>
                        </div>

                        {uncheckedEinkauf.length === 0 && checkedEinkauf.length === 0 && (
                            <p className="einkauf-empty">Liste ist leer – füge etwas hinzu!</p>
                        )}

                        <div className="einkauf-list">
                            {uncheckedEinkauf.map(item => (
                                <div key={item.id} className="einkauf-item">
                                    <button className="einkauf-check" onClick={() => toggleEinkaufItem(item)}>
                                        <span className="check-circle"></span>
                                    </button>
                                    <span className="einkauf-name">{item.name}</span>
                                    <button className="einkauf-delete" onClick={() => deleteEinkaufItem(item.id)}>×</button>
                                </div>
                            ))}
                        </div>

                        {checkedEinkauf.length > 0 && (
                            <div className="einkauf-checked-section">
                                <div className="checked-header">
                                    <span className="checked-title">Erledigt ({checkedEinkauf.length})</span>
                                    <button className="btn small secondary" onClick={clearCheckedEinkauf}>Entfernen</button>
                                </div>
                                <div className="einkauf-list">
                                    {checkedEinkauf.map(item => (
                                        <div key={item.id} className="einkauf-item checked">
                                            <button className="einkauf-check" onClick={() => toggleEinkaufItem(item)}>
                                                <span className="check-circle checked"></span>
                                            </button>
                                            <span className="einkauf-name">{item.name}</span>
                                            <button className="einkauf-delete" onClick={() => deleteEinkaufItem(item.id)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {uncheckedEinkauf.length > 0 && (
                            <div className="einkauf-share-row">
                                <button className="einkauf-share-btn copy-btn" onClick={copyToClipboard}>
                                    {copySuccess ? '✓ Kopiert!' : '📋 Kopieren'}
                                </button>
                                <button className="einkauf-share-btn whatsapp-btn" onClick={shareViaWhatsApp}>
                                    📲 WhatsApp
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Produkt bearbeiten Modal */}
            {editProduct && (
                <div className="inv-modal-overlay" onClick={() => setEditProduct(null)}>
                    <div className="inv-modal" onClick={e => e.stopPropagation()}>
                        <h3>✏️ Produkt bearbeiten</h3>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label>Name</label>
                            <input
                                type="text"
                                value={editProduct.name}
                                onChange={e => setEditProduct(s => ({ ...s, name: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>Kategorie</label>
                            <select
                                value={editProduct.kategorie}
                                onChange={e => setEditProduct(s => ({ ...s, kategorie: e.target.value }))}
                            >
                                {DEFAULT_CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ablaufdatum</label>
                            <input
                                type="date"
                                value={editProduct.ablauf}
                                onChange={e => setEditProduct(s => ({ ...s, ablauf: e.target.value }))}
                            />
                        </div>
                        <div className="inv-modal-actions">
                            <button className="btn secondary" onClick={() => setEditProduct(null)}>Abbrechen</button>
                            <button className="btn primary" onClick={saveEdit}>✓ Speichern</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProdukteListe;
