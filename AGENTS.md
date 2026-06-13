# AGENTS.md — Terra View

2D planetary surface visualization client for **Infinity** (hex map, biomes, resources, multiplayer sync). React 18 + TypeScript + Vite SPA with **PixiJS 7** for map rendering.

**Monorepo context:** [../AGENTS.md](../AGENTS.md) · **Known gaps:** [../documentation/TO-BE-FIXED.md](../documentation/TO-BE-FIXED.md)

---

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server → http://localhost:3000/terra-view/
npm run build        # Type-check (tsc) + production build → dist/
npm run preview      # Preview production build
npm run lint         # ESLint on .ts / .tsx
```

No test runner is configured yet. After changes, run `npm run build` and `npm run lint`.

**Local dev:** Start databases and the Infinity server first (see root [AGENTS.md](../AGENTS.md)). Vite proxies `/infinity/*` to `http://localhost:4000`. Optional: Caddy on port 80 for same-origin routing at `http://localhost/terra-view/` or `http://infinity-dev.home.rh/terra-view/`.

| Field | Value |
|-------|-------|
| Dev port | `3000` |
| Base path | `/terra-view/` |
| API prefix | `/infinity/*` (REST + Socket.IO planned) |

---

## Project structure

Current scaffold (early stage):

```
src/
├── App.tsx              # Root component (placeholder)
├── main.tsx             # React entry point
└── vite-env.d.ts
index.html
vite.config.ts           # base: /terra-view/, dev proxy to :4000
```

Target layout (from [../documentation/terra-view/terra-view-setup.md](../documentation/terra-view/terra-view-setup.md)):

```
src/
├── assets/              # Static resources, tilesets, sprites
├── components/          # React UI + PixiJS canvas wrappers
│   ├── ui/              # HUD, menus, inventory
│   └── game/            # PlanetMap, Player, Resource
├── hooks/               # useSocket, usePlanetMap, etc.
├── stores/              # Zustand (gameStore, uiStore)
├── types/               # game, socket, API types
├── utils/               # Coordinate math, helpers
├── App.tsx
└── main.tsx
```

---

## Implementation status

| Area | Client | Server |
|------|--------|--------|
| App scaffold | React + Vite placeholder | — |
| PixiJS map rendering | Not started | — |
| Planet data fetch | Not started | `GET /infinity/planets/:planetId` |
| Resources | Not started | `GET /infinity/resources/planet/:planetId` |
| Real-time sync | Not started | Socket.IO `PLANET_JOIN`, `PLANET_MOVE` |
| Auth / session | Not started | Cookie-based (`infinity_token`) — see [../infinity/documentation/auth.md](../infinity/documentation/auth.md) |
| Upstream navigation | Planned from `/solaris/` | Galaxy View and Solar System View not in repo yet |

Planet domain model: hexagonal toroidal surface — see [../infinity/documentation/objects/planet.md](../infinity/documentation/objects/planet.md) and [../infinity/documentation/planets/hexagonal-planet-specification.md](../infinity/documentation/planets/hexagonal-planet-specification.md).

---

## Architecture rules

### Rendering (PixiJS + React)

- Mount PixiJS in a dedicated React component; destroy the application and release textures in `useEffect` cleanup.
- Load assets via `PIXI.Assets.load()`; avoid leaking textures or event listeners.
- Keep React for UI overlays (HUD, menus); keep the map in PixiJS for performance.
- Limit active sprites; prefer batching for static tiles.

### Coordinates

- Server uses a **hexagonal grid** (`q`/`r` or `planetX`/`planetY`) on a toroidal surface — not latitude/longitude.
- Client must convert between hex coordinates and screen pixels; follow [../infinity/documentation/planets/hexagonal-planet-specification.md](../infinity/documentation/planets/hexagonal-planet-specification.md).

### API and real-time

- REST base path: `/infinity/*` (Vite dev proxy forwards to `:4000`).
- Use `withCredentials: true` on HTTP clients when auth cookies are required.
- Do **not** store JWT in `localStorage`, `sessionStorage`, or JS state.
- Socket.IO client integration is planned; event names and payloads follow server gateway conventions.

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

Shared monorepo standards: [../rules/documents.md](../rules/documents.md).

Setup guide [../documentation/terra-view/terra-view-setup.md](../documentation/terra-view/terra-view-setup.md) is in **French**; code, paths, and API identifiers stay in **English**. Do not create documentation files unless explicitly requested.

---

## Code style

- TypeScript strict mode — no `any` unless unavoidable; prefer explicit interfaces in `src/types/`.
- Functional components and hooks only.
- Keep diffs minimal; match existing patterns before introducing new abstractions.
- UI copy and code identifiers are in **English**.

---

## API contract

Canonical server reference: [../infinity/documentation/infinity-api.md](../infinity/documentation/infinity-api.md).

| Method | Route | Auth | Description |
| ------ | ----- | ---- | ----------- |
| GET | `/infinity/planets/:planetId` | Public | Get or generate a planet |
| GET | `/infinity/resources/planet/:planetId` | Public | List resources on a planet |
| POST | `/infinity/players/me/enter-game` | JWT | Bootstrap first planet spawn |

Real-time: `PLANET_JOIN`, `PLANET_MOVE` — see server socket gateway and [../infinity/documentation/first-planet/first-planet-specifications.md](../infinity/documentation/first-planet/first-planet-specifications.md).

When adding API or socket usage, define types in `src/types/` aligned with server responses.

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

- [../documentation/terra-view/terra-view-setup.md](../documentation/terra-view/terra-view-setup.md) — Stack, structure, and setup (French)
- [../documentation/architecture/3clients-analysis.md](../documentation/architecture/3clients-analysis.md) — Three game clients analysis
- [../infinity/documentation/infinity-api.md](../infinity/documentation/infinity-api.md) — Server API overview
- [../infinity/documentation/objects/planet.md](../infinity/documentation/objects/planet.md) — Planet domain object
- [../infinity/documentation/planets/hexagonal-planet-specification.md](../infinity/documentation/planets/hexagonal-planet-specification.md) — Hex surface spec
- [../infinity/documentation/first-planet/first-planet-specifications.md](../infinity/documentation/first-planet/first-planet-specifications.md) — First playable planet flow
- [../documentation/TO-BE-FIXED.md](../documentation/TO-BE-FIXED.md) — Cross-project deferred fixes
- [README.md](README.md) — Quick start

---

## Definition of done

1. `npm run build` passes with no TypeScript errors.
2. `npm run lint` passes (or no new lint issues in touched files).
3. PixiJS resources are cleaned up on unmount — no texture or listener leaks.
4. Hex coordinate conversions match server specs — no ad-hoc Mercator/lat-lng assumptions.
5. New API or socket usage matches [../infinity/documentation/infinity-api.md](../infinity/documentation/infinity-api.md).
