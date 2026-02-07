# Requirements: Kühlschrank-Manager Pro

**Defined:** 2026-02-07
**Core Value:** Lebensmittelverschwendung reduzieren durch intelligentes Inventar-Management, personalisierte Kochvorschläge und Community-Food-Sharing.

## v1 Requirements (Basis-Features von Der Stille Helfer)

Diese Requirements sind bereits implementiert und validiert:

### Inventar-Management

- [x] **INV-01**: User kann Produkte manuell hinzufügen (Name, Menge, Ablaufdatum, Kategorie)
- [x] **INV-02**: User kann Produkte nach Ablaufdatum sortiert sehen (soonest first)
- [x] **INV-03**: User kann Produkte nach Lagerort filtern (Kühlschrank, Gefrierschrank, Vorrat)
- [x] **INV-04**: User kann Produkte bearbeiten und löschen
- [x] **INV-05**: Produkte werden in IndexedDB gespeichert (offline-first)

### Rezepte

- [x] **REZ-01**: User kann Rezepte mit Zutaten und Anweisungen ansehen
- [x] **REZ-02**: User kann eigene Rezepte erstellen
- [x] **REZ-03**: User kann Rezepte favorisieren
- [x] **REZ-04**: Rezept-Zutaten können zur Einkaufsliste hinzugefügt werden

### Einkaufsliste

- [x] **EINK-01**: User kann Artikel zur Einkaufsliste hinzufügen
- [x] **EINK-02**: User kann Artikel als gekauft abhaken
- [x] **EINK-03**: User kann abgehakte Artikel löschen

### Allergien & Substitutionen

- [x] **ALL-01**: User kann Allergien/Diät-Einschränkungen in Profil eintragen
- [x] **ALL-02**: KochBot prüft Rezepte auf problematische Zutaten
- [x] **ALL-03**: KochBot schlägt automatisch Ersatzprodukte vor (z.B. Milch → Sauerrahm)
- [x] **ALL-04**: Rezepte zeigen Sicherheits-Badge (grün/gelb/rot)

### Multi-User

- [x] **USER-01**: User kann zwischen Profilen wechseln (Elvis/Alberina)
- [x] **USER-02**: Jeder User sieht nur seine eigenen Daten (person_id Isolation)
- [x] **USER-03**: Aktiver User wird in localStorage gespeichert

### Backup & Offline

- [x] **BACK-01**: User kann alle Daten als JSON exportieren
- [x] **BACK-02**: User kann Daten aus JSON importieren
- [x] **OFF-01**: App funktioniert vollständig offline (PWA mit Service Worker)
- [x] **OFF-02**: Update-Benachrichtigung bei neuer Service Worker Version

## v2 Requirements (Neue Features)

### Barcode-Scanning

- [ ] **SCAN-01**: User kann Barcode mit Kamera scannen
- [ ] **SCAN-02**: Gescannter Barcode wird gegen OpenFoodFacts API abgefragt
- [ ] **SCAN-03**: Produktdaten werden aus OpenFoodFacts übernommen (Name, Marke, Kategorie)
- [ ] **SCAN-04**: User kann Produktdaten vor dem Hinzufügen bearbeiten
- [ ] **SCAN-05**: OpenFoodFacts Ergebnisse werden in IndexedDB gecacht (90 Tage TTL)
- [ ] **SCAN-06**: Barcode-Scan funktioniert offline mit gecachten Produkten
- [ ] **SCAN-07**: Kamera-Permissions werden korrekt gehandhabt (iOS Safari kompatibel)

### Kassenbon-Scanning (Receipt OCR)

- [ ] **OCR-01**: User kann Foto von Kassenbon machen
- [ ] **OCR-02**: Tesseract.js extrahiert Produktnamen und Preise
- [ ] **OCR-03**: User kann extrahierte Produkte vor Import überprüfen/korrigieren
- [ ] **OCR-04**: Batch-Import fügt alle Produkte mit einem Klick hinzu
- [ ] **OCR-05**: OCR-Genauigkeit wird angezeigt (Konfidenz-Level pro Produkt)

### AI-Koch Erweitert

- [ ] **AI-01**: AI schlägt 3 Mahlzeiten täglich vor (Frühstück, Mittag, Abend)
- [ ] **AI-02**: AI schlägt 2-3 Snacks täglich vor
- [ ] **AI-03**: Vorschläge berücksichtigen vorhandene Inventar-Zutaten
- [ ] **AI-04**: Vorschläge priorisieren Produkte mit nahem Ablaufdatum
- [ ] **AI-05**: Vorschläge respektieren Allergie-Einstellungen
- [ ] **AI-06**: "Was kann ich kochen?" Feature zeigt machbare Rezepte
- [ ] **AI-07**: AI-Vorschläge werden gecacht (7 Tage TTL, Inventar-Hash als Key)
- [ ] **AI-08**: Fallback auf KochBot wenn AI-API nicht verfügbar (offline/quota)
- [ ] **AI-09**: User kann Vorschläge ablehnen und neue generieren

### Food-Sharing Netzwerk

- [ ] **SHARE-01**: User kann Produkte zum Verschenken markieren
- [ ] **SHARE-02**: Verschenk-Listings enthalten Foto, Name, Menge, Ablaufdatum, Abholort
- [ ] **SHARE-03**: User kann lokale Listings sehen (geo-basierte Suche)
- [ ] **SHARE-04**: Geolocation wird auf 1km gerundet (Privacy)
- [ ] **SHARE-05**: User kann Listing anfragen (Kontaktaufnahme)
- [ ] **SHARE-06**: User kann Abholung bestätigen
- [ ] **SHARE-07**: Abgeholte Items werden aus Listing entfernt
- [ ] **SHARE-08**: User sieht eigene Listings (aktiv/abgeschlossen)
- [ ] **SHARE-09**: Disclaimer/Haftungsausschluss muss akzeptiert werden
- [ ] **SHARE-10**: User kann andere User blockieren
- [ ] **SHARE-11**: Listings synchronisieren mit Backend (PocketBase/Supabase)
- [ ] **SHARE-12**: Offline erstellte Listings werden in Sync-Queue gespeichert

### Benachrichtigungen

- [ ] **NOT-01**: Push-Benachrichtigung 7 Tage vor Ablauf
- [ ] **NOT-02**: Push-Benachrichtigung 3 Tage vor Ablauf
- [ ] **NOT-03**: Push-Benachrichtigung am Tag des Ablaufs
- [ ] **NOT-04**: Benachrichtigungs-Timing ist kategorie-abhängig (Milch vs. Konserven)
- [ ] **NOT-05**: User kann Benachrichtigungen in Einstellungen konfigurieren

### Statistiken & Insights

- [ ] **STAT-01**: Dashboard zeigt vermiedene Verschwendung (Anzahl Produkte gerettet)
- [ ] **STAT-02**: Dashboard zeigt geschätzte Kosten-Ersparnis
- [ ] **STAT-03**: Dashboard zeigt Anzahl geteilter Items
- [ ] **STAT-04**: Monats-/Jahres-Übersicht verfügbar
- [ ] **STAT-05**: Kategorie-Breakdown (welche Lebensmittel werden am meisten verschwendet)

### Erweiterte Produktdaten

- [ ] **PROD-01**: Produktdetails zeigen Nährwerte (von OpenFoodFacts)
- [ ] **PROD-02**: Produktdetails zeigen Allergene (von OpenFoodFacts)
- [ ] **PROD-03**: Produktdetails zeigen Nutri-Score (von OpenFoodFacts)
- [ ] **PROD-04**: User kann fehlende OpenFoodFacts Daten selbst ergänzen

## v3 Requirements (Zukunft)

Deferred to later releases:

### Foto-Erkennung

- **FOTO-01**: AI erkennt Lebensmittel auf Fotos (Computer Vision)
- **FOTO-02**: Mehrere Produkte pro Foto erkennbar
- **FOTO-03**: User kann erkannte Produkte bestätigen/korrigieren

### Community Features

- **COM-01**: User kann andere User als "vertrauenswürdig" markieren
- **COM-02**: Reputations-System basierend auf erfolgreichen Abholungen
- **COM-03**: Community-Statistiken (wieviel wurde lokal geteilt)

### Smart Home Integration

- **SMART-01**: Integration mit smarten Kühlschränken (Samsung Family Hub, LG ThinQ)
- **SMART-02**: Automatische Inventar-Updates bei Entnahme (IoT)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Echtzeit-Chat | Asynchrone Kontaktaufnahme reicht, Echtzeit überengineered |
| Lieferservice | Nur Selbstabholung, Lieferung bringt Haftungs-Probleme |
| Zahlungen/Verkauf | Fokus auf kostenloses Teilen, kein Marktplatz |
| Automatische Inventar-Deduktion | Unmöglich ohne IoT, manuelle Verwaltung realistischer |
| Video-Posts | Social-Media Feature, passt nicht zur App-Vision |
| Öffentliche Reviews | Schafft Toxizität, privates Blockieren reicht |

## Traceability

### v2 Requirements Mapping

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAN-01 | Phase 1 | Pending |
| SCAN-02 | Phase 1 | Pending |
| SCAN-03 | Phase 1 | Pending |
| SCAN-04 | Phase 1 | Pending |
| SCAN-05 | Phase 1 | Pending |
| SCAN-06 | Phase 1 | Pending |
| SCAN-07 | Phase 1 | Pending |
| OCR-01 | Phase 2 | Pending |
| OCR-02 | Phase 2 | Pending |
| OCR-03 | Phase 2 | Pending |
| OCR-04 | Phase 2 | Pending |
| OCR-05 | Phase 2 | Pending |
| PROD-01 | Phase 3 | Pending |
| PROD-02 | Phase 3 | Pending |
| PROD-03 | Phase 3 | Pending |
| PROD-04 | Phase 3 | Pending |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 4 | Pending |
| AI-03 | Phase 4 | Pending |
| AI-04 | Phase 4 | Pending |
| AI-05 | Phase 4 | Pending |
| AI-06 | Phase 4 | Pending |
| AI-07 | Phase 4 | Pending |
| AI-08 | Phase 4 | Pending |
| AI-09 | Phase 4 | Pending |
| NOT-01 | Phase 5 | Pending |
| NOT-02 | Phase 5 | Pending |
| NOT-03 | Phase 5 | Pending |
| NOT-04 | Phase 5 | Pending |
| NOT-05 | Phase 5 | Pending |
| SHARE-11 | Phase 6 | Pending |
| SHARE-12 | Phase 6 | Pending |
| SHARE-01 | Phase 7 | Pending |
| SHARE-02 | Phase 7 | Pending |
| SHARE-03 | Phase 7 | Pending |
| SHARE-04 | Phase 7 | Pending |
| SHARE-05 | Phase 7 | Pending |
| SHARE-06 | Phase 7 | Pending |
| SHARE-07 | Phase 7 | Pending |
| SHARE-08 | Phase 7 | Pending |
| SHARE-09 | Phase 0 | Pending |
| SHARE-10 | Phase 7 | Pending |
| STAT-01 | Phase 8 | Pending |
| STAT-02 | Phase 8 | Pending |
| STAT-03 | Phase 8 | Pending |
| STAT-04 | Phase 8 | Pending |
| STAT-05 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 23 total (all validated and implemented)
- v2 requirements: 47 total
- Mapped to phases: 47/47 ✓
- Unmapped: 0 ✓

**Phase Distribution:**
- Phase 0 (Legal Foundation): 1 requirement
- Phase 1 (Barcode Scanning): 7 requirements
- Phase 2 (Receipt OCR): 5 requirements
- Phase 3 (Extended Product Data): 4 requirements
- Phase 4 (AI Cooking Assistant): 9 requirements
- Phase 5 (Smart Notifications): 5 requirements
- Phase 6 (Sharing Backend): 2 requirements
- Phase 7 (Food Sharing Network): 9 requirements
- Phase 8 (Analytics & Insights): 5 requirements

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after roadmap creation (v2.0 traceability complete)*
