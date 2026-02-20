import React, { useState, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { DEFAULT_CATEGORIES } from '../constants';
import { useUser } from '../context/UserContext';
import { strings } from '../strings/de';
import BarcodeScanner from '../components/BarcodeScanner';
import { searchProduct } from '../api/openfoodfacts';
import ProductIcon from '../components/ProductIcon';
import { analyzePhoto, analyzeReceipt, isKIConfigured, compressImage } from '../utils/aiService';
import './ProdukteListe.css';

const MAX_ITEMS_PER_CAT = 20;

const SCANNER_TABS = [
    { id: 'barcode', label: 'Barcode', icon: '📊' },
    { id: 'foto', label: 'Foto-KI', icon: '📸' },
    { id: 'kassenbon', label: 'Kassenbon', icon: '🧾' },
    { id: 'sprache', label: 'Sprache', icon: '🎤', noKey: true },
    { id: 'zettel', label: 'Zettel', icon: '📝', noKey: true },
];

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

const getExpiryText = (ablaufDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(ablaufDate);
    expiry.setHours(0, 0, 0, 0);
    const diffMs = expiry - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'abgelaufen', className: 'expiry-expired' };
    if (diffDays === 0) return { text: 'heute', className: 'expiry-today' };
    if (diffDays === 1) return { text: 'morgen', className: 'expiry-soon' };
    if (diffDays < 7) return { text: `noch ${diffDays} Tage`, className: 'expiry-ok' };
    const weeks = Math.floor(diffDays / 7);
    if (weeks < 4) return { text: `noch ${weeks} Wochen`, className: 'expiry-good' };
    return { text: `noch ${diffDays} Tage`, className: 'expiry-good' };
};

// AI items review component
const AiItemsReview = ({ items, onConfirm, onCancel }) => {
    const [selected, setSelected] = useState(items.map((_, i) => i));
    const [itemData, setItemData] = useState(items);

    const toggleItem = (idx) => {
        setSelected(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const handleKatChange = (idx, kat) => {
        setItemData(prev => prev.map((item, i) => i === idx ? { ...item, kategorie: kat } : item));
    };

    return (
        <div className="ai-review">
            <h4 className="ai-review-title">Erkannte Produkte ({items.length})</h4>
            <div className="ai-review-list">
                {itemData.map((item, idx) => (
                    <label key={idx} className={`ai-review-item ${selected.includes(idx) ? 'selected' : 'deselected'}`}>
                        <input
                            type="checkbox"
                            checked={selected.includes(idx)}
                            onChange={() => toggleItem(idx)}
                        />
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
};

const ProdukteListe = () => {
    const { activeUserId } = useUser();
    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    // --- Form state ---
    const [name, setName] = useState('');
    const [kat, setKat] = useState('kuehlschrank');
    const [ablauf, setAblauf] = useState('');
    const [produktFoto, setProduktFoto] = useState(null);
    const [showAddForm, setShowAddForm] = useState(() => {
        const autoAdd = sessionStorage.getItem('auto-add-product');
        if (autoAdd) { sessionStorage.removeItem('auto-add-product'); return true; }
        return false;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // --- Scanner state ---
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerTab, setScannerTab] = useState('barcode');
    const [showBarcodeCamera, setShowBarcodeCamera] = useState(false);
    const [aiItems, setAiItems] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const [kassenInfo, setKassenInfo] = useState('');

    // --- Voice state (Web Speech API) ---
    const [listening, setListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [voiceItems, setVoiceItems] = useState([]);
    const [voiceSupported] = useState(
        () => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
    const recognitionRef = useRef(null);

    // --- OCR state (Tesseract.js) ---
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrError, setOcrError] = useState('');
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrItems, setOcrItems] = useState([]);
    const zettelInputRef = useRef(null);

    // --- Category accordion state ---
    const [expandedCategories, setExpandedCategories] = useState({});
    const [showAllItems, setShowAllItems] = useState({});

    const fotoInputRef = useRef(null);

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value.length === 1 ? value.toUpperCase() : value);
    };

    const addProdukt = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const expiryDate = ablauf
                ? new Date(ablauf).toISOString()
                : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
            await db.produkte.add({
                id: Date.now().toString(),
                person_id: activeUserId,
                name: name.trim(),
                kategorie: kat,
                ort: kat,
                ablauf: expiryDate,
                foto: produktFoto || null
            });
            setName('');
            setAblauf('');
            setProduktFoto(null);
            setShowAddForm(false);
        } catch (err) {
            console.error('Error adding product:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (product) => {
        const addToList = window.confirm(
            `"${product.name}" löschen?\n\nOK = auch zur Einkaufsliste hinzufügen`
        );
        try {
            await db.produkte.delete(product.id);
            if (addToList) {
                await db.einkaufsliste.add({
                    id: Date.now().toString(),
                    person_id: activeUserId,
                    name: product.name,
                    checked: false
                });
            }
        } catch (err) {
            console.error('Error deleting product:', err);
        }
    };

    const handleScan = async (barcode) => {
        setShowBarcodeCamera(false);
        setIsLoading(true);
        setScanMessage('Suche Produkt...');
        try {
            const result = await searchProduct(barcode);
            if (result.found) {
                setScanMessage(`✓ Gefunden: ${result.name}`);
                setName(result.brand ? `${result.brand} ${result.name}` : result.name);
                setKat(result.category);
                setShowAddForm(true);
                setScannerOpen(false);
            } else {
                setScanMessage(`Barcode ${barcode} nicht gefunden. Bitte manuell eingeben.`);
                setShowAddForm(true);
                setScannerOpen(false);
            }
        } catch (err) {
            setScanMessage('Fehler beim Suchen. Bitte manuell eingeben.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setScanMessage(''), 5000);
        }
    };

    const handleFotoKI = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        if (!isKIConfigured()) {
            setAiError('⚠️ Kein KI-API-Key konfiguriert. Bitte in den Einstellungen eingeben.');
            return;
        }
        setAiLoading(true);
        setAiError('');
        setAiItems([]);
        try {
            const base64 = await compressImage(file);
            const items = await analyzePhoto(base64);
            if (!items || items.length === 0) {
                setAiError('Keine Produkte erkannt. Bitte ein klareres Foto versuchen.');
            } else {
                setAiItems(items);
            }
        } catch (err) {
            setAiError('Fehler: ' + err.message);
        } finally {
            setAiLoading(false);
        }
    };

    const handleKassenbon = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        if (!isKIConfigured()) {
            setAiError('⚠️ Kein KI-API-Key konfiguriert. Bitte in den Einstellungen eingeben.');
            return;
        }
        setAiLoading(true);
        setAiError('');
        setAiItems([]);
        setKassenInfo('');
        try {
            const base64 = await compressImage(file);
            const result = await analyzeReceipt(base64);
            if (result.laden || result.datum) {
                setKassenInfo(`${result.laden || ''}${result.datum ? ' · ' + result.datum : ''}`);
            }
            if (!result.items || result.items.length === 0) {
                setAiError('Keine Produkte erkannt. Bitte ein klareres Foto versuchen.');
            } else {
                setAiItems(result.items);
            }
        } catch (err) {
            setAiError('Fehler: ' + err.message);
        } finally {
            setAiLoading(false);
        }
    };

    const addAiItems = async (selectedItems) => {
        setIsLoading(true);
        try {
            for (const item of selectedItems) {
                await db.produkte.add({
                    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    person_id: activeUserId,
                    name: item.name,
                    kategorie: item.kategorie || 'vorrat',
                    ort: item.kategorie || 'vorrat',
                    ablauf: item.ablaufTage
                        ? new Date(Date.now() + item.ablaufTage * 24 * 3600 * 1000).toISOString()
                        : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
                    foto: null
                });
            }
            setAiItems([]);
            setKassenInfo('');
        } catch (err) {
            console.error('Error adding AI items:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProduktFoto = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setProduktFoto(ev.target.result);
        reader.readAsDataURL(file);
    };

    const toggleCategory = (catId) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const toggleShowAll = (catId) => {
        setShowAllItems(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const closeScannerTab = (tabId) => {
        setScannerTab(tabId);
        setAiItems([]);
        setAiError('');
        setKassenInfo('');
        setShowBarcodeCamera(false);
        // reset voice
        recognitionRef.current?.abort();
        setListening(false);
        setVoiceTranscript('');
        setVoiceItems([]);
        // reset OCR
        setOcrItems([]);
        setOcrError('');
        setOcrProgress(0);
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
                    .map(name => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        kategorie: guessCategory(name)
                    }));
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
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.round(m.progress * 100));
                    }
                }
            });
            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const items = text
                .split('\n')
                .map(line => line.replace(/^[\s\-•*·\d.)]+/, '').trim())
                .filter(line => line.length > 2 && !/^\d+$/.test(line))
                .map(name => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
                    kategorie: guessCategory(name)
                }));

            if (items.length === 0) {
                setOcrError('Kein Text erkannt. Bitte Blatt gerade halten und gut beleuchten.');
            } else {
                setOcrItems(items);
            }
        } catch (err) {
            setOcrError('Fehler: ' + (err.message || 'OCR nicht verfügbar'));
        } finally {
            setOcrLoading(false);
        }
    };

    // Products expiring within 3 days
    const expiringProducts = useMemo(() => {
        if (!produkte) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() + 3);
        return produkte
            .filter(p => p.ablauf && new Date(p.ablauf) <= threeDays)
            .sort((a, b) => new Date(a.ablauf) - new Date(b.ablauf));
    }, [produkte]);

    // Group products by category, filtered by search
    const categorizedProducts = useMemo(() => {
        if (!produkte) return {};
        const query = searchQuery.toLowerCase().trim();
        const filtered = query
            ? produkte.filter(p => p.name.toLowerCase().includes(query))
            : produkte;

        const grouped = {};
        for (const cat of DEFAULT_CATEGORIES) {
            grouped[cat.id] = filtered
                .filter(p => p.kategorie === cat.id || p.ort === cat.id)
                .sort((a, b) => new Date(a.ablauf) - new Date(b.ablauf));
        }
        return grouped;
    }, [produkte, searchQuery]);

    // Auto-expand categories with search results
    useMemo(() => {
        if (searchQuery.trim()) {
            const expanded = {};
            for (const [catId, items] of Object.entries(categorizedProducts)) {
                if (items.length > 0) expanded[catId] = true;
            }
            setExpandedCategories(expanded);
        }
    }, [searchQuery]);

    const totalProducts = produkte ? produkte.length : 0;
    const isSearchActive = searchQuery.trim().length > 0;

    return (
        <div className="page produkte-page">
            <div className="produkte-header">
                <h2>Inventar</h2>
                <div className="produkte-header-right">
                    <span className="produkte-count">{totalProducts}</span>
                    <button
                        className={`scanner-toggle-btn ${scannerOpen ? 'active' : ''}`}
                        onClick={() => setScannerOpen(!scannerOpen)}
                    >
                        {scannerOpen ? '✕ Schliessen' : '📷 Scannen'}
                    </button>
                </div>
            </div>

            {/* ── Scanner Panel ─────────────────────────────────────────────── */}
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
                            {showBarcodeCamera ? (
                                <BarcodeScanner
                                    onScan={handleScan}
                                    onClose={() => setShowBarcodeCamera(false)}
                                />
                            ) : (
                                <button
                                    className="btn primary scan-start-btn"
                                    onClick={() => setShowBarcodeCamera(true)}
                                >
                                    📷 Kamera starten
                                </button>
                            )}
                        </div>
                    )}

                    {/* Foto-KI Tab */}
                    {scannerTab === 'foto' && (
                        <div className="scanner-content">
                            <p className="scanner-hint">
                                Fotografiere deinen Kühlschrank oder Vorrat — die KI erkennt alle Produkte automatisch.
                            </p>
                            {!isKIConfigured() && (
                                <div className="scanner-ki-warning">
                                    ⚠️ Kein KI-API-Key konfiguriert. Bitte in den <strong>Einstellungen</strong> eingeben.
                                </div>
                            )}
                            <label className="btn secondary scan-file-label">
                                📸 Foto wählen (Kamera oder Galerie)
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFotoKI}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {aiLoading && <p className="scan-loading">⏳ KI analysiert Bild...</p>}
                            {aiError && <p className="scan-error">{aiError}</p>}
                            {aiItems.length > 0 && (
                                <AiItemsReview
                                    items={aiItems}
                                    onConfirm={addAiItems}
                                    onCancel={() => setAiItems([])}
                                />
                            )}
                        </div>
                    )}

                    {/* Kassenbon Tab */}
                    {scannerTab === 'kassenbon' && (
                        <div className="scanner-content">
                            <p className="scanner-hint">
                                Fotografiere deinen Kassenbon — die KI liest alle Lebensmittel aus.
                            </p>
                            {kassenInfo && (
                                <p className="kassen-info">🏪 {kassenInfo}</p>
                            )}
                            {!isKIConfigured() && (
                                <div className="scanner-ki-warning">
                                    ⚠️ Kein KI-API-Key konfiguriert. Bitte in den <strong>Einstellungen</strong> eingeben.
                                </div>
                            )}
                            <label className="btn secondary scan-file-label">
                                🧾 Kassenbon wählen (Kamera oder Galerie)
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleKassenbon}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {aiLoading && <p className="scan-loading">⏳ KI analysiert Kassenbon...</p>}
                            {aiError && <p className="scan-error">{aiError}</p>}
                            {aiItems.length > 0 && (
                                <AiItemsReview
                                    items={aiItems}
                                    onConfirm={addAiItems}
                                    onCancel={() => setAiItems([])}
                                />
                            )}
                        </div>
                    )}

                    {/* Sprache Tab – Web Speech API, kein API-Key */}
                    {scannerTab === 'sprache' && (
                        <div className="scanner-content">
                            <div className="scanner-nokey-badge">✅ Kein API-Key nötig</div>
                            <p className="scanner-hint">
                                Sprich die Produktnamen aus — getrennt durch Komma oder "und".
                                Funktioniert komplett ohne Internet-Dienste.
                            </p>
                            {!voiceSupported ? (
                                <div className="scanner-ki-warning">
                                    ⚠️ Spracherkennung wird von deinem Browser nicht unterstützt.
                                    Bitte Chrome, Edge oder Safari verwenden.
                                </div>
                            ) : voiceItems.length > 0 ? (
                                <AiItemsReview
                                    items={voiceItems}
                                    onConfirm={(items) => { addAiItems(items); setVoiceItems([]); }}
                                    onCancel={() => setVoiceItems([])}
                                />
                            ) : (
                                <>
                                    {voiceTranscript && (
                                        <div className="voice-transcript">
                                            🎙️ <em>{voiceTranscript}</em>
                                        </div>
                                    )}
                                    <button
                                        className={`btn ${listening ? 'danger' : 'primary'} scan-start-btn`}
                                        onClick={listening ? stopVoice : startVoice}
                                    >
                                        {listening ? '⏹ Aufnahme stoppen' : '🎤 Aufnahme starten'}
                                    </button>
                                    {listening && (
                                        <p className="scan-loading">🔴 Höre zu... Sprich jetzt!</p>
                                    )}
                                    <p className="scanner-hint" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        Beispiel: "Milch, Joghurt und Butter"
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Zettel Tab – Tesseract.js OCR, kein API-Key */}
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
                            <div className="scanner-nokey-badge">✅ Kein API-Key nötig · Läuft lokal</div>
                            <p className="scanner-hint">
                                Halte eine Einkaufsliste oder ein beschriftetes Blatt in die Kamera —
                                der Text wird direkt auf deinem Gerät erkannt.
                            </p>
                            {ocrItems.length > 0 ? (
                                <AiItemsReview
                                    items={ocrItems}
                                    onConfirm={(items) => { addAiItems(items); setOcrItems([]); }}
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
                                        Beim ersten Mal wird die Sprachpaketdatei heruntergeladen (~10 MB).
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
                                        Tipp: Jede Zeile = ein Produkt. Gedruckte Schrift wird besser erkannt als Handschrift. Gut beleuchten!
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Add Product Toggle ────────────────────────────────────── */}
            <button
                className="btn-add-toggle"
                onClick={() => setShowAddForm(!showAddForm)}
            >
                {showAddForm ? '✕ Schliessen' : '+ Produkt hinzufügen'}
            </button>

            {/* ── Search ──────────────────────────────────────────────────── */}
            <div className="produkte-search">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Inventar durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input search-input-with-icon"
                />
                {searchQuery && (
                    <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
            </div>

            {/* ── Add Product Form ──────────────────────────────────────── */}
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
                        <label className="form-label">Ablaufdatum (optional, Standard: +7 Tage)</label>
                        <input
                            type="date"
                            value={ablauf}
                            onChange={(e) => setAblauf(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Produktfoto (optional)</label>
                        <div className="foto-upload-row">
                            {produktFoto && (
                                <img src={produktFoto} alt="Vorschau" className="foto-preview" />
                            )}
                            <label className="btn secondary small foto-upload-btn">
                                {produktFoto ? '🔄 Ändern' : '📷 Foto hinzufügen'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProduktFoto}
                                    style={{ display: 'none' }}
                                    ref={fotoInputRef}
                                />
                            </label>
                            {produktFoto && (
                                <button
                                    className="btn small secondary"
                                    onClick={() => setProduktFoto(null)}
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="button-group">
                        <button
                            onClick={addProdukt}
                            className="btn primary"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? '...' : '+ Hinzufügen'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Expiring Soon Section ──────────────────────────────────── */}
            {expiringProducts.length > 0 && !isSearchActive && (
                <div className="expiring-section">
                    <h3 className="expiring-section-title">⚠️ Läuft bald ab</h3>
                    <div className="kategorie-scroll">
                        {expiringProducts.map(p => {
                            const expiry = getExpiryText(p.ablauf);
                            return (
                                <div
                                    key={p.id}
                                    className="produkt-card expiring-card"
                                    style={{ borderLeftColor: '#E87E3B' }}
                                >
                                    <div className="produkt-card-icon">
                                        {p.foto
                                            ? <img src={p.foto} alt={p.name} className="produkt-foto" />
                                            : <ProductIcon productName={p.name} size="small" />
                                        }
                                    </div>
                                    <div className="produkt-card-info">
                                        <span className="produkt-card-name">{p.name}</span>
                                        <span className={`produkt-card-expiry ${expiry.className}`}>
                                            {expiry.text}
                                        </span>
                                    </div>
                                    <button
                                        className="produkt-card-delete"
                                        onClick={() => handleDelete(p)}
                                        title="Löschen"
                                    >✕</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Category Accordion Sections ────────────────────────────── */}
            <div className="kategorie-sections">
                {DEFAULT_CATEGORIES.map(cat => {
                    const items = categorizedProducts[cat.id] || [];
                    if (items.length === 0 && !isSearchActive) return null;
                    const isExpanded = expandedCategories[cat.id] || false;
                    const showAll = showAllItems[cat.id] || false;
                    const displayItems = showAll ? items : items.slice(0, MAX_ITEMS_PER_CAT);
                    const hasMore = items.length > MAX_ITEMS_PER_CAT && !showAll;

                    return (
                        <div key={cat.id} className="kategorie-section">
                            <button
                                className="kategorie-header kategorie-accordion"
                                onClick={() => toggleCategory(cat.id)}
                            >
                                <span className="kategorie-icon">{cat.icon}</span>
                                <span className="kategorie-name">{cat.name}</span>
                                <span
                                    className="kategorie-badge"
                                    style={{ backgroundColor: cat.color }}
                                >
                                    {items.length}
                                </span>
                                <span className="kategorie-arrow">{isExpanded ? '▲' : '▼'}</span>
                            </button>

                            {isExpanded && (
                                items.length === 0 ? (
                                    <p className="kategorie-empty">Keine Produkte</p>
                                ) : (
                                    <div className="kategorie-scroll">
                                        {displayItems.map(p => {
                                            const expiry = getExpiryText(p.ablauf);
                                            return (
                                                <div
                                                    key={p.id}
                                                    className="produkt-card"
                                                    style={{ borderLeftColor: cat.color }}
                                                >
                                                    <div className="produkt-card-icon">
                                                        {p.foto
                                                            ? <img src={p.foto} alt={p.name} className="produkt-foto" />
                                                            : <ProductIcon productName={p.name} size="small" />
                                                        }
                                                    </div>
                                                    <div className="produkt-card-info">
                                                        <span className="produkt-card-name">{p.name}</span>
                                                        <span className={`produkt-card-expiry ${expiry.className}`}>
                                                            {expiry.text}
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="produkt-card-delete"
                                                        onClick={() => handleDelete(p)}
                                                        title="Löschen"
                                                    >✕</button>
                                                </div>
                                            );
                                        })}
                                        {hasMore && (
                                            <div
                                                className="produkt-card produkt-card-more"
                                                onClick={() => toggleShowAll(cat.id)}
                                            >
                                                <span className="more-count">+{items.length - MAX_ITEMS_PER_CAT}</span>
                                                <span className="more-label">mehr</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Empty State ────────────────────────────────────────────── */}
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
                    <p>Keine Produkte gefunden für "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
};

export default ProdukteListe;
