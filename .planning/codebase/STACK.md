# Technology Stack

**Analysis Date:** 2026-01-24

## Languages

**Primary:**
- JavaScript (ES Modules) - All application code uses `.js` and `.jsx` extensions
- JSX - React component files in `src/pages/`, `src/components/`

**Secondary:**
- CSS - Styling via co-located CSS files (e.g., `src/pages/Uebersicht.css`)
- HTML - Single `index.html` entry point

## Runtime

**Environment:**
- Node.js (version not pinned, requires LTS support)
- Browser runtime (PWA with service worker)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present in repository

**Module System:**
- ES Modules (`"type": "module"` in package.json)

## Frameworks

**Core:**
- React ^18.3.1 - UI component library
- React DOM ^18.3.1 - DOM rendering
- React Router DOM ^6.22.0 - Client-side routing (HashRouter)

**Data Layer:**
- Dexie ^4.0.1 - IndexedDB wrapper for offline-first persistence
- dexie-export-import ^4.1.4 - Database export/import functionality
- dexie-react-hooks ^1.1.7 - React hooks for reactive Dexie queries (`useLiveQuery`)

**Error Handling:**
- react-error-boundary ^6.1.0 - Error boundary component for fault tolerance

**Build/Dev:**
- Vite ^5.1.0 - Build tool and dev server
- @vitejs/plugin-react ^4.2.1 - React plugin for Vite

**PWA:**
- vite-plugin-pwa ^0.19.0 - PWA manifest and service worker generation
- workbox-window ^7.0.0 - Service worker registration and updates

**Dev Utilities:**
- sharp ^0.33.0 - Image processing for PWA icon generation

## Key Dependencies

**Critical:**
- `dexie` - All data persistence via IndexedDB; core to offline-first architecture
- `dexie-react-hooks` - Provides `useLiveQuery` hook for reactive data binding
- `react-router-dom` - Client-side navigation; HashRouter enables offline navigation
- `vite-plugin-pwa` - PWA functionality; required for installable offline app

**Infrastructure:**
- `workbox-window` - Service worker updates; used by `PWAUpdatePrompt.jsx`
- `react-error-boundary` - Error handling for component failures
- `dexie-export-import` - Backup/restore functionality in `BackupExport.jsx`

## Configuration

**Build Configuration:**
- `vite.config.js` - Vite configuration with:
  - React plugin
  - PWA plugin with `registerType: 'prompt'`
  - Dev server on port 3000, bound to all interfaces (`host: true`)
  - Workbox caching strategy for Google Fonts

**PWA Manifest (in vite.config.js):**
- App name: "Der Stille Helfer"
- Short name: "Helfer"
- Theme color: #4CAF50 (green)
- Display: standalone (full screen mobile experience)
- Icons: 192x192, 512x512 PNG files

**Environment:**
- No `.env` files required or detected
- No environment variables needed
- All configuration is compile-time via `vite.config.js`

## Scripts

**Available npm scripts:**
```bash
npm run dev              # Start Vite dev server on port 3000
npm run build            # Production build to dist/
npm run preview          # Preview production build locally
npm run test             # Run Vitest (framework installed, no test files present)
npm run generate-icons   # Generate PWA icons from icon.svg (uses sharp)
```

## Platform Requirements

**Development:**
- Node.js LTS (18.x or 20.x recommended)
- npm (comes with Node.js)
- Sharp requires native build tools (auto-installed via npm)

**Production:**
- Static file hosting (no server-side processing required)
- HTTPS strongly recommended for PWA features and service worker
- Service worker compatible browser (Chrome, Firefox, Safari, Edge all supported)

**Mobile Testing:**
- Same network as development machine
- Access via `http://<computer-ip>:3000` from mobile device
- "Add to Home Screen" for PWA installation testing

## Asset Caching Strategy

**Workbox Configuration (vite-plugin-pwa):**
- Static asset pattern: `**/*.{js,css,html,ico,png,svg,woff2}`
- Google Fonts: CacheFirst strategy with 1-year expiration
- Service worker: Auto-register with update prompt

## Notable Architecture Decisions

**Offline-First:**
- Zero external API dependencies
- All data stored in browser's IndexedDB via Dexie
- Service worker caches all static assets
- User data never leaves device

**Routing:**
- HashRouter used instead of BrowserRouter (enables offline navigation)
- Default route redirects to `/uebersicht`
- Works without server-side routing configuration

**State Management:**
- No external state management library
- Local React hooks for component state
- Dexie `useLiveQuery` for persistent state
- React Context for user selection (`UserContext.jsx`)

---

*Stack analysis: 2026-01-24*
