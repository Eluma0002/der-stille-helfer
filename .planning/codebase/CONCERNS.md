# Codebase Concerns

**Analysis Date:** 2026-01-24

## Tech Debt

**Hardcoded Substitutions (Dietary Restrictions):**
- Issue: Elvis's dietary restrictions (no Weizen/Milch) are hardcoded across multiple files rather than centralized
- Files: `src/bots/KochBot.js` (line 2), `src/bots/substitutions.js`, `src/db/schema.js` (line 2)
- Impact: Difficult to update restrictions or add new users with custom dietary needs; code is tightly coupled
- Fix approach: Create a centralized configuration system or load from database; implement user-specific restriction profiles

**Inefficient ID Generation:**
- Issue: Using `Date.now().toString()` for primary keys can cause collision risk with rapid additions
- Files: `src/pages/ProdukteListe.jsx` (line 26), `src/pages/NotizenListe.jsx` (line 45), `src/pages/RezeptDetails.jsx` (line 74)
- Impact: Race conditions when multiple items added in quick succession; duplicate key errors possible
- Fix approach: Use `crypto.randomUUID()` or UUID v4 library for guaranteed uniqueness

**Missing Constants File:**
- Issue: `src/constants.js` exists but lacks proper documentation and contains hardcoded German UI text
- Files: `src/constants.js` (lines 10-13)
- Impact: String encoding issues with umlauts (Kühlschrank rendered as Kuhlschrank), maintenance burden
- Fix approach: Integrate with `src/strings/de.js` for centralized i18n; consider using enum pattern for category IDs

**Database Schema Evolution Risk:**
- Issue: Only 2 schema versions defined with minimal migration strategy
- Files: `src/db/schema.js` (lines 6-43)
- Impact: Large breaking changes in future require manual migration; no forward compatibility
- Fix approach: Establish versioning convention, pre-plan schema evolution, test migration paths early

**Loose Data Validation:**
- Issue: Forms accept and store user input without validation beyond maxLength attributes
- Files: `src/pages/Einstellungen.jsx` (lines 155-186), `src/pages/NotizenListe.jsx` (lines 130-148)
- Impact: Invalid data in database; no guarantee of data integrity; potential XSS if data rendered without escaping
- Fix approach: Add Zod/Yup schema validation; validate before db.*.add/update calls

## Known Bugs

**Unidirectional User Context Dependency:**
- Symptoms: All pages require `activeUserId` from UserContext but don't validate it's set
- Files: `src/context/UserContext.jsx` (line 36), all page components using `useUser()`
- Trigger: App start before user selected; component renders with undefined user
- Workaround: Wrap routes that need user in ProtectedRoute; show WelcomeScreen until user selected
- Impact: Potential null reference errors in components

**Profile Load Timing Issue:**
- Symptoms: RezeptDetails.jsx has complex profile loading orchestration with 3 states
- Files: `src/pages/RezeptDetails.jsx` (lines 17-40)
- Trigger: Profile ready state and activeUserId can become out of sync
- Workaround: Simplify to single effect that ensures profile then queries
- Impact: Safety result may be null when profile fails to load; confusing UX

**Shopping List ID Collision Pattern:**
- Symptoms: ID generation uses `${Date.now()}-${addedCount}` which can collide across batches
- Files: `src/pages/RezeptDetails.jsx` (line 74)
- Trigger: Adding ingredients from multiple recipes in rapid succession
- Workaround: Use UUID or include person_id in generated ID
- Impact: Duplicate items on shopping list

**Inconsistent Error Handling:**
- Symptoms: Some operations show error toast, others silently fail to console
- Files: `src/pages/ProdukteListe.jsx` (line 35), `src/db/schema.js` (line 90)
- Trigger: Database operation failures
- Workaround: Create centralized error handler
- Impact: Silent failures; users don't know operations failed

## Security Considerations

**localStorage Not Protected:**
- Risk: Active user ID stored in plaintext localStorage; can be read by any JS on page
- Files: `src/context/UserContext.jsx` (lines 29, 42)
- Current mitigation: App is offline-only single device, low risk in practice
- Recommendations: For shared device scenarios, consider sessionStorage or no persistence; add user PIN if needed

**No XSS Protection on User Input:**
- Risk: Notes, product names, and preferences stored and rendered without sanitization
- Files: `src/pages/NotizenListe.jsx` (line 198), `src/pages/ProdukteListe.jsx` (line 120)
- Current mitigation: Content rendered as text nodes (not innerHTML), so limited actual risk
- Recommendations: Keep current approach; add DOMPurify if future features use HTML content

**Backup File Validation Incomplete:**
- Risk: validateBackupFile() checks schema version but doesn't validate individual record structure
- Files: `src/db/backup.js` (lines 50-84)
- Current mitigation: Dexie's importInto handles some validation; acceptVersionDiff:true could skip important checks
- Recommendations: Add field-level validation; consider strict mode flag for imports

**No Rate Limiting on Database Operations:**
- Risk: Malicious code in PWA could spam database with writes
- Files: All components with db.*.add/update/delete calls
- Current mitigation: App is offline-only, no external input
- Recommendations: Add operation rate limiting; quota tracking per session

## Performance Bottlenecks

**Every Component Rerenders on User Switch:**
- Problem: All pages query with `[activeUserId]` dependency, forcing full requery on switch
- Files: All page components using `useLiveQuery(() => db.*.where('person_id').equals(activeUserId), [activeUserId])`
- Cause: Proper but unoptimized; could use queryKey caching
- Improvement path: Implement React Query or memoize queries; use Dexie's collection caching

**Inefficient Sorting in Recipe Safety Check:**
- Problem: KochBot normalizes and maps ingredients for every recipe check
- Files: `src/bots/KochBot.js` (lines 8-35)
- Cause: `_buildNormalizedMap()` runs in constructor but `_normalize()` called on every ingredient
- Improvement path: Cache normalized restriction map; consider Trie data structure for substring matching

**No Memoization of Computed Lists:**
- Problem: useMemo in components but many operations run on every render
- Files: `src/pages/ProdukteListe.jsx` (lines 41-56), `src/pages/RezeptDetails.jsx` (lines 45-49)
- Cause: Filter/sort logic is lightweight so impact is minimal at current scale
- Improvement path: Use React.memo for list item components; memoize handlers with useCallback

**Database Queries Lack Debouncing:**
- Problem: Rapid user interactions trigger multiple queries
- Files: Search/filter inputs in `src/pages/RezepteListe.jsx`, `src/pages/ProdukteListe.jsx`
- Cause: onChange handlers trigger state updates directly
- Improvement path: Debounce search input (300ms); use optimistic UI updates

## Fragile Areas

**Dietary Restrictions Hardcoded:**
- Files: `src/bots/substitutions.js`, `src/db/schema.js` (lines 39, 51, 72, 85)
- Why fragile: Adding new user or restriction type requires code changes; no configuration UI
- Safe modification: Store restrictions in profile table; load from database not constants
- Test coverage: KochBot has no tests; _normalize and _findRestrictedIngredients logic untested

**PWA Install Flow Untested:**
- Files: `src/App.jsx` (lines 20-26), `src/components/PWAUpdatePrompt.jsx`
- Why fragile: Service worker registration and update logic depends on Workbox; any change breaks offline capability
- Safe modification: Add integration tests for SW lifecycle; test on actual devices (iOS Safari notably fragile)
- Test coverage: No tests exist for PWA functionality

**Database Schema Coupling:**
- Files: `src/db/schema.js` is imported by many components
- Why fragile: Schema changes (field names, indexes) require updating imports everywhere
- Safe modification: Create db wrapper functions for queries; abstract table access through helpers
- Test coverage: No validation of schema matches code expectations

**Layout Component Responsibility:**
- Files: `src/components/Layout.jsx` handles navigation, user switching, and error boundaries
- Why fragile: Too many concerns; if one breaks, whole app layout breaks
- Safe modification: Split into Layout, Navigation, UserSwitcher, ErrorBoundary components
- Test coverage: None

## Scaling Limits

**IndexedDB Storage Quota:**
- Current capacity: Typical browsers allow 10-50MB
- Limit: Safari allows 25MB but deletes after 7 days of inactivity; Firefox allows 2GB
- Scaling path: Monitor quota with navigator.storage; implement data archival; show storage usage in settings

**Recipe List Performance:**
- Current capacity: ~50 recipes (sample data); acceptable rendering
- Limit: At 1000+ recipes, in-memory filtering and rendering become sluggish
- Scaling path: Implement virtual scrolling (windowing); add full-text search index in Dexie

**Shopping List Management:**
- Current capacity: ~100 items; linear filtering is fast
- Limit: At 1000+ items, checked/unchecked filtering and sorting degrade
- Scaling path: Use Dexie indexes for category and checked status; implement pagination

**Profile Data Growth:**
- Current capacity: 2 users, minimal profile data
- Limit: If dietary restrictions become large arrays or history is tracked, queries slow
- Scaling path: Implement archival for historical data; consider subcollections for restrictions history

## Dependencies at Risk

**Dexie Version Lock:**
- Risk: Dexie 4.0.1 is recent major version; backwards incompatible updates likely
- Impact: dexie-react-hooks 1.1.7 may not work with Dexie 5.x; major refactor needed
- Migration plan: Test upgrades in separate branch; pin minor version `^4.0.1`; review hook compatibility before upgrade

**dexie-react-hooks Maintenance:**
- Risk: Package has 1.1.7 version, minimal recent activity; may be unmaintained
- Impact: Bugs in hooks won't be fixed; newer Dexie APIs may not be supported
- Migration plan: Have plan to migrate to useLiveQuery alternative or build custom hooks

**Vite PWA Plugin Stability:**
- Risk: vite-plugin-pwa at 0.19.0 with frequent API changes
- Impact: PWA features may break between updates; configuration becomes outdated
- Migration plan: Test thoroughly before upgrading; keep detailed PWA configuration documentation

**React Router 6 Edge Cases:**
- Risk: HashRouter used for offline compatibility, but v6 has known issues with hash routing edge cases
- Impact: Deep linking to specific recipe pages may fail
- Migration plan: Document workarounds; consider MemoryRouter for testing

## Missing Critical Features

**No Offline Indicator:**
- Problem: App works offline but user sees no indicator
- Blocks: User doesn't know data isn't synced to cloud
- Fix: Add navigator.onLine listener; show banner when offline

**No Loading States for Heavy Operations:**
- Problem: Export/import, large data queries have no visual feedback
- Blocks: Users don't know if operation succeeded
- Fix: Add progress bars and loading spinners (already partially done in BackupExport.jsx)

**No Data Versioning:**
- Problem: Can't track who changed what or when in shared household
- Blocks: Conflict resolution if changes overlap
- Fix: Add created_at/updated_at to all tables; add user_id to track creator

**No Search Capability:**
- Problem: With many recipes, filtering by name only is insufficient
- Blocks: Discovering recipes by ingredients or tags is impossible
- Fix: Implement full-text search in Dexie or use index-based filtering

**No Error Recovery UI:**
- Problem: ErrorFallback component only shows error, no recovery action
- Blocks: Users stuck after crash
- Fix: Add "Clear app data" button in error boundary

## Test Coverage Gaps

**Zero Unit Tests:**
- What's not tested: All business logic (KochBot normalization, RezeptDetails shopping list logic, Dexie queries)
- Files: No test files found across entire codebase
- Risk: Recipe safety checking could have bugs; user data operations could corrupt database
- Priority: High - implement tests for bot logic and data operations

**No Integration Tests:**
- What's not tested: User switching flow, shopping list addition, profile saving
- Risk: Cross-component state sharing could fail silently
- Priority: Medium - add tests for UserContext and page interactions

**No E2E Tests:**
- What's not tested: Full app flow, PWA offline functionality, backup/restore
- Risk: PWA caching could break offline mode; backup restoration could fail
- Priority: Medium - set up Cypress or Playwright for critical paths

**Missing Component Tests:**
- What's not tested: Form validation, error state rendering, list item interactions
- Files: `src/pages/*.jsx`, `src/components/*.jsx`
- Risk: UI regressions in form validation or error display
- Priority: Low-Medium - implement Vitest + React Testing Library

**No Visual Regression Testing:**
- What's not tested: CSS consistency across pages, responsive design breakpoints
- Risk: Style changes break layout on mobile
- Priority: Low - consider Percy or similar for visual snapshots

---

*Concerns audit: 2026-01-24*
