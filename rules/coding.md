# Coding Rules — Terra View

```yaml
date: 2026-06-27
author: Roro LeSage
model: Sonnet 4.6
sources:
  - src/
  - vite.config.ts
  - tsconfig.json
  - package.json
```

## Purpose

This document defines coding conventions for the Terra View client. Rules are derived from the existing codebase and reflect patterns that must be followed when adding or modifying code.

---

## 1. TypeScript

- Use **strict mode** — `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all enabled in `tsconfig.json`.
- Never use `any`. Define explicit interfaces in `src/types/` instead.
- Use `import type` for type-only imports; this is mandatory and consistent throughout the codebase.
- Use `as const` for constant objects that serve as enum-like maps (e.g. `SOCKET_EVENTS`).
- Prefer `null` over `undefined` for absent values in state and return types. Use `undefined` only when the value is truly optional or unknown.
- Use `==` / `!=` only for `null` checks (`value == null` catches both `null` and `undefined`). Use strict equality `===` everywhere else.

```typescript
// ✅ correct — type import
import type { Planet } from '../types/planet';

// ✅ correct — null check covers both null and undefined
if (value == null) { ... }

// ❌ wrong — redundant double check
if (value === null || value === undefined) { ... }
```

---

## 2. React

- **Functional components only.** No class components.
- **Named exports** for all page and component files. The only default export is `App`.
- Extract logic into **custom hooks**. Components should only contain rendering and event wiring.
- Use `useCallback` for callbacks passed as props to children.
- Use inline `React.CSSProperties` for component styles. No CSS modules or styled-components.
- The design theme is dark: background `#0f0f0f`, text `#f0f0f0`, error `#ff6b6b`, links `#7eb8ff`.

```tsx
// ✅ correct
export function HexGrid({ onHexClick }: Props) { ... }

// ❌ wrong
export default function HexGrid({ onHexClick }: Props) { ... }
```

---

## 3. Async Effects and Cleanup

Use a `cancelled` boolean flag inside `useEffect` for async operations. Check it after every `await` before calling `setState`. This prevents state updates on unmounted components.

```typescript
useEffect(() => {
  let cancelled = false;

  const load = async () => {
    const data = await fetchSomething();
    if (cancelled) return;

    setState(data);
  };

  void load();

  return () => {
    cancelled = true;
  };
}, []);
```

- Prefix fire-and-forget async calls with `void` to make the intent explicit.
- Do **not** use `.then()` chains in effects — use `async/await` in a named inner function.

---

## 4. File and Directory Structure

```
src/
├── components/       # React components
│   ├── game/         # PixiJS canvas wrappers, map rendering
│   └── ui/           # HUD, headers, panels
├── hooks/            # Custom React hooks (use*.ts)
├── services/         # REST and socket services (*Service.ts)
├── types/            # TypeScript interfaces and types
├── utils/            # Pure functions (no React)
├── config/           # App-level configuration (env, logger config)
└── assets/           # Static resources
    ├── tilesets/
    └── units/
```

**Naming conventions:**

| Type | Convention | Example |
|------|------------|---------|
| React components | `PascalCase.tsx` | `HexGrid.tsx` |
| Hooks | `use*.ts` | `usePlanetHex.ts` |
| Services | `*Service.ts` | `planetService.ts` |
| Error mappers | `*Errors.ts` | `moveErrors.ts` |
| Utilities | `camelCase.ts` | `hexCoords.ts` |
| Type files | `camelCase.ts` | `planet.ts` |

---

## 5. Path Aliases

Use path aliases for cross-layer imports. Use relative paths only for imports within the same directory.

| Alias | Resolves to |
|-------|-------------|
| `@/*` | `src/*` |
| `@components/*` | `src/components/*` |
| `@hooks/*` | `src/hooks/*` |
| `@services/*` | `src/services/*` |
| `@types/*` | `src/types/*` |
| `@utils/*` | `src/utils/*` |

```typescript
// ✅ cross-layer import — use alias
import { logger } from '@utils/logger';

// ✅ same-directory import — relative is fine
import { api } from './api';
```

---

## 6. Services

Services are **object literals** — not classes — with async methods, one per domain entity.

```typescript
export const planetService = {
  async getPlanet(planetId: string): Promise<Planet> {
    const response = await api.get<Planet>(`/planets/${planetId}`);
    return response.data;
  },
};
```

- All HTTP calls go through the shared `api` instance from `src/services/api.ts`.
- The `api` instance uses `baseURL: '/infinity'` and `withCredentials: true`.
- Never create additional Axios instances or call `fetch` directly.
- URL-encode dynamic path segments with `encodeURIComponent`.

---

## 7. State Management

- State lives in **custom hooks** (`useState` + `useEffect`). Components are pure renderers.
- For complex loading flows, model state as a typed status union (`'loading' | 'ready' | 'error'`) with a flat state object passed via a single `useState`.
- Zustand is a declared dependency; use it for **shared cross-component state** when a single hook is not sufficient. Do not use it for local component state.

---

## 8. Socket.IO

- Use a **singleton service class** (unexported class, exported singleton instance).
- Socket event names are defined in `SOCKET_EVENTS` in `src/types/socket.ts` using `as const`.
- Subscriptions return an `unsubscribe` function — call it in the `useEffect` cleanup.
- Always use `withCredentials: true` when connecting.

```typescript
// in a hook
useEffect(() => {
  let active = true;
  let unsubscribe: (() => void) | undefined;

  void service.subscribeToPlanet(planetId, handler).then((unsub) => {
    if (!active) { unsub(); return; }
    unsubscribe = unsub;
  });

  return () => {
    active = false;
    unsubscribe?.();
    service.leavePlanet();
  };
}, [planetId]);
```

---

## 9. Error Handling

- Map HTTP error codes to user-facing messages in dedicated `*Errors.ts` files (e.g. `moveErrors.ts`, `relocateErrors.ts`).
- Use `getErrorMessage(error, fallback)` from `src/utils/helpers.ts` to extract the NestJS `message` field from Axios errors.
- Handle 401 responses explicitly — redirect to `/stellar-gate/` or show `UNAUTHORIZED_ERROR_MESSAGE`.
- Always check `cancelled` / `active` before calling `setState` in a catch block.
- Never swallow errors silently (`catch (e) {}`).

---

## 10. Logging

Use the `Logger` class from `src/utils/logger.ts`. Do not call `console.*` directly.

```typescript
import { logger } from '@utils/logger';

// named context for a module
const log = logger.child('PLANET_HEX');
log.debug('loaded', data);
log.error('failed to load', error);
```

- `debug` calls are gated by `VITE_LOG_DEBUG` (defaults to `true` in development).
- Use `logger.child('CONTEXT')` for named sub-loggers; chain with `:` for nested contexts.

---

## 11. Hex Coordinates

- Hex position is always expressed as `{ q: number; r: number }` — never as latitude/longitude or `x`/`y`.
- The planet surface is a **toroidal grid** — wrapping is handled in `src/utils/planetGrid.ts`.
- Screen coordinate computation (pixel layout) lives in `src/utils/hexLayout.ts`, separate from the grid logic.
- Grid height is computed via `getPlanetGridHeight(radius)` — do not hard-code it.

---

## 12. Assets

- Import known static assets (tilesets, known sprites) with a standard Vite static import:

  ```typescript
  import plain from '../assets/tilesets/plain.png';
  ```

- Use `import.meta.glob` for pattern-based dynamic asset loading:

  ```typescript
  const modules = import.meta.glob<string>('../assets/units/*.png', {
    eager: true,
    import: 'default',
  });
  ```

- Do not reference assets via string paths at runtime; always go through Vite's asset pipeline.

---

## 13. Comments

- Do not add comments that repeat what the code already says.
- Write comments only to explain **why** — non-obvious constraints, trade-offs, or intent that is not visible from the code alone.
- Use a JSDoc `/** ... */` comment on exported utilities and public service methods when the purpose is not self-evident from the name and signature.

```typescript
// ✅ explains a non-obvious constraint
/** Same-origin URL so the auth cookie is sent (Vite/Caddy proxy `/infinity/*` → backend). */
export function getSocketUrl(): string { ... }

// ❌ narrates the code — remove
// Get the planet ID from the route params
const { planetId } = useParams();
```
