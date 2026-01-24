# Coding Conventions

**Analysis Date:** 2026-01-24

## Naming Patterns

**Files:**
- React components (pages): PascalCase with German names → `Uebersicht.jsx`, `ProdukteListe.jsx`, `EinkaufsListe.jsx`
- Utility/service files: camelCase → `helpers.js`, `backup.js`, `substitutions.js`
- Class files: PascalCase → `Bot.js`, `KochBot.js`, `PlanerBot.js`
- Context files: PascalCase with Context suffix → `UserContext.jsx`
- CSS files: Match component name → `Einstellungen.css`
- Constant files: lowercase → `constants.js`, `de.js` (strings)

**Functions:**
- camelCase for all functions
- Async functions explicitly declared with `async` keyword
- Private helper methods prefix with underscore → `_normalize()`, `_buildNormalizedMap()`, `_findRestrictedIngredients()`
- Custom hooks: camelCase with `use` prefix → `useUser()`, `useLiveQuery()` (from library)

**Variables:**
- camelCase for local variables and state
- State management via `useState`: descriptive names → `activeUserId`, `activeUser`, `formData`
- Constants in SCREAMING_SNAKE_CASE → `STORAGE_KEY`, `ELVIS_RESTRICTIONS`, `DEFAULT_CATEGORIES`
- DOM element variables: descriptive → `blob`, `url`, `filteredAndSortedProdukte`

**Types:**
- No TypeScript in use - JavaScript only
- JSDoc comments for complex functions with parameter/return types
- Object property names match German domain language → `person_id`, `zutaten`, `ablauf`, `ort`, `kategorie`, `dietary_restrictions`

## Code Style

**Formatting:**
- No linter configured (no `.eslintrc*`, `.prettier*` files found)
- Consistent use of 4-space indentation
- Single quotes not enforced, double quotes used in imports
- Semicolons used consistently
- No line length enforced

**Linting:**
- No linting tools configured
- Code style is manually maintained

## Import Organization

**Order:**
1. React and core dependencies → `import React, { useState } from 'react'`
2. Third-party libraries → `import { useLiveQuery } from 'dexie-react-hooks'`
3. Internal database imports → `import { db } from '../db/schema'`
4. Internal components/pages → `import Layout from './components/Layout'`
5. Utilities and constants → `import { DEFAULT_CATEGORIES } from '../constants'`
6. Context and hooks → `import { useUser } from '../context/UserContext'`
7. Localization strings → `import { strings } from '../strings/de'`
8. CSS files → `import './Einstellungen.css'`

**Path Aliases:**
- No path aliases configured
- Relative paths used throughout → `../db/schema`, `../strings/de`

## Error Handling

**Patterns:**
- Try-catch blocks in async operations, especially database calls
- Errors logged to console with `console.error()`
- User-facing errors stored in component state (`error` variable)
- Graceful fallbacks with default values:
  ```javascript
  const profile = existingProfile || null;
  const produkte = useLiveQuery(...) || [];
  ```
- Input validation before operations:
  ```javascript
  if (!name) return;  // Early exit pattern
  if (!zutat.name) continue;  // Skip invalid items
  ```
- Safe navigation with optional chaining (where applicable)

**Example from context:**
```javascript
try {
    localStorage.setItem(STORAGE_KEY, activeUserId);
} catch (e) {
    console.warn('Could not save user preference');
}
```

## Logging

**Framework:** `console` object

**Patterns:**
- `console.log()` for informational messages (service worker registration, status)
- `console.warn()` for non-critical failures (localStorage unavailable)
- `console.error()` for exception details in catch blocks
- Simple string concatenation or template literals
- Log messages in German matching UI language

**Examples:**
```javascript
console.error('Error loading profile:', err);
console.log(`Created profile for ${personId} with ${restrictions.length} restrictions`);
console.warn('Could not save user preference');
```

## Comments

**When to Comment:**
- Complex algorithms requiring explanation → See `KochBot.js` with normalization and substitution logic
- Non-obvious regex patterns → Split on separators with explanation
- Database operations and their constraints
- JSDoc for public functions (especially async database operations)

**JSDoc/TSDoc:**
- Used for exported utility functions and complex methods
- Documents parameters, return values, and exceptions
- Example from `backup.js`:
```javascript
/**
 * Export entire database to JSON file
 * @param {Function} setProgress - Callback to update progress (0-100)
 * @param {Function} setMessage - Callback to update status message
 * @returns {Promise<boolean>} - True on success, false on error
 */
export async function exportDatabase(setProgress, setMessage) {
```

## Function Design

**Size:**
- Small, focused functions (most under 50 lines)
- Single responsibility principle observed
- Example: `getActiveProfile()` in `helpers.js` - single database query wrapped

**Parameters:**
- Destructuring used for context values:
  ```javascript
  const { activeUser, activeUserId } = useUser();
  const { needRefresh, updateServiceWorker } = useRegisterSW({...});
  ```
- Callbacks for async operations → `setProgress`, `setMessage` in backup operations
- Spread operator for cloning/merging:
  ```javascript
  const filtered = [...produkte];
  setFormData(prev => ({...prev, [name]: value}));
  ```

**Return Values:**
- Void for mutations on database/UI
- Objects with status/data structure for utility functions:
  ```javascript
  return {
      status: 'safe'|'adapted'|'warning',
      message: string,
      replacements: array
  };
  ```
- Early returns for validation failures
- Null/undefined for optional results

## Module Design

**Exports:**
- Default exports for React components:
  ```javascript
  export default function Uebersicht() { ... }
  export default Uebersicht;
  ```
- Named exports for utilities and classes:
  ```javascript
  export const getInventory = async (...) => { ... }
  export class KochBot extends Bot { ... }
  export async function exportDatabase(...) { ... }
  ```

**Barrel Files:**
- Used in `src/bots/index.js` to aggregate bot classes:
  ```javascript
  // Simplified example
  import { KochBot } from './KochBot.js';
  import { PlanerBot } from './PlanerBot.js';
  export default { koch: new KochBot(), planer: new PlanerBot() };
  ```
- Simplifies imports throughout app → `import bots from '../bots'`

## Special Patterns

**Database Access:**
- All database queries wrapped in async functions
- Queries always filtered by `person_id` for multi-user isolation:
  ```javascript
  db.produkte.where('person_id').equals(activeUserId).toArray()
  ```
- Dexie live queries used in components:
  ```javascript
  const produkte = useLiveQuery(
      () => db.produkte.where('person_id').equals(activeUserId).toArray(),
      [activeUserId]
  );
  ```

**Component State Management:**
- React hooks only (useState, useEffect, useContext)
- No external state management library
- Local component state for UI concerns (forms, loading)
- Database as source of truth via Dexie live queries
- User context via React Context API

**German Domain Language:**
- UI strings from centralized `strings/de.js` (never hardcoded strings)
- Database fields in German → `zutaten` (ingredients), `ablauf` (expiration), `ort` (location)
- Component names in German (feature pages) → `ProdukteListe`, `EinkaufsListe`
- Helper/utility names in English → `Bot`, `Layout`, `ErrorFallback`

---

*Convention analysis: 2026-01-24*
