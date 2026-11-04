# M3: Modules and schema

**Goal:** the source as ES modules built with esbuild, and the public chart
spec (v1) defined as a JSON Schema that Niels has approved.
**Repo:** geneviewer-js (reads the R package for argument names and docs).
**Branch:** `m3-modules-schema`.
**Needs:** M2 merged.

## Steps

### M3.1: esbuild, no code changes

- Add `esbuild` as a devDependency, pinned exactly.
- `scripts/build.mjs` builds `dist/geneviewer.js` from an entry file that
  imports the existing sources unchanged, as an IIFE with global name
  `geneviewer`, not minified, and with `d3` read from the global.
- Library functions that the binding used as globals are now reached
  through `geneviewer.*`. After M2 the binding only uses `newChart`; check
  with grep.

**Checks:** `npm test`, the interaction tests and `try-app` pass.

### M3.2: Split into modules

Split `src/geneviewer.js` into `src/lib/*.js`, moving code without
rewriting it. Suggested modules, following the file's own sections:

| Module | Contents |
|--------|----------|
| `util.js` | ids, `wrap`, `computeSize`, option merging, `toRows` |
| `style.js` | style helpers, `applyStyleToElement`, `setStyleFromOptions` |
| `color.js` | colour scales, palettes, patterns |
| `scale.js` | discontinuous scales, scale padding |
| `text.js` | `styledSegments`, `parseAndStyleText`, label adjuster |
| `export.js` | `chartToSVG`, `chartToPNG`, downloads |
| `links.js` | links, colour bar |
| `container.js` | the `container` class and `createContainer` |
| `components/*.js` | one per drawn part (title, legend, genes, labels, transcript, coordinates, scaleBar, annotations, footer, cluster title/label, trackMouse, zoom) adding methods to `container.prototype` |
| `chart.js` | `newChart` (from M2) |
| `index.js` | imports everything, exports the public API |

- Each module imports what it uses; no implicit globals. Running `esbuild
  --bundle` with `--log-level=warning` must report none.
- `src/styles.css` is unchanged.

**Checks:**
- `npm test`, interaction tests and `try-app` pass.
- `dist/geneviewer.js` is still readable (not minified).

### M3.3: Schema draft

`schema/spec-v1.schema.json`, JSON Schema 2020-12.

**Source of truth:** the R functions. For each exported `GC_*`, read its
formals and its `man/*.Rd` argument text.

**Naming rules**, from design/api.md:
- `GC_labels` becomes `labels`, and so on for each function.
- `snake_case` arguments become camelCase (`show_links` → `showLinks`);
  arguments already in camelCase stay as they are.
- R's `cluster =` argument becomes `clusters`: an array of names or
  1-based positions.
- An argument taking an R list of style options becomes an object with
  `additionalProperties` allowed: CSS-like style keys, the same as R.
- A component may be an object or an array of objects (per-cluster
  entries applied in order).

**Defaults:** every property's `default` is R's default, and
`description` is the Rd text rewritten in one or two sentences.

**Top level:**
- `version` (const 1), `data` (rows or columns), `fields`, `width`,
  `height`;
- every component key from the design document.

Also write `schema/NAMING.md`: one table with each R function and argument
and its spec name. Mark every case where the rules gave an awkward name, and
propose an alternative.

**Checks:**
- `npm run schema:check` validates the schema itself with ajv, and checks
  that every R argument from `test/coverage.md` has a spec name.

**Niels:** reviews `schema/NAMING.md` and decides every marked case. This is
the most important review in the project: these names become public.

### M3.4: Types

- JSDoc on `newChart` and every public method.
- `scripts/build-types.mjs`:
  - `json-schema-to-typescript` turns the schema into `dist/spec.d.ts`;
  - `tsc --allowJs --declaration --emitDeclarationOnly` turns the JSDoc into
    `dist/geneviewer.d.ts`, which imports `spec.d.ts`.
- `tsc --noEmit --checkJs` over `src/` with a `jsconfig.json`; fix type
  errors only where the fix does not change behaviour, and list the rest
  in the report.

**Checks:** a small `test/types/usage.ts` compiles against the `.d.ts`
files; `npm test` passes.

## Done when

- Source is ES modules; all tests and `try-app` pass; baselines unchanged.
- **Niels** has approved `schema/NAMING.md`; the schema matches it.
- Branch merged.
