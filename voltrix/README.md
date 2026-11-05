# VOLTRIX
Precision meets performance. Created by KooKieNinja.

## Run locally (Node 18+; Node 22.6+ for `npm test`)
    npm install
    npm run dev       # http://localhost:5173
    npm run build     # type-check + production build
    npm run preview   # serve the production build
    npm test          # 47 checks on the scoring engines and CSV parsers

## Routes (hash-based)
#/mouse-finder · #/finder/{keyboard|mousepad|iem|headphone|monitor} · #/mice · #/mice/<id>
#/setup · #/pro · #/games · #/compare · #/analytics

## Data rules
Catalogs: src/data/mice.ts, src/finders/catalog.ts, PRO_SEED in src/pages/Pro.tsx.
Every entry needs a source URL and verification date; unknown values stay undefined and render as "Not available".
Rows can also be imported as CSV in-app (saved in browser localStorage).
Themes: electric (default), violet, chrome, phantom. Tunable heuristics: src/lib/mouseEngine.ts and src/finders/categories.ts.
