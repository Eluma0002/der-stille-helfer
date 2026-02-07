# Pitfalls Research: Kitchen Management + Food Sharing PWA

**Domain:** Kitchen management app with barcode scanning, food sharing network, and AI features
**Researched:** 2026-02-07
**Confidence:** HIGH

This research covers pitfalls specific to extending an offline-first PWA with camera/barcode, external APIs, geolocation, and multi-user features.

---

## Critical Pitfalls

### Pitfall 1: iOS Camera Permissions Revoked on Navigation (Hash Routing)

**What goes wrong:**
iOS Safari in PWA standalone mode revokes camera permissions whenever the URL hash changes during single-page app navigation. Users must re-grant camera access on every route change, breaking the barcode scanning workflow.

**Why it happens:**
WebKit bug [#215884](https://bugs.webkit.org/show_bug.cgi?id=215884) treats hash changes as new page contexts in standalone mode, triggering permission revocation. This affects React Router, Vue Router, and other SPA frameworks using hash-based routing.

**How to avoid:**
1. **Use History API routing** instead of hash routing (`createBrowserRouter` in React Router, `mode: 'history'` in Vue Router)
2. **Persistent camera component**: Keep video stream component mounted across routes, use CSS visibility instead of conditional rendering
3. **Dedicated camera route**: Navigate to a single `/scan` route for all barcode operations, avoid sub-routes
4. **Test on actual iOS devices**: Chrome DevTools iOS simulation doesn't reproduce this issue

**Warning signs:**
- Users report "Allow camera access again?" on every navigation
- Works fine on Android/Chrome but broken on iOS Safari
- Camera stream stops when navigating between pages
- `getUserMedia()` requires re-permission after hash change

**Phase to address:**
Phase 1 (Barcode scanning foundation) - Must choose correct routing strategy before implementing navigation patterns.

**Sources:**
- [WebKit Bug #215884](https://bugs.webkit.org/show_bug.cgi?id=215884)
- [Scandit FAQ - iOS Permission Issues](https://support.scandit.com/hc/en-us/articles/360008443011-Why-does-iOS-keep-asking-for-camera-permissions)
- [Apple Developer Forums - Camera Access in PWA](https://discussions.apple.com/thread/256081579)

---

### Pitfall 2: OpenFoodFacts API Rate Limits Kill Search-as-You-Type

**What goes wrong:**
OpenFoodFacts enforces strict rate limits: 10 requests/minute for search queries. A user typing "ice cream" triggers 9+ API calls (one per keystroke), immediately hitting the limit and getting IP-banned. Search appears broken for all users on that network.

**Why it happens:**
Developers implement real-time search without debouncing, assuming generous API limits like commercial services. OpenFoodFacts is a nonprofit with limited infrastructure, explicitly discouraging search-as-you-type in their documentation.

**How to avoid:**
1. **Aggressive debouncing**: 800ms minimum delay before search API calls
2. **Minimum query length**: Require 3+ characters before searching
3. **Local-first barcode lookup**: Cache scanned products in IndexedDB, check local first
4. **Bulk data download**: For common products (top 10k items), download CSV/JSONL once, query locally
5. **Search from cache**: After first search, filter cached results client-side for subsequent queries
6. **User-agent header**: Include app name + email so OpenFoodFacts can contact you before banning

**Warning signs:**
- Search suddenly stops working for all users
- Network requests return 429 (Too Many Requests) or 403 (Forbidden)
- Users complain "nothing happens when I type"
- Development works fine but production gets banned

**Phase to address:**
Phase 2 (OpenFoodFacts integration) - Implement caching + debouncing from day one. Phase 3 (Offline fallback) - Add bulk data download for common products.

**Rate limits reference:**
- Product queries: 100 req/min
- Search queries: 10 req/min (VERY low)
- Facet queries: 2 req/min

**Sources:**
- [OpenFoodFacts API Documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/)
- [GitHub Issue #8818 - Rate Limit Policy](https://github.com/openfoodfacts/openfoodfacts-server/issues/8818)
- [GitHub Issue #232 - Frontend Limit Implementation](https://github.com/maksimowiczm/FoodYou/issues/232)

---

### Pitfall 3: Food Sharing Without Liability Protection Framework

**What goes wrong:**
Users share spoiled or allergen-contaminated food, someone gets sick, and sues the platform. Without proper legal framework (terms of service, disclaimers, Good Samaritan Act compliance), platform faces six-figure liability claims.

**Why it happens:**
Teams treat food sharing as a technical feature without legal consultation. Assume "we're just connecting people" provides liability protection (it doesn't). Ignore food safety regulations that apply even to peer-to-peer sharing.

**How to avoid:**
1. **Explicit disclaimers**: State platform provides NO warranties about food safety, users share at own risk
2. **User agreements**: Require acceptance that platform is NOT liable for acts/omissions of other users
3. **Good Samaritan Act alignment**: If in US, structure as donations to align with Bill Emerson Act protections (applies to "apparently wholesome food" donated in good faith)
4. **Food safety guidelines**: Provide clear guidance (refrigeration, expiration dates, allergen disclosure) but don't enforce (enforcement = liability)
5. **Liability insurance**: Consult with insurance broker about product liability coverage
6. **Legal review**: Have attorney draft terms specific to food sharing, not generic template

**Warning signs:**
- No terms of service or disclaimer shown before food sharing
- Team discusses "verifying food safety" or "approving listings" (creates duty of care)
- No legal consultation before launch
- Assuming platform is just "neutral intermediary"

**Phase to address:**
Phase 0 (Pre-development) - Legal consultation BEFORE building food sharing features. Don't code first, consult later.

**Legal framework notes:**
- **Bill Emerson Good Samaritan Act** (US federal): Protects good-faith food donations except gross negligence/intentional misconduct
- **State laws**: All 50 states have additional protections, but vary widely
- **Platform liability**: Disclaimers help but don't eliminate all liability; "you can't shield yourself from your own inappropriate behavior"
- **GDPR/Privacy**: Food sharing involves personal data (location, health info via allergens), requires compliance

**Sources:**
- [USDA - Good Samaritan Act](https://www.usda.gov/about-usda/news/blog/good-samaritan-act-provides-liability-protection-food-donations)
- [Feeding America - Bill Emerson Act](https://www.feedingamerica.org/ways-to-give/corporate-and-foundations/product-partner/bill-emerson)
- [Food Corridor Terms & Conditions](https://www.thefoodcorridor.com/terms-conditions/) (example food sharing platform)
- [Termly - Disclaimer Examples](https://termly.io/resources/articles/disclaimer-examples/)

---

### Pitfall 4: Multi-User Data Leakage After Logout

**What goes wrong:**
User A logs out, User B logs in on same device. User B sees User A's kitchen inventory, meal plans, and dietary restrictions because IndexedDB wasn't cleared. Privacy violation and potential health risk (wrong allergen data).

**Why it happens:**
Offline-first PWAs cache everything in IndexedDB for performance. Developers assume each user has their own device (mobile app thinking), forget shared device scenarios (family tablets, public kiosks). IndexedDB persists across logout unless explicitly cleared.

**How to avoid:**
1. **Clear IndexedDB on logout**: Delete all object stores or specific user data on authentication change
2. **Namespace by user ID**: Prefix all IndexedDB keys with `person_id` (you already do this - good!)
3. **Verify namespace isolation**: Test logout/login with different users, confirm no data bleed
4. **Service worker cache**: Clear user-specific cached API responses (if any) on logout
5. **LocalStorage/SessionStorage**: Also clear non-IndexedDB storage
6. **Logout confirmation**: "This will clear all offline data. Continue?" warning

**Warning signs:**
- "My spouse's grocery list appeared in my app"
- Dietary restrictions from previous user still active
- QA testing finds data from previous test account
- Cache shows wrong `person_id` in network requests

**Phase to address:**
Phase 4 (Food sharing integration) - When adding authentication/multi-user features. Must audit all existing data storage for proper namespacing.

**IndexedDB multi-user gotchas:**
- Transaction isolation doesn't exist - concurrent tabs can corrupt data
- No cross-tab locking by default (use Web Locks API)
- Safari deletes IndexedDB after 7 days of inactivity (ITP)
- Different quotas per browser (Firefox counts across subdomains)

**Sources:**
- [The Pain of IndexedDB - GitHub Gist](https://gist.github.com/pesterhazy/4de96193af89a6dd5ce682ce2adff49a)
- [The PWA Data Trap - Medium](https://scottkuhl.medium.com/the-pwa-data-trap-5bd94d546348)
- [web.dev - Offline Data Storage](https://web.dev/learn/pwa/offline-data)

---

### Pitfall 5: Offline-First Architecture Breaks When Adding Online Features

**What goes wrong:**
App works perfectly offline. Team adds OpenFoodFacts integration, food sharing network, AI suggestions. Suddenly sync conflicts appear, stale data persists, users see "Failed to sync" errors. Offline mode that once worked reliably now feels broken.

**Why it happens:**
Offline-first design assumes device is source of truth. Adding online features creates multiple sources of truth (local IndexedDB vs. server database vs. external APIs) without conflict resolution strategy. Cache invalidation becomes exponentially harder.

**How to avoid:**
1. **Define data ownership**: Which data lives only locally? Which syncs? Which is read-only from API?
   - Kitchen inventory: Local-first, optional backup sync
   - OpenFoodFacts data: Read-only cache, never modified locally
   - Food sharing listings: Server-first, cached for performance
   - Dietary preferences: Local-first, sync as backup

2. **Last-Write-Wins with timestamps**: For sync conflicts, use server timestamp (not device clock) to determine winner

3. **Cache versioning**: Tag cached API responses with version/timestamp, invalidate after X hours
   ```javascript
   { data: {...}, cachedAt: '2026-02-07T10:30:00Z', ttl: 86400 }
   ```

4. **Optimistic UI with rollback**: Show change immediately, sync in background, revert if sync fails

5. **Sync status UI**: Show "Last synced 2 hours ago" so users understand what's local vs. synced

6. **Background Sync API**: Use for deferring network requests... BUT iOS doesn't support it (see Pitfall 6)

**Warning signs:**
- Users report seeing old data after refresh
- "My changes disappeared" complaints
- Conflicts between devices (if multi-device sync added later)
- API data never updates despite new server data
- Service worker caches grow unbounded

**Phase to address:**
Phase 2 (OpenFoodFacts integration) - First external API, establish caching patterns. Phase 3 (Offline fallbacks) - Formalize sync strategy before it becomes architectural debt.

**Caching strategies:**
- **Cache-First**: Good for static assets (CSS, JS), bad for API data (stale)
- **Network-First**: Good for API data, bad for offline (fails without network)
- **Stale-While-Revalidate**: Best hybrid - serve cache immediately, update in background
- **Cache with TTL**: Set expiration, force network fetch after expiry

**Sources:**
- [MDN - Offline and Background Operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Data Sync in PWAs - gtcsys](https://gtcsys.com/comprehensive-faqs-guide-data-synchronization-in-pwas-offline-first-strategies-and-conflict-resolution/)
- [Infinity Interactive - Taming PWA Cache](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)

---

### Pitfall 6: Background Sync Doesn't Work on iOS (No Workaround)

**What goes wrong:**
Team designs food sharing feature assuming Background Sync API works. User goes offline, posts food listing, expects it to upload when online. On iOS, it never syncs unless user manually reopens app. Feature appears broken.

**Why it happens:**
Background Sync API is not supported on iOS Safari/WebKit as of 2026. Apple restricts background execution to save battery. Developers test on Chrome (which supports it), assume it works everywhere.

**How to avoid:**
1. **Don't rely on Background Sync**: Assume it doesn't exist, design around it
2. **Foreground sync only**: Sync when app is open and has network
3. **Manual sync UI**: Provide "Sync Now" button, show pending changes count
4. **Queue visible**: Show "3 items waiting to upload" so user understands state
5. **Sync on app open**: Check for pending operations on app launch, sync then
6. **Optimistic UI**: Show item as posted immediately, mark as "pending sync"

**Warning signs:**
- Code uses `navigator.serviceWorker.sync.register()`
- Tests only run on Chrome/Android
- No manual sync mechanism
- Assumption that "it'll sync eventually"

**Phase to address:**
Phase 4 (Food sharing integration) - Don't design sync-dependent features without iOS testing.

**Current browser support (2026):**
- Chrome/Edge: Supported
- Firefox: Disabled by default
- Safari/iOS: NOT supported, no timeline for support

**Sources:**
- [MagicBell - PWA iOS Limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Apple Developer Forums - Background Sync](https://developer.apple.com/forums/thread/694805)
- [firt.dev - iOS PWA Compatibility](https://firt.dev/notes/pwa-ios/)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using hash routing (#/) instead of history API | Easier setup, no server config | Camera permissions break on iOS PWA | Never - iOS issues are showstoppers |
| No API rate limit handling | Faster development | IP bans, angry users, service disruption | Never - rate limits are documented |
| Generic disclaimer template from internet | Free, immediate | No legal protection for food sharing liability | Never - consult attorney |
| Assuming Background Sync works | Simpler architecture | Broken sync on iOS (50% of users) | Never - iOS doesn't support it |
| Not clearing IndexedDB on logout | User data persists (feature!) | Privacy violations, data leakage | Only for single-user apps |
| Cache-first for API responses | Fast offline experience | Stale data persists indefinitely | Only with explicit TTL + manual refresh |
| Skipping barcode test on real products | Emulator testing is faster | Poor lighting conditions cause failures | Only for initial prototype, must test real-world |
| Search-as-you-type without debounce | Better UX (instant feedback) | API rate limit bans | Only with local-only search |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenFoodFacts API | Treating it like commercial API (generous limits) | Aggressive caching, 10 req/min search limit, bulk downloads for common items |
| Camera permissions (iOS) | Testing only on Chrome/Android | Test on actual iOS device, use History API routing, persistent camera component |
| Geolocation for food sharing | Asking for location permission on app load | Defer until feature use ("Find nearby shared food"), show map preview before permission |
| IndexedDB (existing v1) | Assuming it works identically across browsers | Safari has unbounded WAL file growth, 7-day deletion, aggressive transaction commits |
| Service Worker updates | Expecting automatic updates | Safari caches aggressively; need manual "Check for updates" button |
| Barcode scanning libraries | Using first Google result | Test library with damaged barcodes, poor lighting, verify iOS Safari support |

**OpenFoodFacts specific gotchas:**
- Search rate limit (10/min) much lower than product lookup (100/min) - use product API for barcode scans
- No indication when rate limited - looks like network failure
- Staging environment (world.openfoodfacts.net) for testing before production
- User-Agent header required with contact email

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Caching all scanned products forever | Initial scans are fast | IndexedDB quota exceeded (Safari: 50MB-1GB varies), app stops working | After ~1000 products scanned |
| Loading entire food sharing network on map | Fast for 10 listings | Map lags, crashes on older devices | 100+ listings in viewport |
| No pagination for "My Inventory" | Simple implementation | Scroll lag, rendering issues | 200+ items in kitchen |
| Storing full-resolution barcode photos | Better quality for retry | Storage quota exhausted, backup fails | After ~50 photos |
| Client-side filtering of 10k OpenFoodFacts items | No API calls, instant search | Page freeze on low-end devices | When dataset exceeds 5k items |
| Not compressing sync payload | Simpler code | Mobile data costs, slow sync | After multi-user household data grows |

**IndexedDB quota reference (2026):**
- Chrome: 60% of available disk space
- Safari: 50MB-1GB (varies by available space)
- Firefox: 10% of available space (shared across subdomains!)
- Mobile Safari: More aggressive eviction after 7 days inactive

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing allergen data without encryption | Health information leak if device stolen | Consider Web Crypto API for sensitive dietary data |
| Sharing exact home location for food pickup | Stalking, burglary risk | Use approximate location (0.01° precision = ~1km), let users choose specific address in private message |
| No validation on food expiration dates | Users post expired food, legal liability | Warn (but don't block) if expiration < today, log for moderation |
| Accepting food photos from camera without sanitization | XSS via EXIF metadata, storage DOS | Strip EXIF data, limit file size (2MB max), validate MIME type |
| Exposing person_id in URLs/requests | User enumeration, data scraping | Use UUIDs not sequential IDs, require authentication for user data |
| Caching food sharing listings indefinitely | Stale "available" food already taken | TTL of 1 hour max, show "Last updated X min ago" |

**GDPR considerations for food sharing:**
- Geolocation = personal data under GDPR
- Dietary restrictions = potentially sensitive (health-related)
- Food sharing network = user contacts/social graph
- Must obtain explicit consent BEFORE collecting location
- Right to deletion: Users must be able to delete all shared listings + location history

**Sources:**
- [22Academy - Geolocation and GDPR](https://22academy.com/blog/geolocation-data-and-the-gdpr)
- [GeoPlugin - GDPR Location Data](https://www.geoplugin.com/resources/gdpr-location-data-how-to-collect-it-legally-and-avoid-fine/)

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Asking for camera permission on app load | Confusing, scary, likely denied | Ask when user taps "Scan barcode", explain why in UI |
| No fallback when barcode scan fails | User stuck, can't add item | Offer "Enter manually" button, search by name |
| Geolocation permission with no context | Privacy concerns, likely denied | Show map preview first, "Tap to find nearby shared food" |
| "Failed to sync" error with no action | User doesn't know what to do | "Failed to sync. [Retry Now] or continue offline" |
| No indication of offline mode | User thinks app is broken | Persistent "Offline" badge, explain what works offline |
| Expired food listings still visible | Wasted time contacting, trust issues | Auto-hide after expiration + 24h, show "Expired" badge |
| Barcode scan requires perfect lighting | Frustration, abandonment | Use library with auto-exposure, show "Try better lighting" hint after 3 failed scans |
| No feedback during slow API calls | Appears frozen | Skeleton loading states, "Searching OpenFoodFacts..." text |

**Camera permission UX best practices:**
1. **Defer permission request** until feature use
2. **Explain before asking**: "We need camera access to scan barcodes"
3. **Fallback always available**: Manual entry if permission denied
4. **Handle iOS re-prompts**: If permission revoked, show instructions to re-enable in Settings

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Barcode scanning:** Works on Chrome DevTools, but tested on actual iOS Safari in PWA mode (standalone)?
- [ ] **Barcode scanning:** Tested with damaged barcodes, wrinkled labels, poor lighting (not just pristine test barcodes)?
- [ ] **OpenFoodFacts integration:** Rate limit handling implemented (debounce, cache, error handling)?
- [ ] **OpenFoodFacts integration:** Offline fallback when API unavailable (cached products, manual entry)?
- [ ] **Food sharing:** Legal disclaimer + terms of service reviewed by attorney (not just template)?
- [ ] **Food sharing:** Allergen disclosure prominent and required (not just optional field)?
- [ ] **Geolocation:** Permission requested in context with explanation (not on app load)?
- [ ] **Geolocation privacy:** Using approximate location, not exact GPS coordinates (GDPR compliance)?
- [ ] **Multi-user:** IndexedDB cleared on logout, tested with multiple users on same device?
- [ ] **Multi-user:** Existing `person_id` isolation verified for all new features (food sharing, API cache)?
- [ ] **Offline-first:** Sync strategy defined for each data type (local-first, server-first, read-only)?
- [ ] **Offline-first:** Cache invalidation with TTL, not infinite caching (stale data prevention)?
- [ ] **iOS PWA:** Service worker updates manually testable ("Check for updates" button)?
- [ ] **iOS PWA:** Routing uses History API, not hash routing (camera permission persistence)?
- [ ] **Background Sync:** NOT relying on Background Sync API (iOS doesn't support it)?
- [ ] **Error handling:** User-facing messages for all failure modes (rate limited, offline, permission denied, barcode not found)?

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| IP banned by OpenFoodFacts | LOW | Email contact@openfoodfacts.org with explanation + app name, usually unbanned within 24h. Meanwhile, use staging server (world.openfoodfacts.net) |
| Camera permission denied on iOS | LOW | Show instructions: "Settings > Safari > Camera > Allow". Offer manual barcode entry as workaround. |
| IndexedDB quota exceeded | MEDIUM | Implement LRU cache eviction, delete oldest scanned products. Warn users before auto-deleting. Migration required. |
| User data leaked to wrong person | HIGH | Incident response: Notify affected users (GDPR requires within 72h), audit all data access, fix isolation bug, possibly legal consultation. |
| Stale cache showing old food listings | LOW | Add manual "Refresh" button, reduce cache TTL going forward. Educate users to refresh. |
| Hash routing breaks camera permissions | HIGH | Migrate to History API routing (requires code changes across app), test thoroughly. Potentially breaking change. |
| Background Sync assumed but doesn't work | MEDIUM | Add manual sync UI, queue system, "Pending upload" indicators. Redesign feature to not depend on background sync. |
| Food safety incident (someone gets sick) | VERY HIGH | Legal response: Consult attorney immediately, review liability insurance, cooperate with health authorities. Technical: Add reporting mechanism, improve food safety guidelines. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| iOS camera permissions revoked on navigation | Phase 1: Barcode foundation | Test on iOS device in standalone mode, navigate between routes while camera active |
| OpenFoodFacts rate limits | Phase 2: OpenFoodFacts integration | Load test: Type "ice cream" with 100ms delays, verify < 10 API calls/min |
| Multi-user data leakage | Phase 4: Food sharing (before adding auth) | QA: Login as User A, add items, logout, login as User B, verify nothing from A visible |
| Offline-first architecture breakdown | Phase 3: Offline fallbacks | Airplane mode test: All features work offline, sync resumes when online |
| Background Sync not supported iOS | Phase 4: Food sharing | iOS Safari test: Post offline, close app, reconnect - verify manual sync required |
| Food sharing liability | Phase 0: Legal consultation (pre-dev) | Attorney review of T&C, disclaimers before any food sharing code written |
| Geolocation privacy violations | Phase 4: Food sharing | GDPR audit: Permission requested with explanation, approximate location used, data deletable |
| Barcode scanning in poor conditions | Phase 1: Barcode foundation | Real-world test: Damaged barcodes, wrinkled labels, dim lighting, bright sunlight glare |

---

## Sources

**iOS Camera & PWA Issues:**
- [WebKit Bug #185448 - getUserMedia in Standalone](https://bugs.webkit.org/show_bug.cgi?id=185448)
- [WebKit Bug #215884 - Hash Change Permission Revocation](https://bugs.webkit.org/show_bug.cgi?id=215884)
- [Scandit - iOS Permission Issues](https://support.scandit.com/hc/en-us/articles/360008443011-Why-does-iOS-keep-asking-for-camera-permissions)
- [Apple Developer Forums - Camera Access in PWA](https://discussions.apple.com/thread/256081579)

**Barcode Scanning:**
- [Scandit - Barcode Scanning Challenges](https://www.scandit.com/resources/guides/barcode-scanning-challenges/)
- [Scandit - Performance Testing Guide 2026](https://www.scandit.com/resources/guides/how-to-measure-barcode-scanning-performance/)
- [Medium - Barcode Scanning in React PWA](https://cgarethc.medium.com/scanning-and-rendering-bar-codes-in-a-react-progressive-web-app-b96c9090047c)

**OpenFoodFacts API:**
- [OpenFoodFacts API Documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/)
- [GitHub Issue #8818 - Rate Limit Policy](https://github.com/openfoodfacts/openfoodfacts-server/issues/8818)
- [GitHub Issue #941 - Respect Rate Limits](https://github.com/openfoodfacts/openfoodfacts-dart/issues/941)

**Food Sharing Legal:**
- [USDA - Good Samaritan Act](https://www.usda.gov/about-usda/news/blog/good-samaritan-act-provides-liability-protection-food-donations)
- [Feeding America - Bill Emerson Act](https://www.feedingamerica.org/ways-to-give/corporate-and-foundations/product-partner/bill-emerson)
- [ReFED - Federal Liability Protection](https://policyfinder.refed.org/federal-policy/federal-liability-protection)
- [Termly - Disclaimer Examples](https://termly.io/resources/articles/disclaimer-examples/)

**Geolocation Privacy:**
- [22Academy - Geolocation and GDPR](https://22academy.com/blog/geolocation-data-and-the-gdpr)
- [GeoPlugin - GDPR Location Data](https://www.geoplugin.com/resources/gdpr-location-data-how-to-collect-it-legally-and-avoid-fine/)
- [Hexnode - Geolocation Compliance](https://www.hexnode.com/blogs/navigating-the-geolocation-and-data-protection-laws/)

**Offline-First & PWA Architecture:**
- [MDN - Offline and Background Operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [web.dev - Offline Data Storage](https://web.dev/learn/pwa/offline-data)
- [gtcsys - Data Sync in PWAs](https://gtcsys.com/comprehensive-faqs-guide-data-synchronization-in-pwas-offline-first-strategies-and-conflict-resolution/)
- [Infinity Interactive - Taming PWA Cache](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)

**IndexedDB Multi-User:**
- [GitHub Gist - IndexedDB Pain and Anguish](https://gist.github.com/pesterhazy/4de96193af89a6dd5ce682ce2adff49a)
- [Medium - The PWA Data Trap](https://scottkuhl.medium.com/the-pwa-data-trap-5bd94d546348)
- [LogRocket - Offline Storage for PWAs](https://blog.logrocket.com/offline-storage-for-pwas/)

**Background Sync iOS:**
- [MagicBell - PWA iOS Limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Apple Developer Forums - Background Sync](https://developer.apple.com/forums/thread/694805)
- [firt.dev - iOS PWA Compatibility](https://firt.dev/notes/pwa-ios/)

---

*Pitfalls research for: Kitchen Management + Food Sharing PWA Extension*
*Researched: 2026-02-07*
