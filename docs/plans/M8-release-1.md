# M8: 1.0.0

**Goal:** the library is declared stable. Spec v1 is frozen, and from now on
changes follow semantic versioning.
**Repos:** geneviewer-js; then routine updates in R and Python.
**Needs:** R 0.3.0 on CRAN and Python 0.1.0 on PyPI.

## Steps

### M8.1: Collect API changes

List every API or spec change made since npm 0.3.0, if any, from the
changelogs of the library, R and Python. Each must be in the schema and the
docs.

### M8.2: Freeze

- Mark the schema `spec-v1` as final; any later change to it is additive
  only.
- Add `CHANGELOG.md` to the library, and a "Stability" section to the docs:
  what semantic versioning covers (the API, the spec, events) and what it
  does not (SVG markup details, CSS class names).

### M8.3: Release 1.0.0

With **Niels's** approval: version `1.0.0`, tag, publish (npm through the
M5 workflow).

### M8.4: R and Python on 1.0.0

- **R:** `dev/update_js.R 1.0.0` in the next feature release. No separate
  CRAN release just for this.
- **Python:** the same with `scripts/update_js.py 1.0.0` and a patch
  release.

## Done when

`geneviewer` 1.0.0 is on npm, and the docs state what stability covers.
