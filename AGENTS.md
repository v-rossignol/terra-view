# AGENTS.md — Terra View

2D planetary surface visualization client for **Infinity** (hex map, biomes, resources, multiplayer sync). React 18 + TypeScript + Vite SPA with **PixiJS 7** for map rendering.

**Monorepo context:** [../AGENTS.md](../AGENTS.md) · **Known gaps:** [../documentation/TO-BE-FIXED.md](../documentation/TO-BE-FIXED.md)

---

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server → http://localhost:3000/terra-view/
npm run build        # Type-check (tsc) + production build → dist/
npm run test         # Unit tests (Vitest)
npm run preview      # Preview production build
npm run lint         # ESLint on .ts / .tsx
```

After changes, run `npm run build` and `npm run test`.

**Local dev:** Start databases and the Infinity server first (see root [AGENTS.md](../AGENTS.md)). Vite proxies `/infinity/*` to `http://localhost:4000`. Optional: Caddy on port 80 for same-origin routing at `http://localhost/terra-view/` or `http://infinity-dev.home.rh/terra-view/`.

| Field | Value |
|-------|-------|
| Dev port | `3000` |
| Base path | `/terra-view/` |
| API prefix | `/infinity/*` (REST + Socket.IO planned) |

---

## Project structure

```
src/
├── App.tsx              # Root component, React Router routes
├── main.tsx             # React entry point
├── index.css
├── vite-env.d.ts
├── assets/              # Tilesets (biomes) and unit sprites
│   ├── tilesets/
│   └── units/
├── components/          # React pages and UI overlays
│   ├── game/            # CSS hex grid, unit markers
│   └── ui/              # Header, resource panel, unit panel
├── config/              # App-level configuration (logger)
├── hooks/               # Custom React hooks
├── services/            # Axios REST services + Socket.IO service
├── types/               # TypeScript interfaces (one file per domain)
└── utils/               # Pure functions — hex math, error mapping, assets
```

Planned additions:

```
src/
└── stores/              # Zustand (gameStore, uiStore) — not yet created
```

PixiJS (`pixi.js` dependency declared) will replace the CSS hex grid in `components/game/` when rendering performance requires it.

---

## Implementation status

| Area | Client | Server |
|------|--------|--------|
| App scaffold + routing | React Router 6, 4 routes | — |
| Hex map rendering | CSS hex grid (PixiJS not yet) | — |
| Planet data fetch | Implemented (`planetService`) | `GET /infinity/planets/:planetId` |
| Hex resources | Implemented — hover panel | `GET /infinity/resources/planet/:planetId/hex/:q/:r` |
| Units — list | Implemented | `GET /infinity/planets/:planetId/units` |
| Units — move | Implemented | `POST /infinity/players/me/units/:id/move` |
| Real-time sync | `UNIT_UPDATE` via Socket.IO | `PLANET_JOIN`, `PLANET_LEAVE`, `UNIT_UPDATE` |
| Auth / session | Cookie via `withCredentials` | Cookie-based (`infinity_token`) — see [../contracts/auth-api.yaml](../contracts/auth-api.yaml) |
| Admin planet modeler | Preview generation UI | `GET /infinity/admin/planets/generate` |
| Zustand stores | Not started | — |
| PixiJS rendering | Not started (CSS grid today) | — |
| Upstream navigation | Link to `/solaris/` (gated) | `GET /infinity/players/me/can-enter-star-system` |

Planet domain model: hexagonal toroidal surface.

---

## Architecture rules

### Rendering (PixiJS + React)

- Mount PixiJS in a dedicated React component; destroy the application and release textures in `useEffect` cleanup.
- Load assets via `PIXI.Assets.load()`; avoid leaking textures or event listeners.
- Keep React for UI overlays (HUD, menus); keep the map in PixiJS for performance.
- Limit active sprites; prefer batching for static tiles.

### Coordinates

- Server uses a **hexagonal grid** (`q`/`r` or `planetX`/`planetY`) on a toroidal surface — not latitude/longitude.
- Client hex coordinate conventions: see [rules/coding.md §11](rules/coding.md).

### API and real-time

- REST base path: `/infinity/*` (Vite dev proxy forwards to `:4000`).
- Do **not** store JWT in `localStorage`, `sessionStorage`, or JS state.
- Socket.IO event names and payloads follow server gateway conventions — see [../contracts/asyncapi.yaml](../contracts/asyncapi.yaml).

### Layering

| Layer | Responsibility |
| ----- | -------------- |
| `components/ui/` | React UI only |
| `components/game/` | PixiJS canvas + thin React wrapper |
| `stores/` | Game and UI state |
| `hooks/` | Socket, map lifecycle, coordinate helpers |
| `utils/` | Pure functions (hex math, projections) |

---

## Document conventions

Shared monorepo standards: [../rules/documents.md](../rules/documents.md). Coding conventions: [rules/coding.md](rules/coding.md).

**Working directory:** Do not read, search, or follow links into any `documentation/` directory (monorepo root, this sub-project, or another sub-project) unless the user explicitly references a path. Links elsewhere in this file are pointers for the user — use `../contracts/` and source code for implementation context.

Do not create documentation files unless explicitly requested.

---

## Code style

See [rules/coding.md](rules/coding.md) for full coding conventions. Agent-specific rules:

- Before coding or answering, if something needs to be clarified, ask the user.
- Keep diffs minimal; match existing patterns before introducing new abstractions.
- UI copy and code identifiers are in **English**.

---

## API contract

**Terra View integration:** [../contracts/client-terra-view.yaml](../contracts/client-terra-view.yaml) — bootstrap flow, implemented vs planned routes, client service mapping.

Canonical server reference: [../contracts/](../contracts/) — [game-api.yaml](../contracts/game-api.yaml) (REST), [asyncapi.yaml](../contracts/asyncapi.yaml) (Socket.IO), [schemas/](../contracts/schemas/) (JSON Schema DTOs). Auth: [auth-api.yaml](../contracts/auth-api.yaml).

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| GET | `/infinity/planets/:planetId` | Public | Get or generate a planet |
| GET | `/infinity/resources/planet/:planetId` | Public | List resources on a planet |
| POST | `/infinity/players/me/enter-game` | JWT | Bootstrap first planet spawn |

Real-time: `PLANET_JOIN`, `PLANET_MOVE` — see [../contracts/asyncapi.yaml](../contracts/asyncapi.yaml).

When adding API or socket usage, define types in `src/types/` aligned with [../contracts/schemas/](../contracts/schemas/) response shapes.

---

## Do not touch

| Path | Reason |
| ---- | ------ |
| `dist/` | Generated build output |
| `node_modules/` | Dependencies |
| `package-lock.json` | Only change when adding/removing dependencies |

Do not commit secrets (`.env`, credentials). Do not create git commits unless explicitly asked.

---

## Reference docs

Index for human navigation and explicit user references — **not** for agent auto-discovery.

- [rules/coding.md](rules/coding.md) — Coding conventions for this project
- [../contracts/client-terra-view.yaml](../contracts/client-terra-view.yaml) — Client API integration contract
- [../documentation/TO-BE-FIXED.md](../documentation/TO-BE-FIXED.md) — Cross-project deferred fixes
- [README.md](README.md) — Quick start

---

## Definition of done

1. `npm run build` passes with no TypeScript errors.
2. `npm run lint` passes (or no new lint issues in touched files).
3. PixiJS resources are cleaned up on unmount — no texture or listener leaks.
4. Hex coordinate conversions match server specs — no ad-hoc Mercator/lat-lng assumptions.
5. New API or socket usage matches [../contracts/](../contracts/) (REST, AsyncAPI, and JSON Schema).
