import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { DEFAULT_CATEGORIES } from '../constants';
import { useUser } from '../context/UserContext';
import { strings } from '../strings/de';
import BarcodeScanner from '../components/BarcodeScanner';
import { searchProduct } from '../api/openfoodfacts';

const ProdukteListe = () => {
    const { activeUserId } = useUser();
    const produkte = useLiveQuery(
        () => db.produkte.where('person_id').equals(activeUserId).toArray(),
        [activeUserId]
    );
    const [name, setName] = useState('');
    const [kat, setKat] = useState('kuehlschrank'); // Default: Kühlschrank
    const [ablauf, setAblauf] = useState(''); // Manual date input
    const [sortBy, setSortBy] = useState('ablauf');
    const [filterOrt, setFilterOrt] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState('');

    const addProdukt = async () => {
        if (!name) return;
        setIsLoading(true);

        try {
            // Use manual date or default 7 days
            const expiryDate = ablauf
                ? new Date(ablauf).toISOString()
                : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

            await db.produkte.add({
                id: Date.now().toString(),
                person_id: activeUserId,
                name,
                kategorie: kat,
                ort: kat,
                ablauf: expiryDate
            });
            setName('');
            setAblauf(''); // Reset date input
        } catch (err) {
            console.error('Error adding product:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Capitalize first letter automatically
    const handleNameChange = (e) => {
        const value = e.target.value;
        if (value.length === 1) {
            setName(value.toUpperCase());
        } else {
            setName(value);
        }
    };

    // Delete product with option to add to shopping list
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

                // Auto-clear message after 3 seconds
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

    const filteredAndSortedProdukte = useMemo(() => {
        if (!produkte) return [];

        let filtered = [...produkte];
        if (filterOrt !== 'all') {
            filtered = filtered.filter(p => p.ort === filterOrt);
        }

        return [...filtered].sort((a, b) => {
            if (sortBy === 'ablauf') {
                return new Date(a.ablauf) - new Date(b.ablauf);
            } else {
                return a.name.localeCompare(b.name);
            }
        });
    }, [produkte, sortBy, filterOrt]);

    const getLocationName = (locationId) => {
        const category = DEFAULT_CATEGORIES.find(c => c.id === locationId);
        return category ? category.name : locationId;
    };

    return (
        <div className="page">
            <h2>{strings.products.title}</h2>

            <div className="card">
                {scanMessage && (
                    <div className="scan-message">{scanMessage}</div>
                )}
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Produktname..."
                        value={name}
                        onChange={handleNameChange}
                    />
                </div>
                <div className="form-group">
                    <select value={kat} onChange={(e) => setKat(e.target.value)}>
                        {DEFAULT_CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="ablauf-input" style={{ fontSize: '0.9rem', marginBottom: '5px', display: 'block' }}>
                        Ablaufdatum (optional, Standard: +7 Tage)
                    </label>
                    <input
                        id="ablauf-input"
                        type="date"
                        value={ablauf}
                        onChange={(e) => setAblauf(e.target.value)}
                        placeholder="Optional"
                    />
                </div>
                <div className="button-group">
                    <button
                        onClick={() => setShowScanner(true)}
                        className="btn secondary"
                        disabled={isLoading}
                    >
                        📷 Barcode scannen
                    </button>
                    <button
                        onClick={addProdukt}
                        className="btn primary"
                        disabled={isLoading}
                    >
                        {isLoading ? `${strings.common.loading}...` : strings.products.add}
                    </button>
                </div>
            </div>

            {showScanner && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            <div className="controls">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="ablauf">{strings.products.sort.expiration}</option>
                    <option value="name">{strings.products.sort.name}</option>
                </select>

                <select
                    value={filterOrt}
                    onChange={(e) => setFilterOrt(e.target.value)}
                >
                    <option value="all">{strings.products.filter.all}</option>
                    {DEFAULT_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                </select>
            </div>

            <div className="list">
                {isLoading && <p className="loading">{strings.common.loading}...</p>}
                {filteredAndSortedProdukte.length === 0 ? (
                    <p className="empty-state">{strings.products.noProducts}</p>
                ) : (
                    filteredAndSortedProdukte.map(p => (
                        <div key={p.id} className="card product-item">
                            <div className="product-info">
                                <strong>{p.name}</strong>
                                <small>Läuft ab: {new Date(p.ablauf).toLocaleDateString()}</small>
                                <small>{getLocationName(p.ort)}</small>
                            </div>
                            <button
                                onClick={() => handleDelete(p)}
                                disabled={isLoading}
                                className="btn-delete"
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProdukteListe;
