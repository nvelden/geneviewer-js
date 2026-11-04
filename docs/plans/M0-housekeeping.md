# M0: Housekeeping

**Goal:** a clean starting point. Open work committed, the bug list triaged.
**Repos:** geneviewer-js, geneviewer (R).
**Branch:** `m0-housekeeping` in geneviewer-js; `m0-triage` in the R repo.

## Steps

### M0.1: Commit the open work in geneviewer-js

Commit what is in the working tree:

- `scripts/try-app.sh` and the `try-app` script in `package.json`
- README sections "Trying a change in the Shiny app"
- `docs/design/api.md`, `docs/roadmap.md`, `docs/plans/`
- `site/index.html` and `site/api.html` (roadmap and versioning text)

Check `.gitignore` covers `.try-app.env`, `dist/` and `_site/`.

**Checks:**
- `npm run check && npm run build && npm run site` succeed.
- `npm run try-app` passes: the app's testthat suite and the 12 browser
  tests. Stop the app afterwards.
- `git status` is clean apart from ignored files.

### M0.2: Triage the bug list (R repo)

In `dev/BUGLIST.md`, add a section "Triage for the JS library (2026-11)":

- B01 to B61 are fixed except **B48** (`read_gff`: repeated keys give list
  columns; no GTF/GFF2 support).
- B48 is a reader issue, not a rendering one; it does not block M1 to M6.
  It is scheduled in M7, step M7.5, fixed in R before the Python reader
  is written.

**Check:** only `dev/BUGLIST.md` changed.

## Done when

- **Niels:** approves the milestone. Claude then merges both branches into
  `main` and pushes; pushing geneviewer-js `main` redeploys the docs site.
