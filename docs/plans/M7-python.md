# M7: Python package 0.1.0

**Goal:** `geneviewer` 0.1.0 on PyPI. It works in Shiny for Python and
gets Python users from files to figures as the R package does.
**Repo:** new, `nvelden/geneviewer-python`; created in M7.1 with **Niels's**
approval. The R repo is touched in M7.5 only (B48).
**Branch:** `main` in the new repo until its first commit, then
`m7-<step>` branches.
**Needs:** M6 done. The library API is proven by R; the Python package
uses the same spec.

## Scope of 0.1.0

| In | Later |
|----|-------|
| Chart API building the spec | Jupyter (anywidget) |
| Shiny for Python output and inputs | Standalone HTML export, Quarto |
| `read_gbk`, `read_gff`, `read_fasta`, `read_bed`, `gbk_features_to_df` | Pyodide / Shinylive |
| `protein_blast`, `mummer_alignment`, `genbank_to_fasta`, `get_introns` | |
| The bundled example datasets | |

Supported Python: 3.10 to 3.13.

## Steps

### M7.1: Repository

- **Niels:** approves creating the public repo and registering the name
  `geneviewer` on PyPI.
- **Layout:**
  - `src/geneviewer/` with a `pyproject.toml` built by `hatchling`;
  - dependencies `pandas`, `jsonschema`, and `shiny` as an optional extra
    (`geneviewer[shiny]`); `biopython` as an optional extra
    (`geneviewer[align]`);
  - dev dependencies `pytest`, `ruff` and `playwright`.
- **CI:** ruff, pytest on 3.10 to 3.13 (Linux, macOS, Windows), and the
  browser tests on Linux.
- **License:** MIT, matching R.

### M7.2: Vendor the library

- `scripts/update_js.py <version>`:
  - downloads `geneviewer.min.js`, `geneviewer.css`, `themes.json`,
    `spec-v1.schema.json` (add it to the library's release assets in a
    small library PR first) and `SHA256SUMS`;
  - verifies them and writes them to `src/geneviewer/static/`.
- A test checks the checksums.

### M7.3: Chart API

```python
from geneviewer import GC

chart = (
    GC(df, cluster="cluster", group="class", height="400px")
    .labels("name")
    .links("class", measure="identity")
    .legend(position="top")
    .theme("dark")
)
spec = chart.to_spec()   # dict, valid against the schema
```

- One method per spec component, named after the R function without `GC_`
  in snake_case (`cluster_title`, `scale_bar`, `element_style`, ...).
  Each method returns a new chart; charts are immutable.
- Keyword arguments in snake_case are mapped to the spec's camelCase
  names; camelCase is accepted too. Argument names, defaults and checks
  follow R's, with R's error messages adapted.
- `cluster=` is accepted as in R and becomes `clusters` in the spec.
- Data:
  - a pandas DataFrame, sent as columns;
  - dates and categoricals converted the same way R's `jsonlite` converts
    them;
  - `NaN`/`None` become `null`.
- `to_spec()` validates against the vendored schema.
- **Parity test:** for every geneviewer-js fixture whose `call.R` uses only
  functions available in Python, a hand-written Python equivalent in
  `tests/parity/` gives a spec equal to the fixture's `spec.json`.

**Niels:** approves the method and argument names (`docs/NAMING.md`, one
table mapping R to Python).

### M7.4: Shiny for Python

- `geneviewer.shiny`:
  - `output_geneviewer(id, width="100%", height="400px")`;
  - `@render_geneviewer`, which returns a `GC`;
  - `zoom_to(id, range, session=None)`, the `GC_zoom_to` equivalent.
- An output binding in `static/geneviewer-shiny.js`: `newChart` on the
  first value, `chart.update` after that. It sends the same events as R's
  binding, with the same input names (`<id>_click`, `_select`,
  `_selection`, `_dblclick`, `_drag`, `_moves`, `_zoom`, `_rendered`) and
  `priority: "event"`.
- `examples/shiny/app.py`: reproduces the six docs-site examples and shows
  the event inputs.
- **Browser tests** (playwright): the example app draws all charts;
  clicking a gene sets `input.<id>_select()`; `zoom_to` moves the window.

### M7.5: File readers

1. **R first:** fix B48 in the R repo on branch `m7-b48`, following
   `dev/BUGLIST.md`'s workflow (demo, Niels decides, fix, NEWS). Merge
   before porting `read_gff`.
2. Port `read_gbk`, `gbk_features_to_df`, `read_gff`, `read_fasta`,
   `read_bed`, `genbank_to_fasta` and `get_introns` from R, including the
   fixes from B03 to B08, B19, B22 and B57.
3. **Parity fixtures:** an R script, `scripts/export_reader_fixtures.R`,
   reads every file in the R package's `inst/extdata` plus the test files in
   its `tests/testthat` and writes the resulting tables as JSON to
   `tests/readers/expected/`. Python must return equal tables: same
   columns, order, types and values.

### M7.6: Chart data processing

Port the processing that R's chart functions do before building the spec,
with **identical** results to R:

- matching genes for links (`get_links`, used by `.links(group=...)`);
- introns from exons (`get_introns`, used by `.transcript(...)`);
- `.align(...)` and `.normalize(...)` (from `R/gene_alignment.R` and
  `R/gene_normalization.R`).

**Parity:** the parity test from M7.3 covers these. Fixtures using
`GC_links(group = )`, `GC_transcript`, `GC_align` and `GC_normalize` must
give the same `spec.json`.

### M7.7: Alignment

- **`protein_blast`:**
  - Read `R/cluster_blast.R` first. It calls
    `pwalign::pairwiseAlignment()` on character vectors with default
    settings. Confirm in pwalign's docs the exact type, scoring and gap
    penalties that gives, and write them in the function's docstring.
  - Replicate them with Biopython's `PairwiseAligner`, and the identity and
    similarity computation (`compute_identity`).
  - Keep R's behaviour on ties: equal best matches give duplicated rows, by
    design.
- **Comparison:** on the bundled datasets (`erythromycin_BlastP` inputs and
  others), compare hits and identity values with R's. Results should be
  close: document every difference, with its cause, in the docstring and in
  `docs/differences.md`.
- **`mummer_alignment`:** port the subprocess calls and the parsing
  (`parse_nucmer`), with paths quoted and file matching anchored (B20).
  Skip its tests when MUMmer is not installed.

### M7.8: Datasets and docs

- Ship the R package's example datasets as Parquet files, loaded by
  `geneviewer.datasets.load("ophA_clusters")`.
- The README covers install, a first chart in Shiny, readers and alignment.
- A docs page on the library's site, "Python", with the same examples.

### M7.9: Release

- `.github/workflows/publish.yml`: on tags `v*`, build the sdist and wheel
  and publish with PyPI trusted publishing.
- **Niels, once:** set up the trusted publisher on PyPI.
- With **Niels's** approval: tag `v0.1.0`. Afterwards, `pip install
  geneviewer[shiny]` in a fresh virtual environment runs
  `examples/shiny/app.py`.

## Done when

`geneviewer` 0.1.0 is on PyPI, and the example Shiny app reproduces the
docs-site charts in a fresh install.
