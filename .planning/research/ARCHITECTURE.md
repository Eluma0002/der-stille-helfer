# Architecture Research: Extending Offline-First Food Management App

**Domain:** Progressive Web App - Food Management with External Integrations
**Researched:** 2026-02-07
**Confidence:** HIGH

## Current v1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Products│  │ Recipes │  │ Shopping│  │  Notes  │        │
│  │  List   │  │  List   │  │  List   │  │  List   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                        DATA LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Dexie.js (IndexedDB Wrapper)              │    │
│  │  • personen  • produkte  • base_rezepte             │    │
│  │  • eigene_rezepte  • einkaufsliste  • notizen       │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                     OFFLINE LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Service  │  │ Workbox  │  │IndexedDB │                   │
│  │ Worker   │  │  Cache   │  │ Storage  │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

**Current State:**
- 100% offline-first: No backend, no external APIs
- HashRouter for offline navigation
- Multi-user via `person_id` foreign key (Elvis, Alberina)
- Bot system for recipe validation and suggestions
- Service Worker caches static assets + Google Fonts

## Recommended v2 Architecture: Adding External Integrations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Products│  │ Recipes │  │ Barcode │  │Community│  │   AI    │      │
│  │  List   │  │  List   │  │ Scanner │  │ Sharing │  │  Chef   │      │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘      │
│       │            │            │            │            │            │
├───────┴────────────┴────────────┴────────────┴────────────┴────────────┤
│                       INTEGRATION LAYER (NEW)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ API Gateway    │  │ Camera Service │  │ Geo Service    │            │
│  │ (Fetch Wrapper)│  │ (getUserMedia) │  │ (Navigator API)│            │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘            │
│          │                   │                   │                      │
│  ┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐            │
│  │ OpenFoodFacts  │  │ Barcode Decoder│  │ Location Cache │            │
│  │ Cache Layer    │  │   (QuaggaJS)   │  │  (Privacy)     │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
├─────────────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                Dexie.js (IndexedDB Wrapper)                      │   │
│  │  EXISTING TABLES:                                                │   │
│  │  • personen  • produkte  • base_rezepte  • eigene_rezepte        │   │
│  │  • einkaufsliste  • notizen  • favoriten  • varianten            │   │
│  │                                                                   │   │
│  │  NEW TABLES:                                                     │   │
│  │  • openfoodfacts_cache (barcode → product data)                  │   │
│  │  • sharing_listings (local + fetched community offers)           │   │
│  │  • ai_suggestions_cache (inventory hash → recipe suggestions)    │   │
│  │  • sync_queue (pending mutations for backend)                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                      OFFLINE + SYNC LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │Service Worker│  │Workbox Cache │  │Background Sync                  │
│  │              │  │              │  │                                  │
│  │• Static Cache│  │• API Responses│  │• Queue sharing │                │
│  │• App Shell   │  │  (stale-while│  │  mutations     │                │
│  │• Fonts       │  │  -revalidate)│  │• Retry failed  │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
├─────────────────────────────────────────────────────────────────────────┤
│                       BACKEND LAYER (NEW - OPTIONAL)                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Food Sharing Backend (Supabase or PocketBase)                 │     │
│  │  • sharing_listings table (PostgreSQL/SQLite)                  │     │
│  │  • auth (if community grows beyond 2 users)                    │     │
│  │  • real-time subscriptions (for listing updates)               │     │
│  │  • geohash-based location queries                              │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  AI API Gateway (Cloud LLM - Cost-Controlled)                  │     │
│  │  • Recipe suggestion endpoint                                  │     │
│  │  • Rate limiting (max N requests/day per user)                 │     │
│  │  • Fallback to rule-based KochBot when offline/limit reached   │     │
│  └────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Online/Offline | Implementation |
|-----------|----------------|----------------|----------------|
| **API Gateway** | Unified fetch wrapper with offline detection, queue mutations | Both | Custom wrapper around fetch + Workbox Background Sync |
| **OpenFoodFacts Cache Layer** | Fetch product data by barcode, cache in IndexedDB, TTL 90 days | Both | Stale-while-revalidate strategy |
| **Camera Service** | Request camera permissions, capture frames, decode barcodes | Offline | getUserMedia API + QuaggaJS |
| **Barcode Decoder** | Process camera frames, extract barcode value | Offline | QuaggaJS (1D) or ZXing (1D+2D) |
| **Geo Service** | Get coarse location, fuzz for privacy, cache coordinates | Both | Navigator.geolocation API with fuzzing |
| **Location Cache** | Store last known location, avoid repeated permission prompts | Offline | LocalStorage with timestamp |
| **Sharing Backend** | CRUD for food sharing listings, geo-based queries | Online only | Supabase (PostgreSQL + PostgREST) |
| **Sync Queue** | Queue create/update/delete operations when offline | Both | Dexie table + Service Worker Background Sync |
| **AI Gateway** | Send inventory to LLM, receive recipe suggestions, enforce rate limits | Online only | Cloud API (OpenAI/Claude) with caching |
| **AI Cache** | Cache suggestions by inventory hash, prevent duplicate API calls | Both | IndexedDB table with 7-day TTL |

## Recommended Architecture Patterns

### Pattern 1: Stale-While-Revalidate for External APIs

**What:** Return cached data immediately, fetch fresh data in background, update cache for next request.

**When to use:** OpenFoodFacts product lookups, AI recipe suggestions (after first fetch)

**Trade-offs:**
- PRO: Fast response, works offline after first load
- PRO: Reduces API calls (respects OpenFoodFacts rate limits)
- CON: User may see outdated data briefly

**Example:**
```typescript
// src/services/openfoodfacts.js
import { db } from '../db/schema.js';

async function fetchProductByBarcode(barcode) {
  // 1. Check cache first
  const cached = await db.openfoodfacts_cache
    .where('barcode').equals(barcode)
    .first();

  if (cached && Date.now() - cached.timestamp < 90 * 24 * 60 * 60 * 1000) {
    // Cache hit, return immediately
    console.log('OpenFoodFacts cache hit:', barcode);

    // Revalidate in background if > 7 days old
    if (Date.now() - cached.timestamp > 7 * 24 * 60 * 60 * 1000) {
      revalidateInBackground(barcode);
    }

    return cached.product;
  }

  // 2. Cache miss or expired, fetch from API
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const data = await response.json();

    if (data.status === 1) {
      // Store in cache
      await db.openfoodfacts_cache.put({
        barcode,
        product: data.product,
        timestamp: Date.now()
      });

      return data.product;
    }
  } catch (err) {
    // Network error - return stale cache if available
    if (cached) {
      console.warn('OpenFoodFacts offline, using stale cache');
      return cached.product;
    }
    throw new Error('Product not found and no cached data');
  }
}
```

### Pattern 2: Offline-First Mutations with Sync Queue

**What:** Write to IndexedDB immediately, queue sync to backend, retry on reconnection.

**When to use:** Food sharing listings (create/update/delete), user-generated content

**Trade-offs:**
- PRO: Instant UI feedback, no waiting for network
- PRO: Graceful degradation when offline
- CON: Temporary inconsistency between local and server state
- CON: Conflict resolution needed if multiple devices edit same data

**Example:**
```typescript
// src/services/sharing.js
import { db } from '../db/schema.js';

async function createSharingListing(listing) {
  const id = `listing-${Date.now()}-${Math.random()}`;

  // 1. Write to local IndexedDB immediately
  await db.sharing_listings.add({
    ...listing,
    id,
    person_id: currentUser.id,
    local_only: true,  // Flag as not yet synced
    created_at: Date.now()
  });

  // 2. Queue sync operation
  await db.sync_queue.add({
    id: `sync-${id}`,
    entity_type: 'sharing_listing',
    entity_id: id,
    operation: 'create',
    payload: listing,
    timestamp: Date.now(),
    synced: false
  });

  // 3. Trigger background sync (runs when online)
  if ('serviceWorker' in navigator && 'sync' in registration) {
    registration.sync.register('sync-sharing-listings');
  } else {
    // Fallback: attempt immediate sync
    attemptSync();
  }

  return id;
}

// Service Worker sync event handler
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-sharing-listings') {
    event.waitUntil(syncPendingListings());
  }
});

async function syncPendingListings() {
  const pending = await db.sync_queue
    .where('synced').equals(false)
    .and(item => item.entity_type === 'sharing_listing')
    .toArray();

  for (const item of pending) {
    try {
      // Send to backend
      await fetch('/api/sharing-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload)
      });

      // Mark as synced
      await db.sync_queue.update(item.id, { synced: true });

      // Update local record
      await db.sharing_listings.update(item.entity_id, {
        local_only: false
      });
    } catch (err) {
      console.error('Sync failed, will retry:', err);
      // Leave synced: false, will retry on next sync event
    }
  }
}
```

### Pattern 3: Camera Stream Processing Pipeline

**What:** Request camera, stream to canvas, decode frames continuously until barcode found.

**When to use:** Barcode scanning for product lookup

**Trade-offs:**
- PRO: No file upload required, instant feedback
- PRO: Works on all modern mobile browsers
- CON: Battery drain if scanning takes long
- CON: Performance varies by device camera quality

**Example:**
```typescript
// src/services/barcode-scanner.js
import Quagga from '@ericblade/quagga2';

async function startBarcodeScanner(onDetect, onError) {
  // 1. Check camera permission
  if (!navigator.mediaDevices?.getUserMedia) {
    return onError(new Error('Camera not supported'));
  }

  // 2. Initialize QuaggaJS
  Quagga.init({
    inputStream: {
      type: 'LiveStream',
      target: document.querySelector('#scanner-container'),
      constraints: {
        facingMode: 'environment',  // Back camera on mobile
        aspectRatio: { min: 1, max: 2 }
      }
    },
    decoder: {
      readers: ['ean_reader', 'ean_8_reader', 'code_128_reader'],
      multiple: false
    },
    locate: true  // Auto-detect barcode region
  }, (err) => {
    if (err) {
      return onError(err);
    }

    // 3. Start scanning
    Quagga.start();
  });

  // 4. Listen for detections
  Quagga.onDetected((result) => {
    if (result.codeResult.code) {
      // Found barcode - stop scanning
      Quagga.stop();
      onDetect(result.codeResult.code);
    }
  });
}

function stopBarcodeScanner() {
  Quagga.stop();
}
```

### Pattern 4: Privacy-Preserving Geolocation

**What:** Request coarse location, round to 1km precision, cache to avoid repeated prompts.

**When to use:** Community food sharing (match nearby users)

**Trade-offs:**
- PRO: Privacy-friendly (users within ~1km radius, not exact address)
- PRO: Reduces permission prompt fatigue
- CON: Less precise matching (may miss listings 1.1km away)

**Example:**
```typescript
// src/services/geolocation.js

const CACHE_KEY = 'last_known_location';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const PRECISION_KM = 1; // Round to nearest 1km

async function getCoarseLocation() {
  // 1. Check cache first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { lat, lng, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return { lat, lng };
    }
  }

  // 2. Request location with low accuracy for privacy
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 3. Fuzz location to 1km grid
        const lat = roundToGrid(position.coords.latitude, PRECISION_KM);
        const lng = roundToGrid(position.coords.longitude, PRECISION_KM);

        // 4. Cache for 1 hour
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          lat, lng, timestamp: Date.now()
        }));

        resolve({ lat, lng });
      },
      reject,
      {
        enableHighAccuracy: false, // Faster, more privacy
        timeout: 10000,
        maximumAge: CACHE_DURATION
      }
    );
  });
}

function roundToGrid(coordinate, precisionKm) {
  // 1 degree ≈ 111km, so 1km ≈ 0.009 degrees
  const gridSize = precisionKm / 111;
  return Math.round(coordinate / gridSize) * gridSize;
}

// Example: 48.1234567 → 48.12 (rounds to 1km grid)
```

### Pattern 5: Rate-Limited AI with Local Fallback

**What:** Cloud LLM for AI suggestions, cache aggressively, fall back to rule-based bot when offline or quota exceeded.

**When to use:** AI cooking suggestions based on inventory

**Trade-offs:**
- PRO: Best of both worlds (smart AI when available, functional when offline)
- PRO: Cost control via caching and rate limits
- CON: Inconsistent UX (AI vs rule-based may give different suggestions)

**Example:**
```typescript
// src/services/ai-chef.js
import { db } from '../db/schema.js';
import { KochBot } from '../bots/KochBot.js';

const MAX_REQUESTS_PER_DAY = 10;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

async function getSuggestions(inventory) {
  // 1. Generate inventory hash
  const inventoryHash = hashInventory(inventory);

  // 2. Check cache
  const cached = await db.ai_suggestions_cache
    .where('inventory_hash').equals(inventoryHash)
    .first();

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { suggestions: cached.suggestions, source: 'cache' };
  }

  // 3. Check rate limit
  const today = new Date().setHours(0, 0, 0, 0);
  const requestsToday = await db.ai_suggestions_cache
    .where('timestamp').above(today)
    .count();

  if (requestsToday >= MAX_REQUESTS_PER_DAY) {
    console.warn('AI quota exceeded, falling back to KochBot');
    return getFallbackSuggestions(inventory);
  }

  // 4. Try AI API
  try {
    const response = await fetch('/api/ai/suggest-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory })
    });

    const { suggestions } = await response.json();

    // 5. Cache result
    await db.ai_suggestions_cache.add({
      inventory_hash: inventoryHash,
      suggestions,
      timestamp: Date.now()
    });

    return { suggestions, source: 'ai' };
  } catch (err) {
    // Network error or API error - fall back
    console.error('AI API failed:', err);
    return getFallbackSuggestions(inventory);
  }
}

function getFallbackSuggestions(inventory) {
  // Use existing KochBot rule-based logic
  const bot = new KochBot();
  const suggestions = bot.suggestRecipes(inventory);
  return { suggestions, source: 'bot' };
}

function hashInventory(inventory) {
  // Simple hash: sort items and join
  const sorted = inventory.map(i => i.name).sort().join(',');
  return btoa(sorted).substring(0, 32);
}
```

## Data Flow Diagrams

### Flow 1: Barcode Scan → Product Lookup

```
[User opens scanner]
    ↓
[Request camera permission] ──(denied)──> [Error: Camera required]
    ↓ (granted)
[Start camera stream]
    ↓
[QuaggaJS processes frames] ──(loop)──> [Draw overlay, detect barcode]
    ↓ (barcode found)
[Stop camera, extract code]
    ↓
[Check OpenFoodFacts cache in IndexedDB]
    ↓ (cache hit)
[Display product info immediately]
    ↓
[Revalidate in background if > 7 days old]
    ↓ (cache miss)
[Fetch from OpenFoodFacts API]
    ↓ (success)
[Store in cache, display product]
    ↓ (error)
[Show "Product not found" or use stale cache]
```

### Flow 2: Food Sharing Listing Creation

```
[User creates sharing listing]
    ↓
[Get coarse location (cached or GPS)]
    ↓
[Write to IndexedDB immediately]
    ↓
[Update UI (listing appears in local list)]
    ↓
[Add to sync_queue table]
    ↓
[Check if online]
    ↓ (online)
[POST to Supabase backend]
    ↓ (success)
[Mark sync_queue.synced = true]
[Update listing.local_only = false]
    ↓ (offline)
[Register Service Worker background sync]
    ↓
[When online, Service Worker triggers sync]
    ↓
[Retry POST to backend]
```

### Flow 3: AI Recipe Suggestions

```
[User requests AI suggestions]
    ↓
[Generate inventory hash from current products]
    ↓
[Check ai_suggestions_cache]
    ↓ (cache hit, < 7 days old)
[Return cached suggestions]
    ↓ (cache miss)
[Check daily rate limit]
    ↓ (quota exceeded)
[Fall back to KochBot rule-based suggestions]
    ↓ (quota OK)
[POST inventory to cloud LLM API]
    ↓ (success)
[Cache suggestions with timestamp]
[Return AI suggestions]
    ↓ (API error or offline)
[Fall back to KochBot rule-based suggestions]
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Blocking UI on Network Requests

**What people do:** Show loading spinner while waiting for API response, disable interactions.

**Why it's wrong:** Violates offline-first principle. App becomes unusable when slow or offline.

**Do this instead:** Write to IndexedDB first (instant UI feedback), sync to backend in background. Show "syncing" indicator non-blocking.

**Example:**
```typescript
// BAD: Blocks UI
async function createListing(data) {
  setLoading(true); // Disables UI
  await fetch('/api/listings', { method: 'POST', body: data });
  setLoading(false);
}

// GOOD: Offline-first
async function createListing(data) {
  // Instant local write
  await db.listings.add({ ...data, local_only: true });
  // Background sync (non-blocking)
  queueSync('create', 'listings', data);
}
```

### Anti-Pattern 2: Duplicate Caching Logic in Multiple Places

**What people do:** Copy-paste cache-check code in every API wrapper function.

**Why it's wrong:** Maintenance nightmare. Inconsistent TTL, no central cache invalidation.

**Do this instead:** Create unified CacheLayer service with consistent TTL and invalidation.

**Example:**
```typescript
// BAD: Scattered caching
async function fetchProduct(id) {
  const cached = localStorage.getItem(`product-${id}`);
  if (cached) return JSON.parse(cached);
  // ... fetch and cache
}

async function fetchRecipe(id) {
  const cached = sessionStorage.getItem(`recipe-${id}`);
  if (cached) return JSON.parse(cached);
  // ... different caching logic!
}

// GOOD: Unified cache layer
class CacheLayer {
  constructor(db, ttl) {
    this.db = db;
    this.ttl = ttl;
  }

  async get(key) {
    const cached = await this.db.cache.where('key').equals(key).first();
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.value;
    }
    return null;
  }

  async set(key, value) {
    await this.db.cache.put({ key, value, timestamp: Date.now() });
  }
}
```

### Anti-Pattern 3: Storing Precise GPS Coordinates

**What people do:** Store exact latitude/longitude from geolocation API (e.g., 48.1234567, 11.5678901).

**Why it's wrong:** Privacy risk. Exposes user's exact address. GDPR/privacy law implications.

**Do this instead:** Round to grid (1km precision) or use geohash. Enough for "nearby" matching, not exact address.

**Example:**
```typescript
// BAD: Exposes exact location
const location = {
  lat: position.coords.latitude,  // 48.1234567
  lng: position.coords.longitude  // 11.5678901
};

// GOOD: Privacy-preserving
const location = {
  lat: Math.round(position.coords.latitude * 100) / 100,  // 48.12
  lng: Math.round(position.coords.longitude * 100) / 100  // 11.57
};
// Now users can match within ~1km, not exact address
```

### Anti-Pattern 4: Loading Entire External Library for One Feature

**What people do:** Import entire ZXing library (500KB) just to decode EAN-13 barcodes.

**Why it's wrong:** Bloats bundle size. Slow download on mobile networks.

**Do this instead:** Use lightweight library (QuaggaJS for 1D barcodes only) or lazy-load full library when needed.

**Example:**
```typescript
// BAD: Loads 500KB for basic barcodes
import { BrowserMultiFormatReader } from '@zxing/library'; // Full 2D support

// GOOD: Loads 80KB for 1D barcodes
import Quagga from '@ericblade/quagga2'; // 1D only

// BETTER: Lazy load if 2D needed later
async function scan2DBarcode() {
  const ZXing = await import('@zxing/library');
  // Use ZXing for QR/DataMatrix
}
```

### Anti-Pattern 5: Trusting External API Data Without Validation

**What people do:** Directly display OpenFoodFacts data, assuming it's always correct and safe.

**Why it's wrong:** External APIs can have missing fields, malformed data, or XSS risks.

**Do this instead:** Validate and sanitize external data before storing/displaying.

**Example:**
```typescript
// BAD: Trusts external data blindly
const product = await fetchFromOpenFoodFacts(barcode);
db.products.add({
  name: product.product_name,  // Could be undefined!
  ingredients: product.ingredients_text  // Could contain <script>!
});

// GOOD: Validates and sanitizes
const product = await fetchFromOpenFoodFacts(barcode);
db.products.add({
  name: product.product_name || 'Unknown Product',
  ingredients: sanitizeHTML(product.ingredients_text || ''),
  allergens: Array.isArray(product.allergens_tags)
    ? product.allergens_tags
    : []
});
```

## Integration Points

### External Services Integration Matrix

| Service | Integration Pattern | Caching Strategy | Offline Behavior | Rate Limits |
|---------|---------------------|------------------|------------------|-------------|
| **OpenFoodFacts API** | REST (fetch) | Stale-while-revalidate, 90-day TTL | Return cached data | ~30 req/min per IP (respect with cache) |
| **Cloud LLM (AI Chef)** | REST (fetch) | Aggressive cache (7 days by inventory hash) | Fall back to KochBot | 10 req/day per user (budget) |
| **Supabase Backend** | PostgREST + real-time subscriptions | Network-first for reads, offline-queue for writes | Queue mutations locally | Depends on plan (start with free tier) |
| **Camera API** | getUserMedia (native) | N/A (live stream) | Works offline | N/A (local hardware) |
| **Geolocation API** | Navigator.geolocation (native) | 1-hour cache in LocalStorage | Use last cached location | N/A (local sensor) |

### Internal Boundaries Communication

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Pages ↔ Database** | Direct Dexie queries + hooks | Existing pattern via dexie-react-hooks, no change |
| **Pages ↔ API Services** | Async function calls | New service layer (openfoodfacts.js, sharing.js, ai-chef.js) |
| **Service Worker ↔ IndexedDB** | Direct Dexie access | SW can read/write cache tables for background sync |
| **Bots ↔ API Services** | Function calls | KochBot can call AI service, with fallback logic built-in |
| **Camera Service ↔ Pages** | Callback pattern | onDetect(barcode), onError(err) |

## Scaling Considerations

| Scale | Architecture Adjustments | Implementation Notes |
|-------|--------------------------|---------------------|
| **2 users (current)** | No backend needed for core features. OpenFoodFacts cache + rule-based KochBot sufficient. | Keep v1 architecture for inventory/recipes. Add barcode scanning purely client-side. |
| **2-50 users (family/friends)** | Add lightweight backend (PocketBase) for food sharing. Real-time sync not critical. | PocketBase single binary, easy self-hosting. SQLite sufficient for < 50 users. Polling every 30s for new listings. |
| **50-10K users (local community)** | Upgrade to Supabase (PostgreSQL). Add real-time subscriptions for instant listing updates. Geohash indexes for location queries. | PostgreSQL scales well. PostgREST auto-generates API. Add CDN (Cloudflare) for static assets. AI rate limit becomes critical (consider local LLM). |
| **10K+ users (regional/national)** | Horizontal scaling: Multiple Supabase instances by region. Consider P2P replication (Dexie Cloud or RxDB) to reduce server load. Edge caching for OpenFoodFacts. | At this scale, reconsider P2P architecture (WebRTC data channels) to reduce backend costs. Local-first sync with occasional reconciliation. |

### Scaling Priorities (What Breaks First)

1. **First bottleneck: AI API costs** (at ~100 active users with 10 req/day = 1000 req/day × $0.01 = $10/day = $300/month)
   - **Fix:** Aggressive caching (7-day TTL), recommend local LLM (Ollama), or reduce quota to 3 req/day

2. **Second bottleneck: Backend database connections** (at ~1000 concurrent users, Supabase free tier limits 60 connections)
   - **Fix:** Connection pooling, upgrade to paid tier, or implement read replicas

3. **Third bottleneck: Real-time subscription costs** (at ~5000 concurrent users, Supabase charges for concurrent connections)
   - **Fix:** Switch to polling for non-critical updates, or implement P2P sync to offload server

## Build Order Recommendations

### Phase 1: Barcode Scanning (No Backend Required)
**Why first:** Fully offline, no dependencies, high user value.

**Components:**
1. Camera Service (getUserMedia wrapper)
2. Barcode Decoder (QuaggaJS integration)
3. OpenFoodFacts Cache Layer (IndexedDB table)
4. OpenFoodFacts API Wrapper (fetch + stale-while-revalidate)
5. Barcode Scanner UI (new page)

**Dependencies:** None (builds on existing v1 architecture)

**Testing:** Works 100% offline after first product lookup.

---

### Phase 2: AI Cooking Suggestions (Requires Cloud API)
**Why second:** Enhances existing inventory feature, validates AI integration pattern before food sharing.

**Components:**
1. AI Cache Layer (IndexedDB table)
2. AI API Gateway (fetch wrapper with rate limiting)
3. Inventory Hash Generator (for cache keys)
4. KochBot Fallback Logic (when offline/quota exceeded)
5. AI Suggestions UI (button in ProdukteListe)

**Dependencies:** OpenFoodFacts cache pattern (reuse from Phase 1)

**Testing:** Gracefully degrades to KochBot when offline or quota exceeded.

---

### Phase 3: Food Sharing Network (Requires Backend + Geolocation)
**Why third:** Most complex, requires backend architecture decision.

**Components:**
1. Geolocation Service (Navigator API + fuzzing)
2. Location Cache (LocalStorage)
3. Backend Choice (Supabase vs PocketBase)
4. Sharing Listings CRUD (API wrapper)
5. Sync Queue (IndexedDB table + Service Worker)
6. Food Sharing UI (new page: browse/create/claim listings)

**Dependencies:**
- Sync Queue pattern (similar to Phase 2 AI cache)
- Geolocation pattern (new, test privacy implications)

**Testing:** Create listing offline, verify sync when back online. Test location fuzzing (1km grid).

---

### Dependency Graph

```
Phase 1: Barcode Scanning
  ├── Camera Service (new)
  ├── Barcode Decoder (new)
  ├── OpenFoodFacts Cache (new pattern - reusable)
  └── No backend required ✓

Phase 2: AI Suggestions
  ├── Reuses: Cache pattern from Phase 1
  ├── AI API Gateway (new)
  ├── Rate Limiting (new)
  └── Fallback to KochBot (extends existing bot)

Phase 3: Food Sharing
  ├── Reuses: Cache pattern from Phase 1
  ├── Reuses: Sync Queue pattern (similar to Phase 2)
  ├── Geolocation Service (new)
  ├── Backend (new - biggest decision)
  └── Real-time subscriptions (optional, can start with polling)
```

**Critical Decision Points:**
- **Before Phase 2:** Choose cloud LLM provider (OpenAI vs Anthropic vs local Ollama)
- **Before Phase 3:** Choose backend (Supabase vs PocketBase vs custom)
- **Before Phase 3:** Decide P2P vs client-server (affects all Phase 3 architecture)

## Backend vs P2P Decision Matrix

### Option A: Client-Server Backend (Supabase/PocketBase)

**Strengths:**
- Simpler to implement (REST API + SQL)
- Built-in authentication and authorization
- Easier to moderate content (admin dashboard)
- Reliable data consistency
- Proven scaling path (PostgreSQL)

**Weaknesses:**
- Single point of failure (backend downtime = no sharing)
- Hosting costs (scales with users)
- Privacy concerns (listings stored on third-party server)
- Latency (round-trip to server)

**Best for:**
- Community with > 50 users (needs moderation)
- Budget allows $5-20/month hosting
- Users expect instant updates (real-time subscriptions)

**Recommendation:** Start with **PocketBase** (free, self-hosted, single binary) for 2-50 users, upgrade to **Supabase** if community grows > 50 users.

---

### Option B: Peer-to-Peer (WebRTC + DHT)

**Strengths:**
- No hosting costs (no backend server)
- Maximum privacy (data stays on devices)
- Instant local sync (no round-trip)
- Resilient to server outages

**Weaknesses:**
- Complex to implement (WebRTC signaling, NAT traversal)
- Discovery problem (how to find nearby peers?)
- No central moderation (spam/abuse harder to prevent)
- Requires at least one peer online to sync
- Battery drain (background sync on mobile)

**Best for:**
- Privacy-first users (data never leaves devices)
- Small communities (< 20 users who trust each other)
- No budget for hosting

**Recommendation:** **Only if privacy is core value** and users accept trade-offs (no moderation, discovery limitations). Use **RxDB with WebRTC replication** or **Gun.js** for P2P sync.

---

### Hybrid Option C: Local-First with Optional Cloud Sync

**Strengths:**
- Best of both worlds (works offline, syncs when online)
- Users own their data (IndexedDB is source of truth)
- Can choose to share with backend or keep local-only
- Graceful degradation

**Weaknesses:**
- Most complex to implement
- Conflict resolution needed
- Users may not understand "local vs synced" state

**Best for:**
- Long-term vision (start local, add backend later)
- Privacy-conscious users who still want community features

**Recommendation:** Use **Dexie Cloud** (if budget allows) or build custom sync layer with Supabase backend.

---

### Decision for This Project

**Recommended:** **Hybrid Option C (Local-First + Supabase)**

**Rationale:**
1. Existing v1 is 100% local-first (IndexedDB) - preserve this strength
2. Food sharing is optional feature - core app (inventory/recipes) must work offline
3. Start with 2 users (Elvis & Alberina) - can self-host PocketBase or use Supabase free tier
4. Privacy-focused (fuzzy geolocation, local data by default)
5. Future-proof: Can add P2P later if community wants it

**Implementation:**
- Core features (inventory, recipes, barcode scanning, AI suggestions) = 100% offline-first
- Food sharing = online-optional (create listings offline, sync when online)
- Backend: Start with **Supabase free tier** (500MB database, 2GB bandwidth/month, enough for 50 users)
- Sync: Background Sync API (queue mutations when offline)

## Recommended New Database Schema

```typescript
// src/db/schema.js - Add these tables to existing schema

db.version(3).stores({
  // ... existing tables ...

  // OpenFoodFacts cache (barcode scanning)
  openfoodfacts_cache: 'barcode, timestamp',

  // Food sharing listings (local + synced)
  sharing_listings: 'id, person_id, location_geohash, created_at, claimed_by, local_only',

  // AI suggestions cache (by inventory hash)
  ai_suggestions_cache: 'inventory_hash, timestamp',

  // Sync queue (offline mutations)
  sync_queue: 'id, entity_type, entity_id, timestamp, synced, retry_count'
});
```

**Table Details:**

| Table | Primary Key | Indexes | TTL | Purpose |
|-------|------------|---------|-----|---------|
| `openfoodfacts_cache` | barcode | timestamp | 90 days | Cache product data from OpenFoodFacts API |
| `sharing_listings` | id | person_id, location_geohash, created_at, claimed_by | None (user-controlled) | Food sharing offers (local + synced from backend) |
| `ai_suggestions_cache` | inventory_hash | timestamp | 7 days | Cache AI recipe suggestions to reduce API costs |
| `sync_queue` | id | entity_type, synced, timestamp | None (delete after sync) | Queue mutations for backend sync when offline |

## Sources

**Offline-First Architecture:**
- [MDN: Offline and background operation - Progressive web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Aalpha: Offline App Architecture: Building Offline-First Apps 2025](https://www.aalpha.net/blog/offline-app-architecture-building-offline-first-apps/)
- [LogRocket: Build a Next.js 16 PWA with true offline support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)

**IndexedDB Caching Strategies:**
- [DEV: PWA Offline Storage Strategies-IndexedDB and Cache API](https://dev.to/tianyaschool/pwa-offline-storage-strategies-indexeddb-and-cache-api-3570)
- [LogRocket: Offline-first frontend apps in 2025: IndexedDB and SQLite](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Medium: Building an Offline-First PWA Notes App with Next.js, IndexedDB, and Supabase](https://oluwadaprof.medium.com/building-an-offline-first-pwa-notes-app-with-next-js-indexeddb-and-supabase-f861aa3a06f9)

**Workbox Caching Patterns:**
- [Chrome Developers: Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies)
- [Chrome Developers: Caching resources during runtime](https://developer.chrome.com/docs/workbox/caching-resources-during-runtime)
- [Medium: Advanced Caching Strategies with Workbox](https://medium.com/animall-engineering/advanced-caching-strategies-with-workbox-beyond-stalewhilerevalidate-d000f1d27d0a)

**Barcode Scanning:**
- [Scanbot: Popular JavaScript Barcode Scanners: Open-Source Edition](https://scanbot.io/blog/popular-open-source-javascript-barcode-scanners/)
- [STRICH: Comparison with Open Source Solutions](https://strich.io/comparison-with-oss.html)
- [OpenReplay: Scanning Barcodes from a Web App](https://blog.openreplay.com/scanning-barcodes-from-a-web-app/)

**Backend Comparison:**
- [Leanware: Supabase vs PocketBase: Full Comparison](https://www.leanware.co/insights/supabase-vs-pocketbase)
- [SaasTour: Supabase vs Firebase vs PocketBase: Backend-as-a-Service Compared (2025)](https://saastour.com/supabase-vs-firebase-vs-pocketbase-backend-as-a-service-compared-2025/)

**WebRTC P2P Sync:**
- [RxDB: WebRTC P2P Replication](https://rxdb.info/replication-webrtc.html)
- [DEV: 7 WebRTC Trends Shaping Real-Time Communication in 2026](https://dev.to/alakkadshaw/7-webrtc-trends-shaping-real-time-communication-in-2026-1o07)
- [WebRTC.ventures: WebRTC Tech Stack Guide](https://webrtc.ventures/2026/01/webrtc-tech-stack-guide-architecture-for-scalable-real-time-applications/)

**AI/LLM Integration:**
- [DEV: Top 5 Local LLM Tools and Models in 2026](https://dev.to/lightningdev123/top-5-local-llm-tools-and-models-in-2026-1ch5)
- [Medium: Running Private AI Locally: Ollama vs LM Studio vs AnythingLLM 2026 Guide](https://medium.com/startup-insider-edge/running-private-ai-locally-ollama-lm-studio-anythingllm-2026-guide-9b4659955419)

**Geolocation Privacy:**
- [Privacy Patterns: Location Granularity](https://privacypatterns.org/patterns/Location-granularity)
- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [If-So: Geolocation API - Pros, cons and alternatives](https://www.if-so.com/geolocation-api-browser-location/)

**OpenFoodFacts API:**
- [OpenFoodFacts: API Documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/)
- [GitHub: OpenFoodFacts Server - Rate Limit Discussion](https://github.com/openfoodfacts/openfoodfacts-server/issues/8818)

**Dexie Cloud Sync:**
- [Dexie: Cloud - Offline-First Sync Without the Complexity](https://dexie.org/cloud)
- [Dexie: Cloud Best Practices](https://dexie.org/docs/cloud/best-practices)

---

*Architecture research for: Kühlschrank + Food-Sharing App*
*Researched: 2026-02-07*
*Confidence: HIGH*
