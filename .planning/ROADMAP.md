# Roadmap: Kühlschrank-Manager Pro v2.0

## Overview

Version 2.0 transforms Der Stille Helfer from a local inventory manager into an AI-powered food waste reduction platform with community sharing. The journey begins with legal foundation for food sharing, then layers on barcode scanning and receipt OCR for rapid inventory entry, extends product data with nutritional information, adds AI cooking assistance that prioritizes expiring items, implements smart notifications, and culminates with a location-based food sharing network. This roadmap builds on the validated v1 architecture (React/Dexie/PWA) while carefully maintaining offline-first principles through aggressive caching and fallback mechanisms.

## Milestones

- ✅ **v1.0 Base Features** - Inventory, recipes, shopping lists, allergies, multi-user (shipped)
- 🚧 **v2.0 AI-Powered Sharing Platform** - Phases 0-8 (in progress)

## Phases

- [ ] **Phase 0: Legal Foundation** - Food sharing legal framework
- [ ] **Phase 1: Barcode Scanning** - Camera + OpenFoodFacts integration
- [ ] **Phase 2: Receipt OCR** - Batch product entry via photo
- [ ] **Phase 3: Extended Product Data** - Nutritional info and allergens
- [ ] **Phase 4: AI Cooking Assistant** - Smart meal and snack suggestions
- [ ] **Phase 5: Smart Notifications** - Expiration alerts
- [ ] **Phase 6: Sharing Backend** - Authentication and sync infrastructure
- [ ] **Phase 7: Food Sharing Network** - Community listings and coordination
- [ ] **Phase 8: Analytics & Insights** - Waste reduction statistics

## Phase Details

### Phase 0: Legal Foundation
**Goal**: Establish legal framework for food sharing feature to protect users and platform from liability
**Depends on**: Nothing (must complete BEFORE any food sharing code)
**Requirements**: SHARE-09 (disclaimer)
**Success Criteria** (what must be TRUE):
  1. Legal consultation completed with German/EU food sharing expert
  2. Terms of service drafted covering liability, allergen disclosure, food safety
  3. User consent flow designed (GDPR-compliant)
  4. Platform disclaimer approved by legal counsel
  5. Documentation exists for required user warnings and responsibilities
**Plans**: TBD

Plans:
- [ ] 00-01: TBD during phase planning

### Phase 1: Barcode Scanning
**Goal**: Users can scan product barcodes to instantly add items with auto-filled data from OpenFoodFacts
**Depends on**: Phase 0 (legal complete)
**Requirements**: SCAN-01, SCAN-02, SCAN-03, SCAN-04, SCAN-05, SCAN-06, SCAN-07
**Success Criteria** (what must be TRUE):
  1. User can open camera and scan a product barcode (iOS and Android)
  2. Scanned barcode automatically fetches product name, brand, and category from OpenFoodFacts
  3. User can edit fetched product data before adding to inventory
  4. Previously scanned products load instantly from cache when offline
  5. Camera permissions work correctly on iOS Safari in PWA mode (no revocation on navigation)
  6. App uses History API routing (migrated from HashRouter)
**Plans**: TBD

Plans:
- [ ] 01-01: TBD during phase planning
- [ ] 01-02: TBD during phase planning

### Phase 2: Receipt OCR
**Goal**: Users can photograph receipts to batch-add 10+ products in seconds instead of manual entry
**Depends on**: Phase 1 (camera integration patterns established)
**Requirements**: OCR-01, OCR-02, OCR-03, OCR-04, OCR-05
**Success Criteria** (what must be TRUE):
  1. User can photograph a receipt and see extracted product names and prices
  2. OCR accuracy confidence level shown for each extracted item
  3. User can correct OCR errors before batch import
  4. User can add all verified products to inventory with one action
  5. Receipt OCR works with German supermarket receipts (Edeka, Rewe, Aldi, Lidl)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD during phase planning

### Phase 3: Extended Product Data
**Goal**: Users see detailed nutritional information and allergen warnings from OpenFoodFacts for informed decisions
**Depends on**: Phase 1 (OpenFoodFacts integration and caching)
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Success Criteria** (what must be TRUE):
  1. Product detail view displays nutritional values (calories, protein, carbs, fat)
  2. Product detail view displays allergen warnings from OpenFoodFacts
  3. Product detail view displays Nutri-Score when available
  4. User can manually add missing OpenFoodFacts data for future lookups
  5. Allergen data integrates with existing allergy system (warnings for user profile)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD during phase planning

### Phase 4: AI Cooking Assistant
**Goal**: AI suggests personalized meals and snacks based on current inventory, prioritizing expiring items to reduce waste
**Depends on**: Phase 1 (inventory entry patterns established)
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09
**Success Criteria** (what must be TRUE):
  1. User sees 3 daily meal suggestions (breakfast, lunch, dinner) using available inventory
  2. User sees 2-3 daily snack suggestions
  3. Suggestions prioritize products with nearest expiration dates
  4. Suggestions respect user's allergy settings (no prohibited ingredients)
  5. "Was kann ich kochen?" feature shows recipes user can make right now
  6. User can reject suggestions and generate new ones
  7. Suggestions work offline by falling back to existing KochBot logic
  8. AI suggestions are cached for 7 days (inventory changes trigger refresh)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD during phase planning
- [ ] 04-02: TBD during phase planning

### Phase 5: Smart Notifications
**Goal**: Users receive timely expiration alerts preventing food waste through multi-stage notification strategy
**Depends on**: Phase 1 (product inventory with expiration dates)
**Requirements**: NOT-01, NOT-02, NOT-03, NOT-04, NOT-05
**Success Criteria** (what must be TRUE):
  1. User receives push notification 7 days before product expiration
  2. User receives push notification 3 days before product expiration
  3. User receives push notification on day of product expiration
  4. Notification timing adapts to product category (milk vs canned goods)
  5. User can configure notification preferences in settings (enable/disable, timing)
  6. Notifications work on both desktop and mobile (PWA push)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD during phase planning

### Phase 6: Sharing Backend
**Goal**: Backend infrastructure enables authenticated users to sync food sharing listings across devices
**Depends on**: Phase 0 (legal framework established), Phase 5 (core features complete)
**Requirements**: SHARE-11, SHARE-12
**Success Criteria** (what must be TRUE):
  1. Backend server running (PocketBase or Supabase deployed)
  2. User can create account and authenticate
  3. Authentication persists across sessions
  4. Offline-created listings queue in IndexedDB sync queue
  5. Queued listings automatically sync when connection restored
  6. Backend stores listings with geolocation data (fuzzy 1km precision)
  7. Multi-user person_id isolation maintained (no data leakage)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD during phase planning
- [ ] 06-02: TBD during phase planning

### Phase 7: Food Sharing Network
**Goal**: Users can offer and discover surplus food in their local community, coordinate pickups, and build reputation
**Depends on**: Phase 6 (backend infrastructure), Phase 0 (legal framework)
**Requirements**: SHARE-01, SHARE-02, SHARE-03, SHARE-04, SHARE-05, SHARE-06, SHARE-07, SHARE-08, SHARE-10
**Success Criteria** (what must be TRUE):
  1. User can mark inventory products for sharing with photo, quantity, expiration
  2. User can see available listings within their local area (geo-based search)
  3. User location is rounded to 1km for privacy (not exact address)
  4. User can request a listing (initiate contact with giver)
  5. User can confirm pickup completion (marks listing as fulfilled)
  6. User sees their own active and completed listings
  7. User can block other users (prevents contact/listing visibility)
  8. Legal disclaimer is shown and must be accepted before first listing
  9. Pickup coordination works through in-app messaging
**Plans**: TBD

Plans:
- [ ] 07-01: TBD during phase planning
- [ ] 07-02: TBD during phase planning
- [ ] 07-03: TBD during phase planning

### Phase 8: Analytics & Insights
**Goal**: Users see quantified impact of their waste reduction efforts through statistics and trends
**Depends on**: Phase 7 (all features generating data)
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04, STAT-05
**Success Criteria** (what must be TRUE):
  1. Dashboard shows number of products rescued from expiration
  2. Dashboard shows estimated cost savings (based on product prices)
  3. Dashboard shows number of items shared with community
  4. User can view monthly and yearly statistics trends
  5. Category breakdown shows which food types are most frequently wasted
  6. Statistics track long-term patterns (minimum 2 weeks of data)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD during phase planning

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Legal Foundation | 0/? | Not started | - |
| 1. Barcode Scanning | 0/? | Not started | - |
| 2. Receipt OCR | 0/? | Not started | - |
| 3. Extended Product Data | 0/? | Not started | - |
| 4. AI Cooking Assistant | 0/? | Not started | - |
| 5. Smart Notifications | 0/? | Not started | - |
| 6. Sharing Backend | 0/? | Not started | - |
| 7. Food Sharing Network | 0/? | Not started | - |
| 8. Analytics & Insights | 0/? | Not started | - |

---

*Roadmap created: 2026-02-07*
*Last updated: 2026-02-07*
