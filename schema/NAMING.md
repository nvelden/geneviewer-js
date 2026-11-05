# Spec v1 names

Each R function and argument, and its name in the chart spec
(`spec-v1.schema.json`). These names become public. Niels decided every
case marked **⚑** and points A–C on 2026-11-04; "keep" means the name the
rules give.

## Rules applied

From [docs/design/api.md](../docs/design/api.md) and the M3 plan:

- `GC_labels` becomes the top-level key `labels`, and so on.
- `snake_case` arguments become camelCase (`show_links` → `showLinks`);
  arguments already in camelCase keep their name.
- `cluster =` becomes `clusters`: an array of cluster names or 1-based
  positions. Components that take it can also be an array of entries,
  applied in order; an entry with `clusters` applies only to those
  clusters.
- An argument that takes a list of style options becomes an object that
  allows any keys: CSS-like style keys in camelCase, as in R.
- `GC_chart(start, end, cluster, group, strand)` are column names and go
  into `fields`.
- `default` is R's default where R has a value. Where R's default is
  `NULL` (the theme's value, or another component's), the schema has no
  `default` and the description says what applies.
- An R vector that is recycled over the clusters (titles, `align`,
  `spacing`, ...) may be a single value or an array.

## For all components

These are decisions about the whole spec, not one name.

- **A. Plurals.** The design document uses four plural keys where R's
  function is singular:

  | R | Rule gives | Design document |
  |---|------------|-----------------|
  | `GC_annotation` | `annotation` | `annotations` |
  | `GC_element_style` | `elementStyle` | `elementStyles` |
  | `GC_pattern` | `pattern` | `patterns` |
  | `GC_color` | `color` | `colors` |

  Decided: R's names, singular. Someone who knows
  `GC_annotation()` looks for `annotation`. Python's methods will mirror R
  (`.annotation()`). The theme already uses `pattern`. The design
  document's example is changed to match.

- **B. Options passed through `...`.** Most `GC_*` functions pass extra
  options to JavaScript through `...` (`GC_labels(adjustLabels = "spread")`,
  `GC_trackMouse(backgroundColor = )`, the options of each annotation
  type). They already have JavaScript names. This draft allows them
  (`additionalProperties`) but does not list them. Decided: list them in
  M4, and review their names, as each component's resolution is ported
  and its options are known exactly. Spec v1 is frozen only at 1.0.0 (M8), so adding them later is
  not a breaking change.

  **Listed in M5 (Niels, 2026-11-05):** the options each component's
  renderer reads are now properties of the schema, under their JavaScript
  names, with two renames: `scaleBar.unit` (the renderer's `scaleBarUnit`,
  as case 16) and `labels.labelAdjustment` / `links.labelAdjustment` (the
  renderer's `labelAdjustmentOptions`); compile() maps them. Other options
  stay allowed, unlisted, and are passed to the renderer as they are.

- **Theme options (Niels, 2026-11-05).** Inside a theme object, a
  component's options have the component's spec names:
  `theme.legend.textStyle`, `theme.sequence.lineStyle`,
  `theme.scaleBar.lineStyle`, `theme.links.show`, `theme.scale.autoBreaks`.
  compile() maps them to the renderer's names. `src/themes.json` keeps R's
  names, for R to read.

- **C. Data processing is not in the spec.** `GC_normalize` and the gene
  matching of `GC_links(group, value1, value2)` stay in R and
  Python (roadmap, "Chart building only"). The spec gets their results:
  shifted positions in `data`, pairs in `links.data`. `GC_zoom_to` is a
  Shiny command; JavaScript calls `chart.zoomTo()`.

## Marked cases

1. **`GC_chart` `save_button`**: It is a toolbar setting. Decided: no `saveButton`; `toolbar.buttons` without "save" does the same, and R maps `save_button = FALSE` onto it.
2. **`GC_annotation`**: The design document calls it `annotations` (plural). R's name is singular. See the note on plurals.
3. **`GC_cluster`**: `cluster` (GC_cluster) sits next to `fields.cluster` (a column) and `clusters` (which clusters an entry applies to). Decided: keep `cluster`; themes already use this name for the same options.
4. **`GC_color`**: The design document shows `colors: { Monooxygenase: "#1f77b4" }`, a map of colours by group. The rules give `color: { colorScheme, customColors }`. Decided: follow the rules, so both R arguments have a place, and change the design document's example to `color: { customColors: { ... } }`.
5. **`GC_element_style`**: The design document calls it `elementStyles` (plural). R's name is singular. See the note on plurals.
6. **`GC_element_style` `row_id`**: The rule gives `rowId`. The data and the events call this field `rowID`. Decided: `rowID`, so it matches the events.
7. **`GC_element_style` `cluster`**: The rule gives `clusters`, an array. Here the argument names the one cluster that holds the element. Decided: `cluster`, a single name or position.
8. **`GC_element_style` `reset`**: Decided: not in the spec. R's `reset = TRUE` removes the entry from the spec it builds.
9. **`GC_legend` `legendOptions`**: Repeats the component name: `legend.legendOptions`. Its styles go to the legend markers. Decided: `markerStyle`. (R also stores the colour scheme, custom colours and patterns there; in the spec they come from `color`, `genes` and `pattern`.)
10. **`GC_legend` `legendTextOptions`**: Repeats the component name: `legend.legendTextOptions`. Decided: `textStyle`, as in coordinates and scale.
11. **`GC_links` `show_links`**: Every other component calls this `show`. Decided: `show`.
12. **`GC_pattern`**: The design document calls it `patterns`. R's name is `GC_pattern`, and `GC_theme(pattern = )` uses the singular too. Decided: `pattern`.
13. **`GC_scale` `scale_breaks`**: Repeats the component: `scale.scaleBreaks`, next to `scale.breaks`. Decided: `autoBreaks`.
14. **`GC_scale` `scale_break_threshold`**: Decided: `autoBreakThreshold`, to go with `autoBreaks`.
15. **`GC_scale` `scale_break_padding`**: Decided: `breakPadding`; it applies to every break.
16. **`GC_scaleBar` `scaleBarLineStyle`**: Repeats the component: `scaleBar.scaleBarLineStyle`. Decided: `lineStyle`, as in scale.
17. **`GC_scaleBar` `scaleBarTickStyle`**: Decided: `tickStyle`, as in scale.
18. **`GC_sequence` `sequenceStyle`**: Repeats the component: `sequence.sequenceStyle`. Decided: `lineStyle`, as in scale.
19. **`GC_theme` `theme`**: Inside the object form this reads `theme: { theme: "dark", textScale: 1.2 }`. Decided: `base`.
20. **`GC_transcript` `transcript`**: Reads `transcript.transcript`. Decided: keep it. The other column arguments (type, strand, group) read well.
21. **`GC_zoom` `range`**: The design document's example calls this `window`. R calls it `range`, and so does the zoom event. Decided: `range`.

### Added in M4

Niels decided the two points below on 2026-11-04 in M4.1 and approved the
names on 2026-11-04.

22. **`GC_links` `group`, `value1`, `value2`**: The renderer uses them to pick the genes that get the measure as a label (`labelPosition = "gene"`), so they are drawing options too. Decided: keep them in the spec as `links.group`, `links.value1`, `links.value2`, next to `links.data`. Without `group`, `links.data` was given by hand: R then draws no labels at the genes.
23. **`GC_align`**: It does not shift positions. It sets the start and end of each cluster's scale from that cluster's breaks and direction, which compile() works out (`autoBreaks`), and R does it again after each `GC_scale()`. Decided: a spec key `align: { idColumn, id, align }`, resolved by compile(). This replaces point C for `GC_align`; Python does not need its own.

## All arguments

`[]` marks a component whose value is an array of items (annotations,
element overrides). `.*` stands for the options passed through `...`
(see B).

| R function | R argument | Spec name | Note |
|------------|------------|-----------|------|
| `GC_chart` | `data` | `data` |  |
| `GC_chart` | `start` | `fields.start` |  |
| `GC_chart` | `end` | `fields.end` |  |
| `GC_chart` | `cluster` | `fields.cluster` |  |
| `GC_chart` | `group` | `fields.group` |  |
| `GC_chart` | `strand` | `fields.strand` |  |
| `GC_chart` | `width` | `width` |  |
| `GC_chart` | `height` | `height` |  |
| `GC_chart` | `style` | `style` |  |
| `GC_chart` | `elementId` | not in spec | The element is the first argument of newChart(), not part of the spec. |
| `GC_chart` | `save_button` | not in spec | A toolbar setting: R maps save_button = FALSE onto toolbar.buttons without "save". **⚑ 1** |
| `GC_annotation` | (function) | `annotation` | **⚑ 2** |
| `GC_annotation` | `type` | `annotation[].type` |  |
| `GC_annotation` | `cluster` | `annotation[].clusters` |  |
| `GC_annotation` | `...` | `annotation[].*` | other options under their JavaScript names |
| `GC_cluster` | (function) | `cluster` | **⚑ 3** |
| `GC_cluster` | `separate_strands` | `cluster.separateStrands` |  |
| `GC_cluster` | `strand_spacing` | `cluster.strandSpacing` |  |
| `GC_cluster` | `prevent_gene_overlap` | `cluster.preventGeneOverlap` |  |
| `GC_cluster` | `overlap_min` | `cluster.overlapMin` |  |
| `GC_cluster` | `overlap_spacing` | `cluster.overlapSpacing` |  |
| `GC_cluster` | `cluster` | `cluster.clusters` |  |
| `GC_cluster` | `style` | `cluster.style` |  |
| `GC_cluster` | `...` | `cluster.*` | other options under their JavaScript names |
| `GC_clusterFooter` | (function) | `clusterFooter` | |
| `GC_clusterFooter` | `title` | `clusterFooter.title` |  |
| `GC_clusterFooter` | `subtitle` | `clusterFooter.subtitle` |  |
| `GC_clusterFooter` | `show` | `clusterFooter.show` |  |
| `GC_clusterFooter` | `cluster` | `clusterFooter.clusters` |  |
| `GC_clusterFooter` | `subtitleFont` | `clusterFooter.subtitleFont` |  |
| `GC_clusterFooter` | `titleFont` | `clusterFooter.titleFont` |  |
| `GC_clusterFooter` | `align` | `clusterFooter.align` |  |
| `GC_clusterFooter` | `spacing` | `clusterFooter.spacing` |  |
| `GC_clusterFooter` | `...` | `clusterFooter.*` | other options under their JavaScript names |
| `GC_clusterLabel` | (function) | `clusterLabel` | |
| `GC_clusterLabel` | `title` | `clusterLabel.title` |  |
| `GC_clusterLabel` | `show` | `clusterLabel.show` |  |
| `GC_clusterLabel` | `width` | `clusterLabel.width` |  |
| `GC_clusterLabel` | `cluster` | `clusterLabel.clusters` |  |
| `GC_clusterLabel` | `position` | `clusterLabel.position` |  |
| `GC_clusterLabel` | `align` | `clusterLabel.align` |  |
| `GC_clusterLabel` | `wrapLabel` | `clusterLabel.wrapLabel` |  |
| `GC_clusterLabel` | `wrapOptions` | `clusterLabel.wrapOptions` |  |
| `GC_clusterLabel` | `subtitle` | `clusterLabel.subtitle` |  |
| `GC_clusterLabel` | `subtitleFont` | `clusterLabel.subtitleFont` |  |
| `GC_clusterLabel` | `spacing` | `clusterLabel.spacing` |  |
| `GC_clusterLabel` | `...` | `clusterLabel.*` | other options under their JavaScript names |
| `GC_clusterTitle` | (function) | `clusterTitle` | |
| `GC_clusterTitle` | `title` | `clusterTitle.title` |  |
| `GC_clusterTitle` | `subtitle` | `clusterTitle.subtitle` |  |
| `GC_clusterTitle` | `subtitleFont` | `clusterTitle.subtitleFont` |  |
| `GC_clusterTitle` | `titleFont` | `clusterTitle.titleFont` |  |
| `GC_clusterTitle` | `show` | `clusterTitle.show` |  |
| `GC_clusterTitle` | `height` | `clusterTitle.height` |  |
| `GC_clusterTitle` | `cluster` | `clusterTitle.clusters` |  |
| `GC_clusterTitle` | `align` | `clusterTitle.align` |  |
| `GC_clusterTitle` | `spacing` | `clusterTitle.spacing` |  |
| `GC_clusterTitle` | `...` | `clusterTitle.*` | other options under their JavaScript names |
| `GC_color` | (function) | `color` | **⚑ 4** |
| `GC_color` | `colorScheme` | `color.colorScheme` |  |
| `GC_color` | `customColors` | `color.customColors` |  |
| `GC_coordinates` | (function) | `coordinates` | |
| `GC_coordinates` | `show` | `coordinates.show` |  |
| `GC_coordinates` | `tickValuesTop` | `coordinates.tickValuesTop` |  |
| `GC_coordinates` | `tickValuesBottom` | `coordinates.tickValuesBottom` |  |
| `GC_coordinates` | `ticksFormat` | `coordinates.ticksFormat` |  |
| `GC_coordinates` | `tickStyle` | `coordinates.tickStyle` |  |
| `GC_coordinates` | `textStyle` | `coordinates.textStyle` |  |
| `GC_coordinates` | `cluster` | `coordinates.clusters` |  |
| `GC_coordinates` | `groupStyle` | `coordinates.groupStyle` |  |
| `GC_coordinates` | `style_by` | `coordinates.styleBy` |  |
| `GC_coordinates` | `...` | `coordinates.*` | other options under their JavaScript names |
| `GC_element_style` | (function) | `elementStyle` | **⚑ 5** |
| `GC_element_style` | `component` | `elementStyle[].component` |  |
| `GC_element_style` | `row_id` | `elementStyle[].rowID` | **⚑ 6** |
| `GC_element_style` | `cluster` | `elementStyle[].cluster` | **⚑ 7** |
| `GC_element_style` | `part` | `elementStyle[].part` |  |
| `GC_element_style` | `end` | `elementStyle[].end` |  |
| `GC_element_style` | `reset` | not in spec | Removes an override in R. A spec leaves the entry out instead. **⚑ 8** |
| `GC_element_style` | `group` | `elementStyle[].group` |  |
| `GC_element_style` | `...` | `elementStyle[].*` | other options under their JavaScript names |
| `GC_events` | (function) | `events` | |
| `GC_events` | `click` | `events.click` |  |
| `GC_events` | `highlight` | `events.highlight` |  |
| `GC_events` | `rendered` | `events.rendered` |  |
| `GC_events` | `render_id` | `events.renderId` |  |
| `GC_events` | `dblclick` | `events.dblclick` |  |
| `GC_events` | `select` | `events.select` |  |
| `GC_events` | `legend_click` | `events.legendClick` |  |
| `GC_events` | `drag` | `events.drag` |  |
| `GC_events` | `zoom` | `events.zoom` |  |
| `GC_genes` | (function) | `genes` | |
| `GC_genes` | `group` | `genes.group` |  |
| `GC_genes` | `marker` | `genes.marker` |  |
| `GC_genes` | `marker_size` | `genes.markerSize` |  |
| `GC_genes` | `show` | `genes.show` |  |
| `GC_genes` | `colorScheme` | `genes.colorScheme` |  |
| `GC_genes` | `customColors` | `genes.customColors` |  |
| `GC_genes` | `cluster` | `genes.clusters` |  |
| `GC_genes` | `itemStyle` | `genes.itemStyle` |  |
| `GC_genes` | `groupStyle` | `genes.groupStyle` |  |
| `GC_genes` | `style_by` | `genes.styleBy` |  |
| `GC_genes` | `corner_radius` | `genes.cornerRadius` |  |
| `GC_genes` | `...` | `genes.*` | other options under their JavaScript names |
| `GC_grid` | (function) | `grid` | |
| `GC_grid` | `margin` | `grid.margin` |  |
| `GC_grid` | `width` | `grid.width` |  |
| `GC_grid` | `height` | `grid.height` |  |
| `GC_grid` | `direction` | `grid.direction` |  |
| `GC_grid` | `cluster` | `grid.clusters` |  |
| `GC_labels` | (function) | `labels` | |
| `GC_labels` | `label` | `labels.label` |  |
| `GC_labels` | `show` | `labels.show` |  |
| `GC_labels` | `cluster` | `labels.clusters` |  |
| `GC_labels` | `itemStyle` | `labels.itemStyle` |  |
| `GC_labels` | `groupStyle` | `labels.groupStyle` |  |
| `GC_labels` | `style_by` | `labels.styleBy` |  |
| `GC_labels` | `...` | `labels.*` | other options under their JavaScript names |
| `GC_legend` | (function) | `legend` | |
| `GC_legend` | `group` | `legend.group` |  |
| `GC_legend` | `show` | `legend.show` |  |
| `GC_legend` | `backgroundColor` | `legend.backgroundColor` |  |
| `GC_legend` | `order` | `legend.order` |  |
| `GC_legend` | `position` | `legend.position` |  |
| `GC_legend` | `align` | `legend.align` |  |
| `GC_legend` | `style` | `legend.style` |  |
| `GC_legend` | `legendOptions` | `legend.markerStyle` | **⚑ 9** |
| `GC_legend` | `legendTextOptions` | `legend.textStyle` | **⚑ 10** |
| `GC_legend` | `corner_radius` | `legend.cornerRadius` |  |
| `GC_legend` | `groupStyle` | `legend.groupStyle` |  |
| `GC_legend` | `...` | `legend.*` | other options under their JavaScript names |
| `GC_links` | (function) | `links` | |
| `GC_links` | `group` | `links.group` | Matching genes stays in R and Python (`get_links`); the spec carries the pairs in `links.data`. The column also picks the genes labelled with the measure. **⚑ 22** |
| `GC_links` | `data` | `links.data` |  |
| `GC_links` | `value1` | `links.value1` | Matched in R and Python; also picks the genes labelled with the measure. **⚑ 22** |
| `GC_links` | `value2` | `links.value2` | Matched in R and Python; also picks the genes labelled with the measure. **⚑ 22** |
| `GC_links` | `cluster` | `links.clusters` |  |
| `GC_links` | `curve` | `links.curve` |  |
| `GC_links` | `measure` | `links.measure` |  |
| `GC_links` | `show_links` | `links.show` | **⚑ 11** |
| `GC_links` | `label` | `links.label` |  |
| `GC_links` | `label_position` | `links.labelPosition` |  |
| `GC_links` | `normal_color` | `links.normalColor` |  |
| `GC_links` | `inverted_color` | `links.invertedColor` |  |
| `GC_links` | `low_color` | `links.lowColor` |  |
| `GC_links` | `vmin` | `links.vmin` |  |
| `GC_links` | `vmax` | `links.vmax` |  |
| `GC_links` | `use_group_colors` | `links.useGroupColors` |  |
| `GC_links` | `color_bar` | `links.colorBar` |  |
| `GC_links` | `colorBarOptions` | `links.colorBarOptions` |  |
| `GC_links` | `linkWidth` | `links.linkWidth` |  |
| `GC_links` | `linkStyle` | `links.linkStyle` |  |
| `GC_links` | `labelStyle` | `links.labelStyle` |  |
| `GC_links` | `...` | `links.*` | other options under their JavaScript names |
| `GC_pattern` | (function) | `pattern` | **⚑ 12** |
| `GC_pattern` | `patterns` | `pattern.patterns` |  |
| `GC_pattern` | `color` | `pattern.color` |  |
| `GC_pattern` | `background` | `pattern.background` |  |
| `GC_pattern` | `size` | `pattern.size` |  |
| `GC_pattern` | `strokeWidth` | `pattern.strokeWidth` |  |
| `GC_scale` | (function) | `scale` | |
| `GC_scale` | `cluster` | `scale.clusters` |  |
| `GC_scale` | `start` | `scale.start` |  |
| `GC_scale` | `end` | `scale.end` |  |
| `GC_scale` | `padding` | `scale.padding` |  |
| `GC_scale` | `hidden` | `scale.hidden` |  |
| `GC_scale` | `breaks` | `scale.breaks` |  |
| `GC_scale` | `tickValues` | `scale.tickValues` |  |
| `GC_scale` | `reverse` | `scale.reverse` |  |
| `GC_scale` | `axis_position` | `scale.axisPosition` |  |
| `GC_scale` | `axis_type` | `scale.axisType` |  |
| `GC_scale` | `y` | `scale.y` |  |
| `GC_scale` | `scale_breaks` | `scale.autoBreaks` | **⚑ 13** |
| `GC_scale` | `scale_break_threshold` | `scale.autoBreakThreshold` | **⚑ 14** |
| `GC_scale` | `scale_break_padding` | `scale.breakPadding` | **⚑ 15** |
| `GC_scale` | `ticksCount` | `scale.ticksCount` |  |
| `GC_scale` | `ticksFormat` | `scale.ticksFormat` |  |
| `GC_scale` | `tickStyle` | `scale.tickStyle` |  |
| `GC_scale` | `textStyle` | `scale.textStyle` |  |
| `GC_scale` | `lineStyle` | `scale.lineStyle` |  |
| `GC_scale` | `...` | `scale.*` | other options under their JavaScript names |
| `GC_scaleBar` | (function) | `scaleBar` | |
| `GC_scaleBar` | `show` | `scaleBar.show` |  |
| `GC_scaleBar` | `cluster` | `scaleBar.clusters` |  |
| `GC_scaleBar` | `scaleBarLineStyle` | `scaleBar.lineStyle` | **⚑ 16** |
| `GC_scaleBar` | `scaleBarTickStyle` | `scaleBar.tickStyle` | **⚑ 17** |
| `GC_scaleBar` | `labelStyle` | `scaleBar.labelStyle` |  |
| `GC_scaleBar` | `...` | `scaleBar.*` | other options under their JavaScript names |
| `GC_sequence` | (function) | `sequence` | |
| `GC_sequence` | `show` | `sequence.show` |  |
| `GC_sequence` | `cluster` | `sequence.clusters` |  |
| `GC_sequence` | `y` | `sequence.y` |  |
| `GC_sequence` | `sequenceStyle` | `sequence.lineStyle` | **⚑ 18** |
| `GC_sequence` | `markerStyle` | `sequence.markerStyle` |  |
| `GC_sequence` | `...` | `sequence.*` | other options under their JavaScript names |
| `GC_theme` | (function) | `theme` | |
| `GC_theme` | `theme` | `theme.base` | **⚑ 19** |
| `GC_theme` | `textScale` | `theme.textScale` |  |
| `GC_theme` | `fontFamily` | `theme.fontFamily` |  |
| `GC_theme` | `textColor` | `theme.textColor` |  |
| `GC_theme` | `lineColor` | `theme.lineColor` |  |
| `GC_theme` | `background` | `theme.background` |  |
| `GC_theme` | `palette` | `theme.palette` |  |
| `GC_theme` | `pattern` | `theme.pattern` |  |
| `GC_theme` | `...` | `theme.*` | other options under their JavaScript names |
| `GC_title` | (function) | `title` | |
| `GC_title` | `title` | `title.title` |  |
| `GC_title` | `subtitle` | `title.subtitle` |  |
| `GC_title` | `style` | `title.style` |  |
| `GC_title` | `subtitleFont` | `title.subtitleFont` |  |
| `GC_title` | `titleFont` | `title.titleFont` |  |
| `GC_title` | `show` | `title.show` |  |
| `GC_title` | `height` | `title.height` |  |
| `GC_title` | `align` | `title.align` |  |
| `GC_title` | `spacing` | `title.spacing` |  |
| `GC_title` | `...` | `title.*` | other options under their JavaScript names |
| `GC_toolbar` | (function) | `toolbar` | |
| `GC_toolbar` | `show` | `toolbar.show` |  |
| `GC_toolbar` | `position` | `toolbar.position` |  |
| `GC_toolbar` | `buttons` | `toolbar.buttons` |  |
| `GC_toolbar` | `size` | `toolbar.size` |  |
| `GC_toolbar` | `color` | `toolbar.color` |  |
| `GC_toolbar` | `hoverColor` | `toolbar.hoverColor` |  |
| `GC_toolbar` | `tooltipBackground` | `toolbar.tooltipBackground` |  |
| `GC_toolbar` | `tooltipColor` | `toolbar.tooltipColor` |  |
| `GC_toolbar` | `tooltipBorder` | `toolbar.tooltipBorder` |  |
| `GC_toolbar` | `tooltipRadius` | `toolbar.tooltipRadius` |  |
| `GC_toolbar` | `tooltipShadow` | `toolbar.tooltipShadow` |  |
| `GC_toolbar` | `fontFamily` | `toolbar.fontFamily` |  |
| `GC_toolbar` | `icons` | `toolbar.icons` |  |
| `GC_tooltip` | (function) | `tooltip` | |
| `GC_tooltip` | `formatter` | `tooltip.formatter` |  |
| `GC_tooltip` | `show` | `tooltip.show` |  |
| `GC_tooltip` | `cluster` | `tooltip.clusters` |  |
| `GC_tooltip` | `...` | `tooltip.*` | other options under their JavaScript names |
| `GC_trackMouse` | (function) | `trackMouse` | |
| `GC_trackMouse` | `show` | `trackMouse.show` |  |
| `GC_trackMouse` | `cluster` | `trackMouse.clusters` |  |
| `GC_trackMouse` | `...` | `trackMouse.*` | other options under their JavaScript names |
| `GC_transcript` | (function) | `transcript` | |
| `GC_transcript` | `transcript` | `transcript.transcript` | **⚑ 20** |
| `GC_transcript` | `type` | `transcript.type` |  |
| `GC_transcript` | `strand` | `transcript.strand` |  |
| `GC_transcript` | `group` | `transcript.group` |  |
| `GC_transcript` | `selection` | `transcript.selection` |  |
| `GC_transcript` | `show` | `transcript.show` |  |
| `GC_transcript` | `colorScheme` | `transcript.colorScheme` |  |
| `GC_transcript` | `customColors` | `transcript.customColors` |  |
| `GC_transcript` | `styleExons` | `transcript.styleExons` |  |
| `GC_transcript` | `styleIntrons` | `transcript.styleIntrons` |  |
| `GC_transcript` | `styleUTRs` | `transcript.styleUTRs` |  |
| `GC_transcript` | `itemStyleExons` | `transcript.itemStyleExons` |  |
| `GC_transcript` | `itemStyleIntrons` | `transcript.itemStyleIntrons` |  |
| `GC_transcript` | `itemStyleUTRs` | `transcript.itemStyleUTRs` |  |
| `GC_transcript` | `groupStyleExons` | `transcript.groupStyleExons` |  |
| `GC_transcript` | `groupStyleIntrons` | `transcript.groupStyleIntrons` |  |
| `GC_transcript` | `groupStyleUTRs` | `transcript.groupStyleUTRs` |  |
| `GC_transcript` | `style_by` | `transcript.styleBy` |  |
| `GC_transcript` | `labelOptions` | `transcript.labelOptions` |  |
| `GC_transcript` | `...` | `transcript.*` | other options under their JavaScript names |
| `GC_zoom` | (function) | `zoom` | |
| `GC_zoom` | `show` | `zoom.show` |  |
| `GC_zoom` | `range` | `zoom.range` | **⚑ 21** |
| `GC_zoom` | `mode` | `zoom.mode` |  |
| `GC_zoom` | `min` | `zoom.min` |  |
| `GC_zoom` | `update` | `zoom.update` |  |
| `GC_zoom` | `height` | `zoom.height` |  |
| `GC_zoom` | `overview` | `zoom.overview` |  |
| `GC_zoom` | `color` | `zoom.color` |  |
| `GC_zoom` | `style` | `zoom.style` |  |
| `GC_zoom` | `windowStyle` | `zoom.windowStyle` |  |
| `GC_zoom` | `handleStyle` | `zoom.handleStyle` |  |
| `GC_align` | (function) | `align` | Sets each cluster's scale from the drawn layout, so compile() does it. **⚑ 23** |
| `GC_align` | `id_column` | `align.idColumn` | **⚑ 23** |
| `GC_align` | `id` | `align.id` | **⚑ 23** |
| `GC_align` | `align` | `align.align` | **⚑ 23** |
| `GC_normalize` | (function) | not in spec | Shifting coordinates stays in R and Python; the spec gets the normalised data. |
| `GC_normalize` | `group` | not in spec | |
| `GC_normalize` | `cluster` | not in spec | |
| `GC_normalize` | `normalize` | not in spec | |
| `GC_normalize` | `preserve_gene_length` | not in spec | |
| `GC_normalize` | `gap` | not in spec | |
| `GC_normalize` | `custom_gaps` | not in spec | |
| `GC_zoom_to` | (function) | not in spec | A Shiny command for a drawn chart; JavaScript calls chart.zoomTo(range). |
| `GC_zoom_to` | `outputId` | not in spec | |
| `GC_zoom_to` | `range` | not in spec | |
| `GC_zoom_to` | `session` | not in spec | |
