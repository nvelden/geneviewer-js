# Development plans

One plan per milestone of the [roadmap](../roadmap.md). Claude implements
them. The rules below are written so another agent could follow them too.

**Review (decided 2026-11-04):** Niels reviews at the end of each milestone
and at the points each plan marks **Niels**. Within a milestone, Claude
works through the steps without stopping, checks each one against the
review checklist, and writes the step report into the milestone's report
file, `docs/plans/reports/M<n>.md`. After Niels approves a milestone,
Claude merges it into `main` and pushes. Tags, releases and deployments
need Niels's go each time.

Read before starting any milestone:

1. [../roadmap.md](../roadmap.md): ground rules, order, versioning.
2. [../design/api.md](../design/api.md): the agreed API and spec.
3. The plan for your milestone, in full.

| Plan | Milestone |
|------|-----------|
| [M0-housekeeping.md](M0-housekeeping.md) | Housekeeping |
| [M1-fixtures.md](M1-fixtures.md) | Reference fixtures |
| [M2-core.md](M2-core.md) | Library core |
| [M3-modules-schema.md](M3-modules-schema.md) | Modules and schema |
| [M4-compile.md](M4-compile.md) | `compile()` in JavaScript |
| [M5-npm.md](M5-npm.md) | npm 0.3.0 |
| [M6-r-package.md](M6-r-package.md) | R package 0.3.0 |
| [M7-python.md](M7-python.md) | Python package 0.1.0 |
| [M8-release-1.md](M8-release-1.md) | 1.0.0 |

## Repositories

| Repo | Local path | Default branch |
|------|------------|----------------|
| geneviewer-js | `/Users/nielsvandervelden/Documents/2026 github/geneviewer-js` | `main` |
| geneviewer (R) | `/Users/nielsvandervelden/Documents/2023 github/geneviewer` | `main` |
| geneviewer-shinylive (app) | `/Users/nielsvandervelden/Documents/2025 github/geneviewer-shinylive` | `main` |
| geneviewer-python | created in M7 | `main` |

## Rules for the implementing agent

### Working

- **One branch per milestone**, named in the plan (e.g. `m1-fixtures`), made
  from an up-to-date `main`.
- **One commit per step.** The commit message starts with the step id, e.g.
  `M1.3: Render fixtures in headless Chrome`.
- **After every step**, add its step report (below) to
  `docs/plans/reports/M<n>.md`. Stop for review only at the end of the
  milestone, at the points marked **Niels**, or when a step needs a
  decision.
- **Stay inside the step.** If something outside it needs changing, note it
  in the report under "Found along the way"; do not fix it.
- **When unsure, stop and ask.** Do not guess at behaviour the plan does not
  describe.

### Never, unless the plan step says so and the reviewer has approved

- Tag, publish (npm, PyPI, CRAN), deploy or open pull requests.
- Merge into `main` or push `main` before Niels has approved the
  milestone. The exception is a bug fix in R (see below). Pushing a
  milestone branch to GitHub to run CI is allowed.
- Change the R repo's `read-clinker` branch, which holds unrelated work.
- Install packages into Niels's R library, or change the app repo. Use
  `npm run try-app`, which works on temporary copies.
- Change or regenerate test baselines (`test/fixtures/**`) to make a test
  pass. Baselines change only in steps that say so, and the report lists
  every changed file.
- Change chart output on purpose without an approved row in the roadmap's
  exceptions table. Propose the row (unapproved) and stop.
- Mention other genome visualisation tools in code, docs, NEWS or commit
  messages.
- Put data loading or processing into the JS library. File readers,
  alignment, matching genes for links, introns, align and normalize stay in
  R and Python; see design/api.md, Decision 1.

### Bugs found in the R package

When porting shows that R's current behaviour is a bug:

1. Fix it in the R repo on `main`, with a regression test, following
   `dev/BUGLIST.md` (add a row; no demo app needed unless the fix is
   unclear).
2. Regenerate the affected fixtures with the export script, and list them
   in the report.
3. Port the fixed behaviour. The fix ships with R 0.3.0.

### Style

- **JavaScript:** plain JS with JSDoc on every exported function; no
  TypeScript source. Follow the existing code's formatting.
- **R:** follow the package's style; roxygen docs for anything exported.
- **Python (M7):** ruff-formatted, type hints, docstrings in numpy style.
- **Writing:** plain English, short sentences; say what something does, not
  how good it is.

## Step report

Hand this over at the end of every step:

```markdown
## M<n>.<k>: <step title>

**Commit:** <hash> on <branch>

**Done:**
- <what changed, by file>

**Checks run:**
- `<command>`: <result, e.g. "143 passed, 0 failed">

**Deviations from the plan:** <none, or what and why>

**Found along the way:** <issues outside this step, or none>

**Questions:** <none, or what the reviewer must decide>
```

## Review checklist (for the reviewer)

For every step:

- The diff does what the step says and nothing else.
- Every check in the step was run and passed; rerun at least one yourself.
- No baselines changed, unless the step says so.
- No change in chart output without an approved exception.
- Code style matches the surrounding code; JSDoc on exports.
- The report is accurate about what was done.

Reply "approved", or list what must change. Escalate to Niels when a step
needs a decision the plan leaves open.

## Commands

| Command | Repo | What it does |
|---------|------|--------------|
| `npm run check` | geneviewer-js | Syntax check of the sources |
| `npm run build` | geneviewer-js | Build `dist/` |
| `npm test` | geneviewer-js | Fixture tests (from M1) |
| `npm run try-app` | geneviewer-js | Run the app with this repo's JS and its tests |
| `Rscript -e 'devtools::test()'` | geneviewer | R package tests |
| `R CMD check --as-cran` | geneviewer | Full package check |
