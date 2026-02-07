# Stack Research: Kühlschrank-Inventar + Food-Sharing Extension

**Project:** Der Stille Helfer v2 - Food Inventory + Sharing Platform
**Researched:** 2026-02-07
**Confidence:** MEDIUM

## Context

This research focuses on NEW features being added to an existing React/Vite/Dexie PWA. The base stack (React 18.3, Vite 5.1, Dexie 4.0, HashRouter, PWA with Workbox) remains unchanged.

**New Features:**
1. Barcode scanning + OpenFoodFacts integration
2. Photo/OCR analysis (receipt scanning)
3. Geo-location and proximity matching
4. Food sharing network (community listings)

**Constraints:**
- Must work offline-first
- Privacy-focused (local data except sharing)
- Budget-conscious (avoid expensive APIs)
- German market focus

---

## Recommended Stack

### 1. Barcode Scanning

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **react-qr-barcode-scanner** | ^2.1.20 | Barcode + QR scanning | Active maintenance (updated monthly), TypeScript support, works on mobile/desktop, uses @zxing/library under the hood |
| **@zxing/library** | Latest | Barcode decoding engine | Industry standard, multi-format support (EAN, UPC, QR), free and open-source |
| **Browser getUserMedia API** | Native | Camera access | Native browser API, no dependencies, secure (HTTPS only) |

**Confidence: HIGH**

**Rationale:**
- Native Barcode Detection API is experimental and only works on Chromium (Chrome/Edge) on macOS/Android, not production-ready for German market (Firefox, Safari users excluded)
- react-qr-barcode-scanner is actively maintained (last update 1 month ago) vs html5-qrcode (abandoned, last update 3 years ago)
- ZXing is the de facto standard for barcode scanning, battle-tested across millions of apps
- Free and offline-capable, aligns with budget and privacy constraints

**Implementation pattern:**
```typescript
import BarcodeScannerComponent from "react-qr-barcode-scanner";

<BarcodeScannerComponent
  width={500}
  height={500}
  onUpdate={(err, result) => {
    if (result) {
      // Send barcode to OpenFoodFacts API
      fetchProductData(result.text);
    }
  }}
/>
```

### 2. OpenFoodFacts Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **OpenFoodFacts REST API** | v2 | Product database | Free, no auth required for reads, 2.8M products, German language support |
| **Fetch API** | Native | HTTP client | Native browser API, sufficient for simple REST calls |

**Confidence: HIGH**

**API Details:**
- **Base URL:** `https://world.openfoodfacts.org/api/v2`
- **Product lookup:** `GET /product/{barcode}.json`
- **Search:** `GET /cgi/search.pl?search_terms={query}&json=true`
- **Rate limiting:** Fair use policy, 1 API call = 1 real scan by user
- **Authentication:** None required for reads
- **Staging:** Use `https://world.openfoodfacts.net` for testing

**Rationale:**
- Free and open-source database, aligns with budget constraints
- No API key required, simplifies implementation
- 2.8M products with strong European coverage (German market)
- REST API is simple, no SDK dependency needed
- Community-driven, ethical data practices

**Best practices:**
1. Use staging environment during development
2. Cache responses in Dexie for offline access
3. Include User-Agent header: "Der Stille Helfer - Food Inventory App"
4. Respect rate limits (don't scrape, use daily exports for bulk data)
5. Filter by `product_name`, `nutrition_grades`, `image_url` to reduce payload

**Example request:**
```javascript
const barcode = "3017620422003"; // Nutella
const response = await fetch(
  `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
);
const data = await response.json();

if (data.status === 1) {
  // Product found
  const product = data.product;
  // Cache in Dexie for offline access
  db.products.put({
    barcode: barcode,
    name: product.product_name,
    image: product.image_url,
    nutriscore: product.nutrition_grades,
    cached_at: Date.now()
  });
}
```

### 3. Photo/OCR Analysis (Receipt Scanning)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Tesseract.js** | ^5.x | Client-side OCR | Free, runs in browser (WebAssembly), 100+ languages including German, no API costs |
| **Browser Camera API** | Native | Photo capture | Native, no dependencies |

**Confidence: MEDIUM**

**Rationale:**
- Tesseract.js is free and runs entirely client-side (privacy-focused, offline-capable)
- Supports German language OCR natively
- WebAssembly performance is acceptable for receipt scanning use case
- Budget-friendly (no per-scan costs unlike commercial OCR APIs)

**Alternatives considered but rejected:**
- Commercial OCR APIs (Taggun, Tabscanner, Mindee): 90-99% accuracy but cost €0.01-0.10 per scan, breaks budget constraint
- Google Vision API: Excellent accuracy but requires cloud API, breaks privacy constraint
- OpenCV.js: More complex, overkill for receipt scanning

**Limitations:**
- Tesseract.js accuracy ~85-90% for receipts (lower than commercial APIs)
- Requires good lighting and clear photos
- Post-processing needed to structure receipt data
- Performance: ~2-5 seconds per receipt on modern mobile devices

**Implementation strategy:**
1. Start with Tesseract.js for MVP (free, privacy-focused)
2. Improve accuracy with pre-processing (contrast enhancement, rotation correction)
3. Allow manual correction of OCR results
4. Consider commercial API upgrade only if user feedback demands higher accuracy

**Example usage:**
```javascript
import Tesseract from 'tesseract.js';

const { data: { text } } = await Tesseract.recognize(
  imageFile,
  'deu', // German language
  {
    logger: m => console.log(m) // Progress tracking
  }
);

// Parse text to extract products, prices
const lines = text.split('\n');
const products = parseReceiptLines(lines);
```

### 4. Geolocation & Proximity Matching

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Geolocation API** | Native | User location | Native browser API, free, works on all devices |
| **Haversine formula** | Custom | Distance calculation | Simple client-side distance calculation, no backend needed |

**Confidence: HIGH**

**Rationale:**
- Browser Geolocation API is standard, supported by all modern browsers
- HTTPS-only requirement already met (PWA requirement)
- User permission flow built into browser (privacy-compliant)
- Client-side distance calculation avoids backend complexity

**Limitations:**
- Geolocation does NOT work offline (requires GPS/WiFi/cellular)
- Must cache user location before going offline
- Accuracy varies: GPS (5-10m), WiFi (~50m), cellular (~1km)

**Implementation pattern:**
```javascript
// Get user location
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;

    // Cache in Dexie for offline use
    db.userProfile.put({
      id: 'current',
      lat: latitude,
      lng: longitude,
      updated_at: Date.now()
    });

    // Calculate distances to food sharing listings
    const nearby = calculateNearbyListings(latitude, longitude, listings);
  },
  (error) => {
    console.error('Geolocation error:', error);
  },
  {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 600000 // Cache for 10 minutes
  }
);

// Haversine distance calculation (client-side)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
```

### 5. Food Sharing Backend

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **PocketBase** | ^0.23.x | Backend for sharing listings | Self-hosted, single Go binary, SQLite backend, real-time subscriptions, built-in auth, minimal cost |
| **Alternative: Supabase** | Cloud/Self-hosted | PostgreSQL-based BaaS | Better for scale, but less privacy-focused (cloud-first) |

**Confidence: MEDIUM**

**Rationale for PocketBase:**
- Self-hosted = full data control (privacy-focused)
- Single Go binary = easy deployment, low resource requirements (~50MB RAM)
- Built-in features: REST API, real-time subscriptions, file storage, auth
- SQLite backend = simple, no separate database server needed
- Open-source, no vendor lock-in
- Free for self-hosting

**Sharing data model:**
```javascript
// PocketBase collections
collections: {
  food_listings: {
    user_id: string,
    title: string,
    description: string,
    category: string, // produce, dairy, packaged, etc.
    quantity: number,
    expires_at: datetime,
    lat: number,
    lng: number,
    location_radius: number, // Privacy: fuzzy location (e.g., 500m)
    status: string, // available, reserved, completed
    created_at: datetime,
    updated_at: datetime
  }
}
```

**Privacy considerations:**
- Store fuzzy location (500m radius) not exact address
- Only show listings to users within X km radius
- User can delete all their listings
- No personal data required (name, email optional)

**Alternative: Supabase**
- Better for scale (PostgreSQL, global CDN)
- More features (edge functions, auth providers)
- BUT: Cloud-first (less privacy control), more complex, potential costs at scale
- Weaker offline support compared to PocketBase's simplicity

**Recommendation:** Start with PocketBase for MVP. Migration path to Supabase exists if scale demands it.

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **workbox-strategies** | ^7.0.0 | PWA caching strategies | Already in stack, extend for OpenFoodFacts cache |
| **idb** | ^8.0.0 | IndexedDB wrapper | Optional, Dexie already provides this |
| **date-fns** | ^3.0.0 | Date manipulation | For expiry date calculations, German locale support |

---

## Installation

```bash
# Barcode scanning
npm install react-qr-barcode-scanner @zxing/library

# OCR
npm install tesseract.js

# Backend client (if using PocketBase)
npm install pocketbase

# Utilities
npm install date-fns
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| **Barcode Scanner** | react-qr-barcode-scanner | html5-qrcode | Abandoned (last update 3 years ago) |
| **Barcode Scanner** | react-qr-barcode-scanner | Native Barcode Detection API | Experimental, Chromium-only, excludes Firefox/Safari users |
| **Barcode Scanner** | react-qr-barcode-scanner | QuaggaJS | Original abandoned, Quagga2 fork in maintenance mode |
| **Barcode Scanner** | react-qr-barcode-scanner | Commercial (STRICH, Scandit) | Cost €99-500/month, breaks budget constraint |
| **OCR** | Tesseract.js | Commercial APIs (Taggun, Mindee) | €0.01-0.10 per scan, breaks budget constraint |
| **OCR** | Tesseract.js | Google Vision API | Requires cloud API, breaks privacy/offline constraint |
| **Backend** | PocketBase | Supabase | Cloud-first, less privacy control, Firebase-weak offline support |
| **Backend** | PocketBase | Appwrite | Larger resource footprint (Docker, multiple containers) |
| **Backend** | PocketBase | Firebase | Google lock-in, weaker offline for web, NoSQL complexity |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **html5-qrcode** | Abandoned (3 years no updates), maintenance mode | react-qr-barcode-scanner |
| **QuaggaJS (original)** | Abandoned, no longer maintained | Quagga2 (fork) or react-qr-barcode-scanner |
| **Native Barcode Detection API** | Experimental, Chromium-only (excludes 30%+ of EU users on Firefox) | react-qr-barcode-scanner with @zxing/library |
| **Commercial OCR APIs** | Breaks budget constraint (€0.01-0.10/scan = €100-1000/month for 10k users) | Tesseract.js + manual correction UI |
| **Firebase** | Weak offline-first for web PWAs, Google vendor lock-in | PocketBase or Supabase |
| **axios for simple REST** | Unnecessary dependency, Fetch API is native and sufficient | Native Fetch API |

---

## Stack Patterns by Use Case

**If budget allows commercial APIs later:**
- Replace Tesseract.js with Mindee or Taggun OCR API
- Upgrade to STRICH barcode scanner for challenging scenarios
- **When:** User feedback shows OCR/barcode accuracy is blocking adoption

**If scale exceeds PocketBase capacity:**
- Migrate from PocketBase (SQLite) to Supabase (PostgreSQL)
- Add CDN for food listing images
- Add Redis for real-time proximity matching
- **When:** >10k concurrent users or >100k listings

**If iOS Safari barcode issues emerge:**
- Fall back to @yudiel/react-qr-scanner (uses Barcode Detection API polyfill)
- Or use camera photo + ZXing image decode as fallback
- **When:** User reports from iOS Safari users

---

## Confidence Assessment

| Area | Confidence | Reasoning |
|------|-----------|-----------|
| **Barcode Scanning** | HIGH | react-qr-barcode-scanner actively maintained, ZXing battle-tested, clear alternatives exist |
| **OpenFoodFacts API** | HIGH | Official API docs, stable v2, no auth complexity, strong German product coverage |
| **Receipt OCR** | MEDIUM | Tesseract.js accuracy tradeoff (85-90% vs 95%+ commercial), but budget constraint forces this choice. Can upgrade later. |
| **Geolocation** | HIGH | Native browser API, well-documented, standard implementation |
| **Backend (PocketBase)** | MEDIUM | Good fit for MVP, but limited production case studies. Migration path to Supabase exists. Self-hosting adds DevOps complexity. |

**Overall Stack Confidence: MEDIUM**

**Key uncertainties:**
1. Tesseract.js accuracy for German receipts in production (needs user testing)
2. PocketBase scalability for food sharing network (unknown user growth)
3. Barcode scanner performance on low-end Android devices (needs device testing)

**Mitigation:**
1. Build manual correction UI for OCR results
2. Design PocketBase schema for easy migration to Supabase
3. Test barcode scanner on target device range before launch

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| react-qr-barcode-scanner ^2.1.20 | React ^18.0.0, @zxing/library ^0.21.0 | Works with existing React 18.3 |
| tesseract.js ^5.x | Webpack 5, Vite 5 | Requires WebAssembly support, works with Vite 5.1 |
| pocketbase ^0.23.x | Any HTTP client | REST API, framework-agnostic |
| @zxing/library ^0.21.0 | Browser with WebAssembly support | All modern browsers (2020+) |

---

## Sources

**Barcode Scanning:**
- [Barcode Detection API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API) - Browser API status (MEDIUM confidence)
- [GitHub: georapbox/barcode-scanner](https://github.com/georapbox/barcode-scanner) - PWA example (MEDIUM confidence)
- [STRICH Barcode Scanning](https://strich.io/) - Commercial alternative comparison (MEDIUM confidence)
- [QuaggaJS](https://serratus.github.io/quaggaJS/) - Alternative library research (HIGH confidence)
- [GitHub: ericblade/quagga2](https://github.com/ericblade/quagga2) - Quagga2 fork status (HIGH confidence)
- [ZXing TypeScript Demo](https://zxing-js.github.io/library/) - ZXing library documentation (HIGH confidence)
- [react-qr-barcode-scanner - npm](https://www.npmjs.com/package/react-qr-barcode-scanner) - Package details and versions (HIGH confidence)
- [html5-qrcode maintenance status](https://github.com/mebjas/html5-qrcode) - Abandonment verification (HIGH confidence)

**OpenFoodFacts:**
- [OpenFoodFacts API Documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/) - Official API reference (HIGH confidence)
- [OpenFoodFacts API Tutorial](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/) - Best practices guide (HIGH confidence)

**OCR/Receipt Scanning:**
- [Tesseract.js](https://tesseract.projectnaptha.com/) - Official library site (HIGH confidence)
- [Klippa: Best Receipt OCR Software for 2026](https://www.klippa.com/en/ocr/financial-documents/receipts/) - Commercial alternatives comparison (MEDIUM confidence)
- [Tesseract OCR: What Is It and Why Choose It in 2026?](https://www.klippa.com/en/blog/information/tesseract-ocr/) - Tesseract evaluation (MEDIUM confidence)

**Geolocation:**
- [Geolocation API - PWA Demo](https://progressier.com/pwa-capabilities/geolocation) - PWA integration patterns (MEDIUM confidence)
- [What PWA Can Do Today - Geolocation](https://whatpwacando.today/geolocation/) - Browser support matrix (MEDIUM confidence)
- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation) - Official specification (HIGH confidence)
- [MediaDevices: getUserMedia() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) - Camera API reference (HIGH confidence)

**Food Sharing Platform:**
- [GitHub: sohel5G/community-food-sharing](https://github.com/sohel5G/community-food-sharing) - Architecture reference (LOW confidence)
- [A Web-Based Food Donation Platform](https://ijarcce.com/wp-content/uploads/2026/01/IJARCCE.2026.151148-a.pdf) - Academic research (LOW confidence)

**Backend:**
- [Appwrite vs PocketBase Comparison](https://openalternative.co/compare/appwrite/vs/pocketbase) - Feature comparison (MEDIUM confidence)
- [Supabase vs Firebase Comparison](https://supabase.com/alternatives/supabase-vs-firebase) - Offline-first evaluation (HIGH confidence)
- [Firebase vs Supabase 2026 Guide](https://www.clickittech.com/software-development/supabase-vs-firebase/) - Detailed comparison (MEDIUM confidence)

**Self-Hosting:**
- [Foodies: Open-Source Food Sharing App](https://medevel.com/foodies/) - Self-hosted reference architecture (MEDIUM confidence)
- [Grocy - ERP beyond your fridge](https://grocy.info) - Existing pantry management solution (HIGH confidence)
- [Mealie Recipe Manager](https://github.com/mealie-recipes/mealie) - Self-hosted food app reference (MEDIUM confidence)

---

**Stack research for:** Kühlschrank-Inventar + Food-Sharing App (Der Stille Helfer v2)
**Researched:** 2026-02-07
**Researcher:** GSD Project Researcher Agent
