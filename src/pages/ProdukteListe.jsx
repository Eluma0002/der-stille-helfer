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

    if (diffDays < 0) {
        return { text: 'abgelaufen', className: 'expiry-expired' };
    }
    if (diffDays === 0) {
        return { text: 'heute', className: 'expiry-today' };
    }
    if (diffDays === 1) {
        return { text: 'morgen', className: 'expiry-soon' };
    }
    if (diffDays < 7) {
        return { text: `noch ${diffDays} Tage`, className: 'expiry-ok' };
    }
    const weeks = Math.floor(diffDays / 7);
    if (weeks < 4) {
        return { text: `noch ${weeks} Wochen`, className: 'expiry-good' };
    }
    return { text: `noch ${diffDays} Tage`, className: 'expiry-good' };
};

const ProdukteListe = () => {
    const { activeUserId } = useUser();
    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );

    const [name, setName] = useState('');
    const [kat, setKat] = useState('kuehlschrank');
    const [ablauf, setAblauf] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState('');

    // Capitalize first letter automatically
    const handleNameChange = (e) => {
        const value = e.target.value;
        if (value.length === 1) {
            setName(value.toUpperCase());
        } else {
            setName(value);
        }
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
            `"${product.name}" löschen?\n\nKlicke OK um auch zur Einkaufsliste hinzuzufügen, Abbrechen um nur zu löschen.`
        );

        setIsLoading(true);
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
                setScanMessage(`Barcode ${barcode} nicht gefunden. Bitte manuell eingeben.`);
                setName('');
                setTimeout(() => setScanMessage(''), 5000);
            }
        } catch (err) {
            console.error('Scan error:', err);
            setScanMessage('Fehler beim Suchen. Bitte manuell eingeben.');
            setTimeout(() => setScanMessage(''), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    // Group products by category, filtered by search
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
                .sort((a, b) => new Date(a.ablauf) - new Date(b.ablauf));
            if (items.length > 0 || query) {
                grouped[cat.id] = items;
            }
        }
        return grouped;
    }, [produkte, searchQuery]);

    const getCategoryInfo = (categoryId) => {
        return DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    };

    const totalProducts = produkte ? produkte.length : 0;
    const isSearchActive = searchQuery.trim().length > 0;

    return (
        <div className="page produkte-page">
            {/* Header */}
            <div className="produkte-header">
                <h2>Inventar</h2>
                <span className="produkte-count">{totalProducts}</span>
            </div>

            {/* Search */}
            <div className="produkte-search">
                <input
                    type="text"
                    placeholder="Produkt suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                {searchQuery && (
                    <button
                        className="search-clear"
                        onClick={() => setSearchQuery('')}
                    >
                        x
                    </button>
                )}
            </div>

            {/* Add Product Toggle */}
            <button
                className="btn-add-toggle"
                onClick={() => setShowAddForm(!showAddForm)}
            >
                {showAddForm ? 'Schliessen' : '+ Produkt hinzufügen'}
            </button>

            {/* Add Product Form (collapsible) */}
            {showAddForm && (
                <div className="card add-form">
                    {scanMessage && (
                        <div className="scan-message">{scanMessage}</div>
                    )}

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
                        <select
                            value={kat}
                            onChange={(e) => setKat(e.target.value)}
                            className="form-select"
                        >
                            {DEFAULT_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label
                            htmlFor="ablauf-input"
                            className="form-label"
                        >
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
                            Barcode scannen
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

            {/* Barcode Scanner Overlay */}
            {showScanner && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Category Sections */}
            <div className="kategorie-sections">
                {DEFAULT_CATEGORIES.map(cat => {
                    const items = categorizedProducts[cat.id];

                    // Hide empty categories unless search is active
                    if (!items || (items.length === 0 && !isSearchActive)) {
                        return null;
                    }

                    return (
                        <div key={cat.id} className="kategorie-section">
                            <div className="kategorie-header">
                                <span className="kategorie-icon">{cat.icon}</span>
                                <span className="kategorie-name">{cat.name}</span>
                                <span
                                    className="kategorie-badge"
                                    style={{ backgroundColor: cat.color }}
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
                                                style={{ borderLeftColor: cat.color }}
                                            >
                                                <div className="produkt-card-icon">
                                                    <ProductIcon
                                                        productName={p.name}
                                                        size="small"
                                                    />
                                                </div>
                                                <div className="produkt-card-info">
                                                    <span className="produkt-card-name">
                                                        {p.name}
                                                    </span>
                                                    <span
                                                        className={`produkt-card-expiry ${expiry.className}`}
                                                    >
                                                        {expiry.text}
                                                    </span>
                                                </div>
                                                <button
                                                    className="produkt-card-delete"
                                                    onClick={() => handleDelete(p)}
                                                    disabled={isLoading}
                                                    title="Löschen"
                                                >
                                                    x
                                                </button>
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
                    <button
                        className="btn primary"
                        onClick={() => setShowAddForm(true)}
                    >
                        + Erstes Produkt hinzufügen
                    </button>
                </div>
            )}

            {/* Search no results */}
            {isSearchActive && Object.values(categorizedProducts).every(arr => arr.length === 0) && totalProducts > 0 && (
                <div className="empty-state">
                    <p>Keine Produkte gefunden für "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
};

export default ProdukteListe;
