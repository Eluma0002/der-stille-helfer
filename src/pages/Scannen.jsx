import React, { useState, useRef } from 'react';
import { db } from '../db/schema';
import { useUser } from '../context/UserContext';
import { DEFAULT_CATEGORIES } from '../constants';
import BarcodeScanner from '../components/BarcodeScanner';
import { searchProduct } from '../api/openfoodfacts';
import { analyzePhoto, analyzeReceipt, compressImage, isKIConfigured } from '../utils/aiService';
import './Scannen.css';

// ─── BulkAdd Review ──────────────────────────────────────────────────────────
function BulkReview({ items, onConfirm, onCancel }) {
    const [selected, setSelected] = useState(
        items.map((item, i) => ({ ...item, checked: true, key: i }))
    );

    const toggle = (i) => {
        setSelected(prev => prev.map((it, idx) => idx === i ? { ...it, checked: !it.checked } : it));
    };

    const changeKat = (i, kat) => {
        setSelected(prev => prev.map((it, idx) => idx === i ? { ...it, kategorie: kat } : it));
    };

    const confirmed = selected.filter(it => it.checked);

    return (
        <div className="bulk-review">
            <h3>Artikel überprüfen</h3>
            <p className="bulk-subtitle">{items.length} Artikel erkannt — wähle aus was du hinzufügen möchtest:</p>

            <div className="bulk-list">
                {selected.map((item, i) => (
                    <div key={i} className={`bulk-item ${!item.checked ? 'bulk-item-unchecked' : ''}`}>
                        <label className="bulk-item-label">
                            <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggle(i)}
                                className="bulk-checkbox"
                            />
                            <span className="bulk-name">{item.name}</span>
                            {item.menge && <span className="bulk-menge">{item.menge}</span>}
                        </label>
                        {item.checked && (
                            <select
                                value={item.kategorie || 'kuehlschrank'}
                                onChange={(e) => changeKat(i, e.target.value)}
                                className="bulk-kat-select"
                            >
                                {DEFAULT_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                ))}
            </div>

            <div className="bulk-actions">
                <button className="btn secondary" onClick={onCancel}>Abbrechen</button>
                <button
                    className="btn primary"
                    onClick={() => onConfirm(confirmed)}
                    disabled={confirmed.length === 0}
                >
                    ✅ {confirmed.length} Artikel hinzufügen
                </button>
            </div>
        </div>
    );
}

// ─── Barcode-Ergebnis ────────────────────────────────────────────────────────
function BarcodeResult({ barcode, onAdd, onScanAgain, onManual }) {
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [name, setName] = useState('');
    const [kat, setKat] = useState('kuehlschrank');
    const [ablauf, setAblauf] = useState('');

    React.useEffect(() => {
        let active = true;
        setLoading(true);
        searchProduct(barcode).then(p => {
            if (!active) return;
            if (p && p.name) {
                setProduct(p);
                setName(p.name);
            } else {
                setNotFound(true);
            }
            setLoading(false);
        }).catch(() => {
            if (active) { setNotFound(true); setLoading(false); }
        });
        return () => { active = false; };
    }, [barcode]);

    if (loading) return (
        <div className="scan-result-loading">
            <div className="scan-spinner">⏳</div>
            <p>Produkt wird gesucht...</p>
        </div>
    );

    return (
        <div className="scan-result-card card">
            {product ? (
                <>
                    <div className="scan-result-found">
                        <span className="scan-result-icon">✅</span>
                        <div>
                            <strong>{product.name}</strong>
                            {product.brand && <span className="scan-brand"> — {product.brand}</span>}
                        </div>
                    </div>
                    <div className="form-group" style={{ marginTop: 12 }}>
                        <label>Kategorie</label>
                        <select value={kat} onChange={e => setKat(e.target.value)}>
                            {DEFAULT_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Ablaufdatum (optional)</label>
                        <input type="date" value={ablauf} onChange={e => setAblauf(e.target.value)} />
                    </div>
                    <div className="button-group">
                        <button className="btn secondary" onClick={onScanAgain}>Nochmal scannen</button>
                        <button className="btn primary" onClick={() => onAdd({ name: product.name, kategorie: kat, ort: kat, ablauf })}>
                            ➕ Hinzufügen
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="scan-result-notfound">
                        <span>🔍</span>
                        <p>Barcode <code>{barcode}</code> nicht gefunden.</p>
                    </div>
                    <div className="button-group">
                        <button className="btn secondary" onClick={onScanAgain}>Nochmal scannen</button>
                        <button className="btn primary" onClick={onManual}>Manuell eingeben</button>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Haupt-Scannen-Seite ─────────────────────────────────────────────────────
const TABS = [
    { id: 'barcode', icon: '📷', label: 'Barcode' },
    { id: 'foto', icon: '🤖', label: 'Foto-KI' },
    { id: 'bon', icon: '🧾', label: 'Kassenbon' },
];

const Scannen = () => {
    const { activeUserId } = useUser();
    const [tab, setTab] = useState('barcode');

    // Barcode-Zustand
    const [scanning, setScanning] = useState(false);
    const [barcode, setBarcode] = useState(null);
    const [addSuccess, setAddSuccess] = useState('');
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualKat, setManualKat] = useState('kuehlschrank');
    const [manualAblauf, setManualAblauf] = useState('');

    // Foto/Bon-Zustand
    const [kiLoading, setKiLoading] = useState(false);
    const [kiError, setKiError] = useState('');
    const [bulkItems, setBulkItems] = useState(null);
    const [bonInfo, setBonInfo] = useState(null);
    const fotoRef = useRef(null);
    const bonRef = useRef(null);

    const kiReady = isKIConfigured();

    // ─── Produkt direkt hinzufügen ──────────────────────────────────────────
    const addProduct = async ({ name, kategorie, ort, ablauf }) => {
        const expiryDate = ablauf
            ? new Date(ablauf).toISOString()
            : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

        await db.produkte.add({
            id: `scan-${Date.now()}-${Math.random()}`,
            person_id: activeUserId,
            name: name.trim(),
            kategorie: kategorie || 'kuehlschrank',
            ort: ort || kategorie || 'kuehlschrank',
            ablauf: expiryDate
        });
    };

    const handleBarcodeAdd = async (data) => {
        await addProduct(data);
        setBarcode(null);
        setScanning(false);
        setAddSuccess(`✅ "${data.name}" hinzugefügt!`);
        setTimeout(() => setAddSuccess(''), 3000);
    };

    // ─── Manual Entry ───────────────────────────────────────────────────────
    const handleManualAdd = async () => {
        if (!manualName.trim()) return;
        await addProduct({ name: manualName, kategorie: manualKat, ort: manualKat, ablauf: manualAblauf });
        setAddSuccess(`✅ "${manualName}" hinzugefügt!`);
        setManualName(''); setManualAblauf(''); setShowManualForm(false);
        setTimeout(() => setAddSuccess(''), 3000);
    };

    // ─── Foto-KI ────────────────────────────────────────────────────────────
    const handleFotoSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setKiError('');
        setKiLoading(true);
        try {
            const base64 = await compressImage(file);
            const items = await analyzePhoto(base64);
            if (items.length === 0) {
                setKiError('Keine Lebensmittel erkannt. Versuche ein klareres Foto.');
            } else {
                setBulkItems({ type: 'foto', items });
            }
        } catch (err) {
            setKiError(err.message || 'Fehler bei der KI-Analyse');
        } finally {
            setKiLoading(false);
            if (fotoRef.current) fotoRef.current.value = '';
        }
    };

    // ─── Kassenbon-KI ───────────────────────────────────────────────────────
    const handleBonSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setKiError('');
        setKiLoading(true);
        try {
            const base64 = await compressImage(file);
            const result = await analyzeReceipt(base64);
            if (result.items.length === 0) {
                setKiError('Keine Artikel auf dem Kassenbon erkannt. Versuche ein klareres Foto.');
            } else {
                setBonInfo({ laden: result.laden, datum: result.datum });
                setBulkItems({ type: 'bon', items: result.items });
            }
        } catch (err) {
            setKiError(err.message || 'Fehler bei der Kassenbon-Analyse');
        } finally {
            setKiLoading(false);
            if (bonRef.current) bonRef.current.value = '';
        }
    };

    // ─── Bulk Confirm ───────────────────────────────────────────────────────
    const handleBulkConfirm = async (confirmedItems) => {
        let count = 0;
        for (const item of confirmedItems) {
            const ablaufTage = item.ablaufTage || 7;
            await db.produkte.add({
                id: `bulk-${Date.now()}-${Math.random()}`,
                person_id: activeUserId,
                name: item.name,
                kategorie: item.kategorie || 'kuehlschrank',
                ort: item.kategorie || 'kuehlschrank',
                ablauf: new Date(Date.now() + ablaufTage * 24 * 3600 * 1000).toISOString()
            });
            count++;
        }
        setBulkItems(null);
        setBonInfo(null);
        setAddSuccess(`✅ ${count} Artikel zum Inventar hinzugefügt!`);
        setTimeout(() => setAddSuccess(''), 4000);
    };

    // ─── BulkReview aktiv ───────────────────────────────────────────────────
    if (bulkItems) {
        return (
            <div className="page scannen-page">
                {bonInfo && (
                    <div className="bon-info">
                        {bonInfo.laden && <span>🏪 {bonInfo.laden}</span>}
                        {bonInfo.datum && <span> · 📅 {bonInfo.datum}</span>}
                    </div>
                )}
                <BulkReview
                    items={bulkItems.items}
                    onConfirm={handleBulkConfirm}
                    onCancel={() => { setBulkItems(null); setBonInfo(null); }}
                />
            </div>
        );
    }

    return (
        <div className="page scannen-page">
            <h2>📷 Scannen</h2>

            {addSuccess && <div className="success">{addSuccess}</div>}

            {/* Tabs */}
            <div className="scan-tabs">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`scan-tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => { setTab(t.id); setBarcode(null); setScanning(false); setKiError(''); }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Barcode ── */}
            {tab === 'barcode' && (
                <div className="scan-tab-content">
                    {barcode ? (
                        <BarcodeResult
                            barcode={barcode}
                            onAdd={handleBarcodeAdd}
                            onScanAgain={() => setBarcode(null)}
                            onManual={() => { setBarcode(null); setShowManualForm(true); }}
                        />
                    ) : scanning ? (
                        <BarcodeScanner
                            onScan={(code) => { setScanning(false); setBarcode(code); }}
                            onClose={() => setScanning(false)}
                        />
                    ) : showManualForm ? (
                        <div className="card manual-form">
                            <h3>Manuell eingeben</h3>
                            <div className="form-group">
                                <label>Produktname</label>
                                <input
                                    type="text"
                                    placeholder="z.B. Milch, Joghurt..."
                                    value={manualName}
                                    onChange={e => setManualName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Kategorie</label>
                                <select value={manualKat} onChange={e => setManualKat(e.target.value)}>
                                    {DEFAULT_CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ablaufdatum (optional)</label>
                                <input type="date" value={manualAblauf} onChange={e => setManualAblauf(e.target.value)} />
                            </div>
                            <div className="button-group">
                                <button className="btn secondary" onClick={() => setShowManualForm(false)}>Zurück</button>
                                <button className="btn primary" onClick={handleManualAdd} disabled={!manualName.trim()}>
                                    ➕ Hinzufügen
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="scan-start-area">
                            <div className="scan-big-icon">📷</div>
                            <p className="scan-hint-text">Scanne den Barcode eines Produkts um es schnell zum Inventar hinzuzufügen</p>
                            <button className="btn primary scan-start-btn" onClick={() => setScanning(true)}>
                                📷 Barcode scannen
                            </button>
                            <button className="btn secondary" onClick={() => setShowManualForm(true)} style={{ marginTop: 8 }}>
                                ✏️ Manuell eingeben
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab: Foto-KI ── */}
            {tab === 'foto' && (
                <div className="scan-tab-content">
                    <input
                        ref={fotoRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFotoSelected}
                        style={{ display: 'none' }}
                    />
                    {!kiReady ? (
                        <div className="scan-ki-hinweis card">
                            <p>🔑 Für die Foto-KI wird ein KI-API-Key benötigt.</p>
                            <p>Gehe zu <strong>Einstellungen → KI-Einstellungen</strong> und trage deinen OpenAI oder Anthropic API-Key ein.</p>
                        </div>
                    ) : kiLoading ? (
                        <div className="scan-ki-loading">
                            <div className="scan-ki-spinner">🤖</div>
                            <p>KI analysiert dein Foto...</p>
                            <p className="scan-ki-sub">Das dauert ein paar Sekunden</p>
                        </div>
                    ) : (
                        <div className="scan-start-area">
                            <div className="scan-big-icon">🤖</div>
                            <p className="scan-hint-text">Fotografiere deinen Kühlschrank oder Lebensmittel — die KI erkennt automatisch alle Produkte</p>
                            {kiError && <div className="error">{kiError}</div>}
                            <button className="btn primary scan-start-btn" onClick={() => fotoRef.current?.click()}>
                                📸 Foto aufnehmen
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Tab: Kassenbon ── */}
            {tab === 'bon' && (
                <div className="scan-tab-content">
                    <input
                        ref={bonRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleBonSelected}
                        style={{ display: 'none' }}
                    />
                    {!kiReady ? (
                        <div className="scan-ki-hinweis card">
                            <p>🔑 Für den Kassenbon-Scanner wird ein KI-API-Key benötigt.</p>
                            <p>Gehe zu <strong>Einstellungen → KI-Einstellungen</strong> und trage deinen API-Key ein.</p>
                        </div>
                    ) : kiLoading ? (
                        <div className="scan-ki-loading">
                            <div className="scan-ki-spinner">🧾</div>
                            <p>KI liest den Kassenbon...</p>
                            <p className="scan-ki-sub">Artikel werden extrahiert</p>
                        </div>
                    ) : (
                        <div className="scan-start-area">
                            <div className="scan-big-icon">🧾</div>
                            <p className="scan-hint-text">Fotografiere deinen Kassenbon — die KI extrahiert alle gekauften Lebensmittel und fügt sie dem Inventar hinzu</p>
                            {kiError && <div className="error">{kiError}</div>}
                            <button className="btn primary scan-start-btn" onClick={() => bonRef.current?.click()}>
                                📸 Kassenbon scannen
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Scannen;
