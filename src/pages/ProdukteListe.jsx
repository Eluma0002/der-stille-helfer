import React, { useState, useMemo } from 'react';
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
// Produkte die weiter vorne stehen = häufiger / bekannter
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
    const [editProduct, setEditProduct] = useState(null); // { id, name, kategorie, ablauf }

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

    // Einkaufsliste
    const [einkaufName, setEinkaufName] = useState('');
    const [einkaufOpen, setEinkaufOpen] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);

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
                ablauf: expiryDate
            });
            setName('');
            setAblauf('');
        } catch (err) {
            console.error('Error adding product:', err);
        } finally {
            setIsLoading(false);
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

    const toggleEinkaufItem = (item) =>
        db.einkaufsliste.update(item.id, { checked: !item.checked });

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
        } catch {
            // fallback
        }
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
                    // Erst nach Bekanntheit (häufige Produkte zuerst)
                    const pA = getProductPriority(a.name);
                    const pB = getProductPriority(b.name);
                    if (pA !== pB) return pA - pB;
                    // Gleiche Priorität: nach Ablaufdatum (bald ablaufend zuerst)
                    return new Date(a.ablauf) - new Date(b.ablauf);
                });
            if (items.length > 0 || query) grouped[cat.id] = items;
        }
        return grouped;
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

            {/* Add Product Toggle */}
            <button
                className="btn-add-toggle"
                onClick={() => setShowAddForm(!showAddForm)}
            >
                {showAddForm ? '✕ Schliessen' : '+ Produkt hinzufügen'}
            </button>

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
                        <select
                            value={kat}
                            onChange={(e) => setKat(e.target.value)}
                            className="form-select"
                        >
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

            {/* Barcode Scanner */}
            {showScanner && (
                <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}

            {/* Category Sections */}
            <div className="kategorie-sections">
                {DEFAULT_CATEGORIES.map(cat => {
                    const items = categorizedProducts[cat.id];
                    if (!items || (items.length === 0 && !isSearchActive)) return null;

                    const rgb = hexToRgb(cat.color);

                    return (
                        <div
                            key={cat.id}
                            className="kategorie-section"
                            style={{
                                borderLeftColor: cat.color,
                                background: `rgba(${rgb}, 0.04)`
                            }}
                        >
                            <div className="kategorie-header">
                                <span className="kategorie-icon" style={{ color: cat.color }}>
                                    {cat.icon}
                                </span>
                                <span className="kategorie-name" style={{ color: cat.color }}>
                                    {cat.name}
                                </span>
                                <span
                                    className="kategorie-badge"
                                    style={{ background: cat.color }}
                                >
                                    {items.length}
                                </span>
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
                                                    <span className={`produkt-card-expiry ${expiry.className}`}>
                                                        {expiry.text}
                                                    </span>
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

            {/* Empty state */}
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
                        {/* Input */}
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

                        {/* Unchecked items */}
                        {uncheckedEinkauf.length === 0 && checkedEinkauf.length === 0 && (
                            <p className="einkauf-empty">Liste ist leer – füge etwas hinzu!</p>
                        )}

                        <div className="einkauf-list">
                            {uncheckedEinkauf.map(item => (
                                <div key={item.id} className="einkauf-item">
                                    <button
                                        className="einkauf-check"
                                        onClick={() => toggleEinkaufItem(item)}
                                    >
                                        <span className="check-circle"></span>
                                    </button>
                                    <span className="einkauf-name">{item.name}</span>
                                    <button
                                        className="einkauf-delete"
                                        onClick={() => deleteEinkaufItem(item.id)}
                                    >×</button>
                                </div>
                            ))}
                        </div>

                        {/* Checked items */}
                        {checkedEinkauf.length > 0 && (
                            <div className="einkauf-checked-section">
                                <div className="checked-header">
                                    <span className="checked-title">Erledigt ({checkedEinkauf.length})</span>
                                    <button className="btn small secondary" onClick={clearCheckedEinkauf}>
                                        Entfernen
                                    </button>
                                </div>
                                <div className="einkauf-list">
                                    {checkedEinkauf.map(item => (
                                        <div key={item.id} className="einkauf-item checked">
                                            <button
                                                className="einkauf-check"
                                                onClick={() => toggleEinkaufItem(item)}
                                            >
                                                <span className="check-circle checked"></span>
                                            </button>
                                            <span className="einkauf-name">{item.name}</span>
                                            <button
                                                className="einkauf-delete"
                                                onClick={() => deleteEinkaufItem(item.id)}
                                            >×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Share row */}
                        {uncheckedEinkauf.length > 0 && (
                            <div className="einkauf-share-row">
                                <button
                                    className="einkauf-share-btn copy-btn"
                                    onClick={copyToClipboard}
                                >
                                    {copySuccess ? '✓ Kopiert!' : '📋 Kopieren'}
                                </button>
                                <button
                                    className="einkauf-share-btn whatsapp-btn"
                                    onClick={shareViaWhatsApp}
                                >
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
