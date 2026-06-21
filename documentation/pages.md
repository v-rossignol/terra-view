# Terra View Pages

```yaml
date: 2026-06-21
author: Roro LeSage
model: Composer
sources:
  - src/App.tsx
  - src/components/FirstPage.tsx
  - src/components/PlanetModelerPage.tsx
  - src/components/PlanetHexPage.tsx
  - src/components/PlanetRelocatePage.tsx
  - AGENTS.md
```

## Overview

Terra View is a React SPA served at base path `/terra-view/`. Routes are defined in `src/App.tsx` and rendered with React Router (`basename="/terra-view"`).

---

## Pages

| Route | Component | Description |
| ----- | --------- | ----------- |
| `/` | `FirstPage` | Default entry. Authenticates the player, loads their current planet, and shows the hex surface map with their position. |
| `/modeler` | `PlanetModelerPage` | Admin preview tool. Generate a planet from **radius**, **type**, and **seed**, then inspect the surface and hex resources. |
| `/:planetId/:q/:r` | `PlanetHexPage` | Single-hex view. Loads the planet surface cell at axial coordinates `(q, r)` and displays biome, danger level, and resources. |
| `/:planetId` | `PlanetRelocatePage` | Moves the player to the given planet via `POST /infinity/players/me/location/enter-planet`, then redirects to `/`. Shows loading or error if relocation fails. |

---

## Related documents

- [AGENTS.md](../AGENTS.md) — Terra View commands, architecture, and API contract
- [client-terra-view.yaml](../contracts/client-terra-view.yaml) — Bootstrap flow and client service mapping
