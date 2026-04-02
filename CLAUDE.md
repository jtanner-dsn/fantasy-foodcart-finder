# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What this project is

*Adventurer's Food-Cart Finder* — a fantasy-themed food vendor directory for the fictional city of **Misthaven**. UI language uses "carts", "stalls", "merchants", "travelers" throughout. Cuisine names are modern food with fantasy cart names (e.g., Dragon-Fired Pizza Lair, Eye of the Beholder BBQ).

**Primary goal:** Learning AI-assisted full-stack development. The app itself is secondary to the workflow.

---

## Running the stack

Three separate processes, no Docker:

```bash
# 1. PostgreSQL — must already be running locally on :5432
#    Database: foodtruck_finder, user: postgres, password: postgres

# 2. Go API  (from api/)
cd api && go run ./cmd/server/...
# Listens on :8080. Reads DATABASE_URL env var; falls back to postgres://postgres:postgres@localhost:5432/foodtruck_finder?sslmode=disable

# 3. Next.js frontend  (from web/)
cd web && npm run dev
# Listens on :3000
```

**Never start two Next.js instances** — if port 3000 is taken, Next.js silently moves to :3001, breaking CORS (which is hardcoded to `http://localhost:3000`).

---

## Build & test commands

```bash
# Go — compile check
cd api && go build ./...

# Go — run a single handler file (no test suite yet)
cd api && go vet ./...

# Frontend — TypeScript check
cd web && npx tsc --noEmit

# Frontend — lint
cd web && npm run lint

# Playwright tests (requires both servers running)
cd web && npx playwright test
cd web && npx playwright test --reporter=list          # verbose output
cd web && npx playwright test -g "merchant can create" # run one test by name

# Apply DB migrations (run manually against psql)
psql -U postgres -d foodtruck_finder -f api/migrations/001_initial_schema.sql
```

Playwright uses **Firefox** (Chromium requires `libnspr4`/`libnss3` which need `sudo apt-get install`). Tests are in `web/tests/`.

---

## Architecture

```
/
├── api/          Go REST API (:8080)
├── web/          Next.js frontend (:3000)
├── maps/         Source map images (4096×4096 PNG, normal + sepia)
└── README.md     Feature phases, data model, design decisions
```

**Next.js is a pure UI layer.** All business logic and DB access lives in Go. No Next.js API routes.

### Go API (`api/`)

```
cmd/server/main.go          Entry point — router wiring
internal/
  db/db.go                  pgxpool connection
  handlers/
    health.go               GET /health
    badges.go               GET /v1/badges  (Phase 1 stack check, temporary)
    carts.go                Cart + menu-item CRUD
  middleware/cors.go         Hardcoded to http://localhost:3000
migrations/
  001_initial_schema.sql    All tables + badge seed data
```

Route registration is in `main.go`. Handler functions follow the pattern `HandlerName(pool) http.HandlerFunc`.

### Next.js frontend (`web/`)

```
app/
  layout.tsx                RoleProvider + NavBar wrap every page
  page.tsx                  Redirects to /traveler or /merchant based on localStorage
  merchant/
    page.tsx                Merchant dashboard — lists own carts
    new/page.tsx            Create cart form
    [id]/edit/page.tsx      Edit cart form
  traveler/
    page.tsx                Traveler view (Phase 3+)
components/
  NavBar.tsx                Header + RoleSelector
  RoleSelector.tsx          Traveler/Merchant toggle
  CartForm.tsx              Shared create/edit form (map picker, menu items)
  MapPicker.tsx             Leaflet CRS.Simple map, click to pin
context/
  RoleContext.tsx            role + sessionToken — read from localStorage on mount
lib/
  session.ts                localStorage helpers (mh_session_token, mh_role)
  api.ts                    Typed fetch wrappers for all Go endpoints
```

### Auth model (MVP)

No accounts. Each browser gets a UUID `sessionToken` stored in `localStorage` as `mh_session_token`. This acts as the `operator_id` / `traveler_id` FK in every table. Role (`merchant` | `traveler`) is stored as `mh_role` in `localStorage`. The schema is designed so real auth can be added later without structural changes.

**Important:** `sessionToken` starts as `''` on first render (SSR default) and hydrates in a `useEffect`. Any component that gates on `sessionToken` must handle the empty-string initial state (e.g., `if (!sessionToken) return`).

### Map

`MapPicker` uses Leaflet `CRS.Simple` with the 4096×4096 Misthaven PNG served from `web/public/maps/`. Coordinates stored in DB as `location_x` / `location_y` (pixel coords, origin top-left). Leaflet's `[lat, lng]` maps to `[y, x]` in pixel space.

### Playwright test pattern

Tests use `addInitScript` to pre-seed `localStorage` before navigation (avoids race with the home page's `router.replace` redirect). The switch/toggle must be activated with `.focus()` + `.press('Space')` in Firefox — `.click()` does not fire React's synthetic event reliably.

---

## Database schema summary

| Table | Key fields |
|---|---|
| `carts` | `operator_id` (session token), `location_x/y`, `is_open`, `hours_text`, `district` |
| `menu_items` | FK → `carts`, `price NUMERIC(10,2)` |
| `ratings` | FK → `carts`, `traveler_id`, `stars 1–5`, UNIQUE per traveler+cart |
| `passport_stamps` | `traveler_id`, FK → `carts`, UNIQUE per traveler+cart |
| `badges` | `criteria_type` (`stamp_count` \| `cuisine_variety` \| `district_count`) |
| `traveler_badges` | `traveler_id`, FK → `badges` |

---

## Feature phases

| Phase | Status | Summary |
|---|---|---|
| 1 — Foundation | ✅ Done | Scaffolding, schema, role selector |
| 2 — Merchant Core | ✅ Done | Cart CRUD, map pin, hours/status, menu items |
| 3 — Traveler Browse | ✅ Done | Map view of all carts, detail pages, filters |
| 4 — Ratings | ✅ Done | Star rating + review per cart |
| 5 — Passport | ✅ Done | Stamps, badges, leaderboard |
| 6 — Polish | ✅ Done | Fantasy fonts, mobile layout, loading/empty/error states |
| 7 — Deploy | ⬜ Next | Railway (Go+PG) + Vercel (Next.js) |

### Misthaven city districts
`Midheath`, `Peridozys`, `Beerside`, `Westheath`, `Aspenlane`, `Oakcorner`

Coastal city — sea to the north, river to the east, forest south-east, farmland surrounds.
