# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ToK-Reader is a client-side SPA for browsing Swedish parliamentary debates (1900–1940). It downloads per-year SQLite databases on demand, runs them in-browser via sql.js (WebAssembly), and provides search and contextual reading of utterances.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Type-check with tsc then build for production
- `npm run lint` — ESLint (ts/tsx, zero warnings allowed)
- `npm run preview` — Preview production build locally
- `npm run build:discussions` — Regenerate `public/discussions-index.json` from `../ToK-Preparer/discussions/discussions.jsonl.gz` (commit the result)

No test suite is configured.

## Architecture

**Stack:** React 18 + TypeScript + Vite + TailwindCSS + sql.js + React Router DOM

**Three layers:**
1. **UI** — React pages/components with React Router
2. **Data** — `DatabaseManager` singleton with 3-tier cache (Memory LRU → IndexedDB via `idb` → Network fetch)
3. **Context** — `DatabaseContext` provides global database state and loading progress

**Routing:**
- `/` — HomePage with year selector grid
- `/search` — SearchPage with query params (year, query, party, gender, speaker, kvinna tags)
- `/:year/:utteranceId` — ReaderPage with infinite scroll debate reader
- `/discussions` — DiscussionsPage listing discussions from the index (filters: year, chamber, female)
- `/discussion/:discussionId` — DiscussionPage rendering a discussion's per-discussion `.jsonl` plus PDF/DOCX/JSONL download links

**Database schema:** `person` (id, name, gender, party) and `utterance` (id, content, prev, next, person_id, year, date, kammare, discussion_id, kvinna_1/2/3). Utterances form a linked list via prev/next fields.

**Discussions:** reference files live in ToK-Preparer `discussions/{year}/{date}_{fk|ak}_d{id:04d}.{pdf,docx,jsonl}` (`config.discussionFileUrl`; local `discussions` symlink in dev). `src/lib/discussions/discussions.ts` loads the slim index and per-discussion `.jsonl`.

**Key data flow:**
- `DatabaseContext` → `DatabaseManager` → `DatabaseCache` (IndexedDB) / `DatabaseLoader` (network fetch + gzip decompression via pako) → sql.js query execution
- `queries.ts` contains ~26 SQL query functions for navigation (chains, exchanges, kvinna utterances, female speakers, cross-year)
- `SearchEngine` builds parameterized SQL from search filters

## Important Configuration

- **Base path:** `/ToK-Reader/` in production (GitHub Pages), `/` in dev (`vite.config.ts`)
- **Path alias:** `@/` → `./src/`
- **Database URLs:** Local `/dbs/*.sqlite3` in dev, GitHub raw URL with `.sqlite3.gz` in production (`src/lib/utils/config.ts`)
- **sql.js WASM:** Loaded from public dir, different paths for dev vs prod
- **sql.js is excluded from Vite optimizeDeps** (loaded dynamically)
- **SPA routing on GitHub Pages:** Uses sessionStorage redirect trick in `index.html`

## Conventions

- Strict TypeScript (`tsconfig.json`)
- Types live in `src/types/` (database.ts, app.ts, search.ts)
- TailwindCSS with custom party colors defined in `tailwind.config.js` and `src/config/partyColors.json`
- Environment variable `VITE_USE_REMOTE_DB=true` forces remote database loading in dev
- `VITE_DISCUSSIONS_BRANCH` (default `main`) selects the ToK-Preparer branch for remote discussion files
