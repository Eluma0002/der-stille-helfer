# Testing Patterns

**Analysis Date:** 2026-01-24

## Test Framework

**Runner:**
- Vitest (configured in `package.json` script: `npm run test`)
- Config: No `vitest.config.js` found - uses Vite defaults
- Version: Not explicitly pinned in dependencies

**Assertion Library:**
- Vitest built-in (expected/assert, not yet implemented in codebase)

**Run Commands:**
```bash
npm run test              # Run all tests with Vitest
```

## Test File Organization

**Current State:**
- No test files exist in the codebase
- Zero test coverage

**Recommended Location Pattern:**
- Co-located with source files: `ComponentName.test.jsx` and `ComponentName.jsx` in same directory
- For utilities: `functionName.test.js` alongside `functionName.js`

**Expected Structure:**
```
src/
├── components/
│   ├── Layout.jsx
│   ├── ErrorFallback.jsx
│   └── ErrorFallback.test.jsx       # To be created
├── pages/
│   ├── ProdukteListe.jsx
│   ├── ProdukteListe.test.jsx       # To be created
│   └── Einstellungen.jsx
├── db/
│   ├── schema.js
│   ├── helpers.js
│   └── helpers.test.js              # To be created
├── bots/
│   ├── Bot.js
│   ├── KochBot.js
│   ├── KochBot.test.js              # To be created
│   └── PlanerBot.test.js            # To be created
└── context/
    ├── UserContext.jsx
    └── UserContext.test.jsx         # To be created
```

**Naming Convention:**
- `.test.jsx` for React component tests
- `.test.js` for utility/logic tests

## Test Structure

**Recommended Suite Pattern:**

For components:
```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProdukteListe from './ProdukteListe';

describe('ProdukteListe', () => {
    beforeEach(() => {
        // Setup: reset mocks, initialize test data
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Cleanup: reset IndexedDB state if needed
    });

    it('should display empty state when no products exist', () => {
        render(<ProdukteListe />);
        expect(screen.getByText(/no products/i)).toBeInTheDocument();
    });

    it('should add product when form submitted', async () => {
        const user = userEvent.setup();
        render(<ProdukteListe />);

        await user.type(screen.getByPlaceholderText(/produktname/i), 'Hackfleisch');
        await user.click(screen.getByRole('button', { name: /hinzufügen/i }));

        expect(mockDb.produkte.add).toHaveBeenCalled();
    });
});
```

For utilities:
```javascript
import { describe, it, expect } from 'vitest';
import { getActiveProfile, getInventory } from './helpers';

describe('database helpers', () => {
    it('should fetch active profile by person_id', async () => {
        const profile = await getActiveProfile('elvis');
        expect(profile).toHaveProperty('dietary_restrictions');
    });
});
```

## Mocking

**Framework:** Vitest built-in mocking with `vi`

**Mocking Dexie Database (`src/db/schema`):**
```javascript
import { vi } from 'vitest';

vi.mock('../db/schema', () => ({
    db: {
        produkte: {
            toArray: vi.fn().mockResolvedValue([
                { id: '1', person_id: 'elvis', name: 'Hackfleisch', ablauf: '2026-01-30' }
            ]),
            add: vi.fn().mockResolvedValue('new-id'),
            delete: vi.fn().mockResolvedValue(undefined),
            where: vi.fn().mockReturnValue({
                equals: vi.fn().mockReturnValue({
                    toArray: vi.fn().mockResolvedValue([]),
                    first: vi.fn().mockResolvedValue(null)
                })
            })
        },
        profile: {
            where: vi.fn().mockReturnValue({
                equals: vi.fn().mockReturnValue({
                    first: vi.fn().mockResolvedValue({
                        id: 'profile-elvis',
                        person_id: 'elvis',
                        dietary_restrictions: ['Weizen', 'Milch']
                    })
                })
            }),
            add: vi.fn().mockResolvedValue('profile-id'),
            update: vi.fn().mockResolvedValue(1)
        },
        base_rezepte: {
            toArray: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0),
            bulkAdd: vi.fn().mockResolvedValue([])
        }
    }
}));
```

**Mocking dexie-react-hooks (`useLiveQuery`):**
```javascript
vi.mock('dexie-react-hooks', () => ({
    useLiveQuery: vi.fn((queryFn, deps) => {
        // Return mock data or test-specific return value
        return [];  // Default: empty array
    })
}));

// Usage: customize per test
import { useLiveQuery } from 'dexie-react-hooks';
const mockUseLiveQuery = vi.mocked(useLiveQuery);
mockUseLiveQuery.mockReturnValue([
    { id: '1', name: 'Produkt 1' }
]);
```

**Mocking Bot System (`src/bots`):**
```javascript
vi.mock('../bots', () => ({
    default: {
        koch: {
            checkSafety: vi.fn().mockReturnValue({
                status: 'safe',
                message: 'Sicher für dich',
                replacements: []
            })
        },
        planer: {
            suggest: vi.fn().mockReturnValue(null)  // Default: no suggestion
        }
    }
}));
```

**Mocking UserContext:**
```javascript
vi.mock('../context/UserContext', () => ({
    useUser: vi.fn().mockReturnValue({
        activeUserId: 'elvis',
        activeUser: { id: 'elvis', name: 'Elvis', emoji: '🧑‍🍳' },
        switchUser: vi.fn(),
        isFirstRun: false,
        users: { elvis: {...}, alberina: {...} }
    })
}));
```

**What to Mock:**
- IndexedDB/Dexie operations (database calls)
- React hooks that depend on external state (useLiveQuery, useUser)
- Browser APIs with side effects (localStorage, alert)
- Bot/AI logic that's already tested separately
- External API calls (none currently)

**What NOT to Mock:**
- React component rendering behavior itself
- User event handlers and their logic
- CSS/styling
- Component internal useState logic
- Helper function logic (test these directly)

## Fixtures and Factories

**Test Data Fixtures:**

`src/test/fixtures/products.js`:
```javascript
export const mockProducts = [
    {
        id: '1',
        person_id: 'elvis',
        name: 'Hackfleisch',
        kategorie: 'fleisch',
        ort: 'kuehlschrank',
        ablauf: '2026-01-25T00:00:00.000Z'
    },
    {
        id: '2',
        person_id: 'elvis',
        name: 'Dinkelmehl',
        kategorie: 'vorrat',
        ort: 'vorrat',
        ablauf: '2026-06-01T00:00:00.000Z'
    }
];

export const mockProductsAlberina = [
    {
        id: '3',
        person_id: 'alberina',
        name: 'Milch',
        kategorie: 'getraenke',
        ort: 'kuehlschrank',
        ablauf: '2026-01-26T00:00:00.000Z'
    }
];
```

`src/test/fixtures/recipes.js`:
```javascript
export const mockRecipes = [
    {
        id: 'recipe-1',
        name: 'Börek',
        kategorie: 'hauptgericht',
        zutaten: [
            { name: 'Hackfleisch', menge: '500g' },
            { name: 'Yufka Blätter', menge: '1 Packung' },
            { name: 'Zwiebel', menge: '1 Stück' }
        ],
        anleitung: 'Hackfleisch mit Zwiebel füllen...',
        portionen: 4,
        zeit: 45
    }
];

export const mockRecipeWithRestrictions = [
    {
        id: 'recipe-bad',
        name: 'Spaghetti',
        zutaten: [
            { name: 'Weizen Pasta', menge: '400g' },  // Restricted for Elvis
            { name: 'Milch', menge: '200ml' }  // Also restricted
        ]
    }
];
```

`src/test/fixtures/profiles.js`:
```javascript
export const elvisProfile = {
    id: 'profile-elvis',
    person_id: 'elvis',
    name: 'Elvis',
    allergies: 'Keine Milch, kein Weizen',
    dietary_restrictions: ['Weizen', 'Milch', 'Dinkelmehl']
};

export const alberinaProfile = {
    id: 'profile-alberina',
    person_id: 'alberina',
    name: 'Alberina',
    allergies: '',
    dietary_restrictions: []
};
```

**Location:**
- `src/test/fixtures/` directory (to be created)

## Coverage

**Current State:** No coverage configured or enforced

**View Coverage:**
```bash
npm run test -- --coverage
```

**Recommended Targets:**
- Critical business logic (bots, database access): 80%+
- UI components (pages): 60%+
- Utilities: 80%+

## Test Types

**Unit Tests:**
- **Scope:** Individual functions, components in isolation, mocked dependencies
- **Priority areas:**
  - `src/bots/KochBot.js` - `checkSafety()` method (allergen matching)
  - `src/bots/PlanerBot.js` - `suggest()` method
  - `src/db/helpers.js` - database query wrappers
  - `src/context/UserContext.jsx` - `useUser()` hook behavior
- **Example:** Test KochBot's normalization and substitution matching

**Integration Tests:**
- **Scope:** Component interacting with mocked database, multiple units working together
- **Priority areas:**
  - `src/pages/ProdukteListe.jsx` - add/delete/filter products flow
  - `src/pages/EinkaufsListe.jsx` - manage shopping list with checksmarks
  - `src/pages/Einstellungen.jsx` - profile update with dietary restrictions
  - `src/pages/RezepteListe.jsx` - recipe list with bot safety checks
- **Approach:** Mock database but test component state management and rendering
- **Example:** Add product → verify database called → verify UI updated → delete product → verify removed

**E2E Tests:**
- **Not configured.** Consider for future (Playwright/Cypress for PWA testing on actual device)

## Common Patterns

**Async Testing:**
```javascript
import { waitFor, screen } from '@testing-library/react';

it('should load and display recipes', async () => {
    render(<RezepteListe />);

    await waitFor(() => {
        expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument();
    });
});
```

**Error/Edge Case Testing:**
```javascript
it('should not add product with empty name', async () => {
    const user = userEvent.setup();
    render(<ProdukteListe />);

    // Click add without entering name
    await user.click(screen.getByRole('button', { name: /add/i }));

    // Verify no database call was made
    expect(mockDb.produkte.add).not.toHaveBeenCalled();
});

it('should handle database errors gracefully', async () => {
    mockDb.produkte.add.mockRejectedValueOnce(new Error('DB Error'));

    const user = userEvent.setup();
    render(<ProdukteListe />);

    await user.type(screen.getByPlaceholderText(/name/i), 'Test');
    await user.click(screen.getByRole('button', { name: /add/i }));

    // Error should be displayed to user
    expect(screen.getByText(/error/i)).toBeInTheDocument();
});
```

**Component with Router Testing:**
```javascript
import { HashRouter } from 'react-router-dom';
import { UserProvider } from '../context/UserContext';

const renderWithProviders = (component) => {
    return render(
        <HashRouter>
            <UserProvider>
                {component}
            </UserProvider>
        </HashRouter>
    );
};

it('should render with user context and routing', () => {
    renderWithProviders(<Layout><Uebersicht /></Layout>);
    expect(screen.getByText(/guten tag/i)).toBeInTheDocument();
});
```

**Testing Bot Safety Logic:**
```javascript
import { KochBot } from '../bots/KochBot';

describe('KochBot.checkSafety', () => {
    let koch;

    beforeEach(() => {
        koch = new KochBot();
    });

    it('should detect restricted ingredients with normalization', () => {
        const recipe = {
            zutaten: [
                { name: 'Weizenmehl', menge: '250g' },  // Should match "Weizen"
                { name: 'Milch', menge: '200ml' }
            ]
        };
        const profile = { dietary_restrictions: ['Weizen', 'Milch'] };

        const result = koch.checkSafety(recipe, profile);

        expect(result.status).toBe('warning');
        expect(result.replacements).toHaveLength(2);
    });

    it('should suggest alternatives for known restrictions', () => {
        const recipe = {
            zutaten: [{ name: 'Milch', menge: '200ml' }]
        };
        const profile = { dietary_restrictions: ['Milch'] };

        const result = koch.checkSafety(recipe, profile);

        expect(result.status).toBe('adapted');
        expect(result.replacements[0].alternatives).toContain('Sauerrahm');
    });
});
```

## Setup Requirements

**New Dependencies to Add:**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Vitest Configuration File (`vitest.config.js`):**
Create in project root:
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.test.js',
                '**/*.spec.js'
            ]
        }
    }
});
```

**Test Setup File (`src/test/setup.js`):**
```javascript
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }))
});
```

**Update `package.json` scripts:**
```json
{
    "scripts": {
        "test": "vitest",
        "test:ui": "vitest --ui",
        "test:coverage": "vitest --coverage"
    }
}
```

## Priority Test Areas (for Implementation Order)

**Phase 1 - Core Business Logic:**
1. `src/bots/KochBot.js` - `checkSafety()` method
2. `src/bots/PlanerBot.js` - `suggest()` method
3. `src/db/helpers.js` - all exported functions

**Phase 2 - Critical User Flows:**
1. `src/pages/ProdukteListe.jsx` - CRUD products
2. `src/pages/EinkaufsListe.jsx` - manage shopping list
3. `src/context/UserContext.jsx` - user switching

**Phase 3 - Feature Pages:**
1. `src/pages/Einstellungen.jsx` - profile/restrictions management
2. `src/pages/RezepteListe.jsx` - recipe search
3. `src/pages/RezeptDetails.jsx` - recipe display with bot checks

**Phase 4 - Components & Utils:**
1. `src/components/ErrorFallback.jsx` - error display
2. `src/components/Layout.jsx` - navigation rendering
3. `src/db/backup.js` - export/import functions

---

*Testing analysis: 2026-01-24*
