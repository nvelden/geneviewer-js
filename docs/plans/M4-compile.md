# M4: `compile()` in JavaScript

**Goal:** the library turns a spec into the render model itself, exactly
as R does today, for everything that is chart building. For every fixture,
`compile(spec)` equals R's payload, apart from approved exceptions.

**Boundary:** data processing stays in R (design/api.md, Decision 1). The
spec carries its results: links as a table of pairs, transcripts with their
intron rows, positions already aligned or normalised. It is not ported.
**Repos:** geneviewer (R): step M4.1 only; geneviewer-js: all other steps.
**Branches:** `m4-record-spec` in the R repo; `m4-compile` in geneviewer-js.
**Needs:** M3 merged and the schema approved.

## Background

R resolves a chart before the JavaScript sees it. Where that happens:

| R file | Functions | What it resolves |
|--------|-----------|------------------|
| `R/geneviewer.R` | `GC_chart` | data, fields, strand, cluster split into `series`, sizes |
| `R/utils.R` | `add_strand`, `add_gene_track`, `update_cluster_data`, `get_scale_breaks`, `break_padding_bp`, `compute_size`, `get_relative_height`, `keep_color_options`, `set_legend_colors`, `keep_chart_settings`, `recycle_at`, ... | shared helpers |
| `R/chart_genes.R` | `GC_labels`, `GC_genes`, `GC_transcript`, `GC_color`, `GC_pattern`, `GC_legend` | genes, labels, colours, patterns, legend |
| `R/chart_layout.R` | `GC_title`, `GC_clusterTitle`, `GC_sequence`, `GC_grid`, `GC_scale`, `GC_scaleBar`, `GC_clusterLabel`, `GC_clusterFooter`, `GC_coordinates`, `GC_cluster` | layout and per-cluster parts |
| `R/chart_links.R` | `GC_links` | link drawing options and colour bar (port); `get_links` gene matching (stays in R) |
| `R/chart_align.R`, `R/gene_alignment.R`, `R/gene_normalization.R` | `GC_align`, `GC_normalize` | coordinate shifts (stay in R) |
| `R/chart_interaction.R` | `GC_annotation`, `GC_trackMouse`, `GC_events`, `GC_toolbar`, `GC_zoom`, `GC_zoom_to`, `GC_tooltip` | annotations, interaction settings |
| `R/element_style.R` | `GC_element_style` | single-element overrides |
| `R/theme.R` | `GC_theme`, `builtin_themes`, `geneviewer_palettes`, `resolve_theme`, `render_theme`, ... | themes and palettes |

Not ported; these stay in R and Python: `read_*`, `gbk_features_to_df`,
`get_introns`, `get_links`, `GC_align`, `GC_normalize` (with
`R/gene_alignment.R` and `R/gene_normalization.R`), `protein_blast`,
`mummer_alignment`, `genbank_to_fasta`, `widen_attributes`.

## Steps

### M4.1: R records the spec (R repo)

- Behind an option, `options(geneviewer.record_spec = TRUE)`, off by
  default: `GC_chart` starts `widget$x$spec` with `version`, the **original**
  data as columns, `fields`, `width` and `height`. Every `GC_*` function
  then adds what it was called with, under its spec key and with the spec
  names from `schema/NAMING.md`.
- Repeated calls or calls with `cluster =` append to that key's array, in
  call order.
- Record chart arguments as given, not as resolved: no defaults filled in,
  no recycling, no theme expansion.
- **Data processing writes data.** The spec holds the results of data
  processing, not the request:
  - `GC_links(group = )` records the links table that `get_links` made,
    in `links.data`;
  - `GC_transcript()` records the data with the intron rows from
    `get_introns`;
  - `GC_align()` and `GC_normalize()` update `spec$data` with the shifted
    positions.
- R tests: with the option off, every existing test passes and payloads are
  byte-identical to before. With it on, the spec validates against
  `schema/spec-v1.schema.json`; test this with `jsonvalidate` in a test
  skipped when that package is missing.

**Checks:**
- `devtools::test()` passes.
- `R CMD check` has no new notes.
- For every M1 fixture, the payload is unchanged with the option off.

### M4.2: Regenerate fixtures with specs (geneviewer-js)

- `scripts/export-fixtures.R` sets the option and also writes
  `test/fixtures/<id>/spec.json`.
- `payload.json` must be byte-identical to M1's. The step fails otherwise:
  the option must not change output.
- `npm run spec:check` validates every `spec.json` against the schema.

### M4.3: Comparison harness

- `src/compile/index.js` exports `compile(spec) → renderModel`; at first
  it builds only the top-level skeleton.
- `test/compile.mjs`, run as `npm run test:compile`, runs in Node, without
  a browser:
  - For each fixture, compares `compile(spec)` with `payload.json` **per
    key path**, and prints a table of fixture against component with
    pass/fail.
  - Takes `--only <component>` and `--fixture <id>`.
- **Comparison rules**, which must be written in the test file's header:
  - Numbers are equal within 1e-9 relative difference; this covers R's
    JSON digit rounding.
  - R's JSON rules are mirrored: length-1 vectors are scalars, `NULL` is
    left out, and an empty `list()` is `[]` or `{}` as htmlwidgets writes
    it. A key R leaves out and a key the JS leaves out are equal.
  - Any other difference is a failure.
- Add `compile` to the public API: `geneviewer.compile`.

**Check:** the harness runs and reports everything as failing except the
skeleton.

### M4.4 to M4.12: Port by component

One step per group, in this order. In each step:

- Port the R logic for the group into `src/compile/<group>.js`, reading
  the R source listed above. Port behaviour exactly, including R details:
  - **Factor order:** R sorts groups alphabetically in the C locale unless
    they are factors; check what `GC_chart` does.
  - **NA:** how missing values become `null`.
  - **Rounding:** what `round()` and `signif()` do, and where.
  - **Recycling:** how short vectors are reused across clusters.
- Make `npm run test:compile -- --only <group>` pass for every fixture.
- Keep earlier groups passing.

| Step | Group | Main R sources |
|------|-------|----------------|
| M4.4 | Data and clusters: rows/columns, `fields`, strand, rowID, cluster split, `series`, `scale.xMin/xMax` | `GC_chart`, `add_strand`, `update_cluster_data` |
| M4.5 | Genes, sequence, labels, coordinates, tooltip, colours, patterns, legend | `chart_genes.R`, `GC_sequence`, `GC_coordinates`, `GC_tooltip` |
| M4.6 | Title, cluster title, cluster label, footer, `cluster`, `grid` | `chart_layout.R` |
| M4.7 | Scale, scale breaks, scale bar | `GC_scale`, `get_scale_breaks`, `break_padding_bp`, `GC_scaleBar` |
| M4.8 | Links from a table of pairs: options, measures, colours, colour bar | `GC_links` without `get_links` |
| M4.9 | Transcripts (intron rows come from R) | `GC_transcript` and transcript parts of `GC_chart`, without `get_introns` |
| M4.10 | Annotations, element styles | `GC_annotation`, `GC_element_style` |
| M4.11 | Themes and palettes | `R/theme.R` |
| M4.12 | Zoom, toolbar, events, trackMouse | `chart_interaction.R` |

**Themes (M4.11).** Move the theme and palette data into
`src/themes.json`, the single source. In M6, R's `geneviewer_theme()` and
`geneviewer_palette()` read the vendored copy of this file, so the data
is not kept twice. Port the theme-merging logic (`resolve_theme`,
`merge_theme_settings`, `render_theme`) to JS.

**Bugs in R.** If R's behaviour is a bug, fix it in R first, following
"Bugs found in the R package" in the plans README, then port the fixed
behaviour. Differences that are not R bugs but are intended for another
reason go on the roadmap's exceptions table for **Niels** to approve.

### M4.13: Draw from the spec

- `newChart(el, spec)` accepts a spec: if `spec.version` is present it
  compiles it, otherwise it treats the input as a render model. This keeps
  the R binding working until M6.
- `chart.update(partial)` deep-merges into the stored spec and draws again;
  `setSpec` and `getSpec` are added. Deep-merge rules: objects merge,
  arrays and scalars replace. Write tests for this in `test/update.mjs`.
- A third harness mode draws every fixture from `spec.json` through
  `newChart`.

**Checks:** `npm test` passes in all three modes; the interaction tests
pass in spec mode.

## Done when

- `npm run test:compile` passes for every fixture and component, apart from
  approved exceptions.
- All SVG baselines are identical in all three modes; `try-app` passes.
- The exceptions table lists every difference, each approved by **Niels**.
- Branches merged. The R branch is merged only with the option off by
  default, so R's behaviour is unchanged.

## Pitfalls

- **Do not port by guessing from the payload.** Read the R source; payload
  shapes hide rules that only show with other inputs.
- **Missing fixtures.** If a group's rules cannot be checked with the
  existing fixtures, add fixtures through M1's export script, never by
  editing `payload.json` by hand, and say so in the report.
- **Size.** M4.5 and M4.11 are the largest steps. They may be split into
  sub-steps (`M4.5a`, `M4.5b`) with the reviewer's agreement.
