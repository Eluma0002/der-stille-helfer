# Kühlschrank-Manager Pro

## What This Is

Eine erweiterte Kühlschrank-Inventar-App mit AI-gestützten Kochvorschlägen und Food-Sharing-Netzwerk. Nutzer scannen Lebensmittel (Barcode/Foto), erhalten personalisierte Rezeptvorschläge basierend auf vorhandenen Zutaten, und können überschüssige Lebensmittel an lokale Community verschenken. Die App berücksichtigt Allergien automatisch und schlägt Ersatzprodukte vor.

## Core Value

Lebensmittelverschwendung reduzieren durch intelligentes Inventar-Management, personalisierte Kochvorschläge und Community-Food-Sharing.

## Requirements

### Validated

Diese Features sind bereits in "Der Stille Helfer" v1 implementiert und funktionieren:

- ✓ Produkt-Inventar mit Kategorien (Kühlschrank, Gefrierschrank, Vorrat) — existing
- ✓ Ablaufdatum-Tracking und Sortierung — existing
- ✓ Rezeptverwaltung mit Zutaten und Anweisungen — existing
- ✓ Einkaufsliste mit Checkbox-Status — existing
- ✓ Multi-User Support (Elvis & Alberina) mit Datentrennung — existing
- ✓ Allergie-Management mit automatischen Substitutionen — existing
- ✓ Offline-First PWA mit IndexedDB — existing
- ✓ Backup/Export/Import von Daten — existing
- ✓ Rezept-zu-Einkaufsliste Integration — existing

### Active

Neue Features für Version 2.0:

- [ ] Barcode-Scanner mit OpenFoodFacts API Integration
- [ ] Foto-Analyse für automatische Produkterkennung
- [ ] Erweiterte AI-Koch-Funktionen:
  - [ ] Tagesplanung (Frühstück, Mittag, Abend)
  - [ ] Snack-Vorschläge (2-3x täglich)
  - [ ] Intelligente Rezept-Empfehlungen basierend auf Ablaufdaten
  - [ ] "Was kann ich kochen?" Feature
- [ ] Food-Sharing Netzwerk:
  - [ ] Produkte zum Verschenken anbieten
  - [ ] Lokale Suche nach verfügbaren Lebensmitteln
  - [ ] Geo-basiertes Matching
  - [ ] Chat/Kontakt-Funktion
  - [ ] Abholungs-Koordination
- [ ] Batch-Import via Foto (Kassenbon-Scanning)
- [ ] Erweiterte Produktdetails (Nährwerte, Allergene von OpenFoodFacts)
- [ ] Statistiken (Verschwendung, gesparte Kosten, geteilte Items)

### Out of Scope

- Video-Posts oder Social-Media Features — Fokus auf Lebensmittel-Management, nicht soziales Netzwerk
- Echtzeit-Chat — Asynchrone Kontaktaufnahme reicht für v2
- Zahlungs-/Verkaufs-Features — Nur kostenloses Verschenken, kein Marktplatz
- Lieferservice-Integration — Nur Selbstabholung
- OCR für handgeschriebene Rezepte — Zu komplex für v2

## Context

**Basis-Projekt:**
Wir bauen auf "Der Stille Helfer" v1 auf - eine funktionierende React/Dexie PWA mit:
- React 18.3 + Vite 5.1
- Dexie 4.0 (IndexedDB)
- React Router 6.22 (HashRouter)
- Offline-first Architektur
- Multi-User System (bereits 2 Profile)
- Bot-System (KochBot für Rezept-Checks)

**Technische Entscheidungen aus v1:**
- Keine externen State-Management-Libs (React Hooks + IndexedDB)
- Deutsche UI-Strings in `strings/de.js`
- Co-located CSS pro Component
- Named exports für Utilities, Default für Components
- Service Worker mit Workbox

**Neue Anforderungen:**
- OpenFoodFacts API für Produktdaten
- Geo-Location für Food-Sharing
- Kamera-Zugriff für Barcode/Foto
- Möglicherweise Backend für Food-Sharing (oder P2P?)

## Constraints

- **Plattform**: Web App (PWA) - muss auf Desktop + Mobile funktionieren
- **Offline-First**: Kernfunktionen (Inventar, Rezepte) müssen offline funktionieren
- **Privacy**: User-Daten bleiben lokal (außer Food-Sharing Listings)
- **Performance**: Foto-Analyse darf nicht zu teuer sein (API-Kosten)
- **Browser**: Chrome, Firefox, Safari, Edge (moderne Browser mit Service Worker)
- **Sprache**: Deutsche UI, deutscher Content

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Basis: Der Stille Helfer v1 | Funktionierende Architektur wiederverwenden statt neu bauen | — Pending |
| OpenFoodFacts für Produktdaten | Kostenlose, offene API mit Barcode-Lookup | — Pending |
| Food-Sharing: Geo-basiert | Lokale Community-Fokus, nur Abholung | — Pending |
| Foto-Analyse: Optional für v2.0 | Barcode-Scan zuerst, Foto später wenn Budget/API ok | — Pending |
| Multi-User erweitern | Bestehende Architektur für mehr als 2 User skalieren | — Pending |

---
*Last updated: 2026-02-07 after initialization*
