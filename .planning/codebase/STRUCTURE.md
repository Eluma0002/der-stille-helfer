# Codebase Structure

**Analysis Date:** 2026-01-18

## Directory Layout

```
Elvis Kühlschrank/
├── .planning/                    # GSD planning documents
│   └── codebase/                 # Architecture analysis docs
├── Der-Stille-Helfer-Original-31/  # Main application source
│   ├── src/                      # React source code
│   │   ├── bots/                 # Bot system (helpers/assistants)
│   │   ├── components/           # Shared UI components
│   │   ├── db/                   # Dexie database layer
│   │   ├── pages/                # Feature page components
│   │   ├── strings/              # Localization (German)
│   │   ├── utils/                # Utilities (empty)
│   │   ├── App.jsx               # Root component with router
│   │   ├── App.css               # App-level styles
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Global styles
│   ├── data/                     # Static data files
│   ├── public/                   # Static assets (icons)
│   ├── scripts/                  # Build scripts
│   ├── index.html                # HTML entry point
│   ├── package.json              # Dependencies
│   └── vite.config.js            # Vite + PWA config
├── install.sh                    # Mac/Linux setup script
├── install.bat                   # Windows setup script
└── CLAUDE.md                     # Project instructions
```

## Directory Purposes

**`Der-Stille-Helfer-Original-31/src/pages/`:**
- Purpose: Feature-specific page components
- Contains: 9 page components with matching CSS files
- Key files:
  - `Uebersicht.jsx` - Dashboard/home page
  - `ProdukteListe.jsx` - Inventory management
  - `RezepteListe.jsx` - Recipe browser
  - `RezeptDetails.jsx` - Single recipe view
  - `EinkaufsListe.jsx` - Shopping list
  - `FavoritenListe.jsx` - Saved favorites
  - `NotizenListe.jsx` - Notes
  - `Einstellungen.jsx` - Settings/profile
  - `BackupExport.jsx` - Data backup/restore

**`Der-Stille-Helfer-Original-31/src/components/`:**
- Purpose: Shared/reusable UI components
- Contains: Layout shell, PWA prompts
- Key files:
  - `Layout.jsx` - App shell with header and bottom nav
  - `Layout.css` - Layout styling
  - `PWAUpdatePrompt.jsx` - Service worker update notification
  - `PWAUpdatePrompt.css` - Update prompt styling

**`Der-Stille-Helfer-Original-31/src/db/`:**
- Purpose: Database schema and query helpers
- Contains: Dexie schema definition, helper functions
- Key files:
  - `schema.js` - IndexedDB table definitions (12 tables)
  - `helpers.js` - Reusable query functions

**`Der-Stille-Helfer-Original-31/src/bots/`:**
- Purpose: Domain-specific assistant logic
- Contains: Bot base class and implementations
- Key files:
  - `Bot.js` - Base class (id, name, icon)
  - `KochBot.js` - Recipe safety/adaptation logic
  - `PlanerBot.js` - Meal suggestion logic
  - `index.js` - Bot registry export

**`Der-Stille-Helfer-Original-31/src/strings/`:**
- Purpose: Centralized German UI strings
- Contains: Single localization file
- Key files:
  - `de.js` - All German strings organized by feature

**`Der-Stille-Helfer-Original-31/data/`:**
- Purpose: Static/seed data
- Contains: Example recipes (currently empty array)
- Key files:
  - `beispiel-rezepte.js` - Sample recipe data

**`Der-Stille-Helfer-Original-31/scripts/`:**
- Purpose: Build-time scripts
- Contains: Icon generation
- Key files:
  - `generate-icons.js` - Creates PWA icons from SVG

## Key File Locations

**Entry Points:**
- `Der-Stille-Helfer-Original-31/index.html`: HTML shell
- `Der-Stille-Helfer-Original-31/src/main.jsx`: React bootstrap
- `Der-Stille-Helfer-Original-31/src/App.jsx`: Router and app root

**Configuration:**
- `Der-Stille-Helfer-Original-31/package.json`: Dependencies and scripts
- `Der-Stille-Helfer-Original-31/vite.config.js`: Build and PWA config

**Core Logic:**
- `Der-Stille-Helfer-Original-31/src/db/schema.js`: Database schema
- `Der-Stille-Helfer-Original-31/src/bots/index.js`: Bot registry

**Testing:**
- Not present (vitest in package.json but no test files exist)

## Naming Conventions

**Files:**
- Page components: PascalCase with feature name (e.g., `ProdukteListe.jsx`)
- CSS files: Match component name (e.g., `ProdukteListe.css`)
- Utility/config files: kebab-case (e.g., `generate-icons.js`)
- Bot classes: PascalCase ending in `Bot` (e.g., `KochBot.js`)

**Directories:**
- All lowercase (e.g., `pages`, `components`, `bots`)
- Plural for collections (e.g., `strings`, `bots`)

**Components:**
- PascalCase function name matching filename
- Default export

**Database Tables:**
- snake_case (e.g., `base_rezepte`, `pending_changes`)

## Where to Add New Code

**New Feature/Page:**
- Create component: `Der-Stille-Helfer-Original-31/src/pages/[FeatureName].jsx`
- Create styles: `Der-Stille-Helfer-Original-31/src/pages/[FeatureName].css`
- Add route: `Der-Stille-Helfer-Original-31/src/App.jsx`
- Add nav link: `Der-Stille-Helfer-Original-31/src/components/Layout.jsx`

**New Shared Component:**
- Create component: `Der-Stille-Helfer-Original-31/src/components/[ComponentName].jsx`
- Create styles: `Der-Stille-Helfer-Original-31/src/components/[ComponentName].css`

**New Bot/Assistant:**
- Create class: `Der-Stille-Helfer-Original-31/src/bots/[Name]Bot.js`
- Extend `Bot` base class
- Register in: `Der-Stille-Helfer-Original-31/src/bots/index.js`

**New Database Table:**
- Add to schema: `Der-Stille-Helfer-Original-31/src/db/schema.js`
- Increment version number
- Add helper functions: `Der-Stille-Helfer-Original-31/src/db/helpers.js`

**New Strings:**
- Add to: `Der-Stille-Helfer-Original-31/src/strings/de.js`
- Follow existing nested object structure

**Utilities:**
- Create in: `Der-Stille-Helfer-Original-31/src/utils/` (currently empty)

## Special Directories

**`Der-Stille-Helfer-Original-31/public/`:**
- Purpose: Static assets served at root
- Generated: PWA icons via `npm run generate-icons`
- Committed: Yes (source SVG); generated PNGs may or may not be

**`Der-Stille-Helfer-Original-31/dist/`:**
- Purpose: Production build output
- Generated: Yes (via `npm run build`)
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in .gitignore)

**`.planning/`:**
- Purpose: GSD planning and analysis documents
- Generated: By GSD map-codebase command
- Committed: Should be committed for team reference

---

*Structure analysis: 2026-01-18*
