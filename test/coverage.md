# Fixture coverage

Documented arguments of the exported `GC_*` chart functions, and the
fixtures whose code uses them. Written by `Rscript test/coverage.R`.

- 292 fixtures
- 286 arguments: 281 covered, 5 not drawable, 0 uncovered

| Function | Argument | Status | Fixtures |
|----------|----------|--------|----------|
| `GC_chart` | `elementId` | not drawable | the id of the HTML element, not part of the drawing |
| `GC_scale` | `...` | not drawable | every scale option in the schema has its own argument |
| `GC_zoom_to` | `outputId` | not drawable | Shiny only |
| `GC_zoom_to` | `range` | not drawable | Shiny only (GC_zoom(range = ) covers the drawing) |
| `GC_zoom_to` | `session` | not drawable | Shiny only |
| `GC_align` | `GC_chart` | covered | 9: rd-GC-align-1, vig-Examples-15, vig-Examples-16, ... |
| `GC_align` | `align` | covered | 9: rd-GC-align-1, vig-Examples-15, vig-Examples-16, ... |
| `GC_align` | `id` | covered | 9: rd-GC-align-1, vig-Examples-15, vig-Examples-16, ... |
| `GC_align` | `id_column` | covered | 9: rd-GC-align-1, vig-Examples-15, vig-Examples-16, ... |
| `GC_annotation` | `...` | covered | 31: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_annotation` | `GC_chart` | covered | 31: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_annotation` | `cluster` | covered | 31: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_annotation` | `type` | covered | 31: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_chart` | `cluster` | covered | 253: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_chart` | `data` | covered | 292: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_chart` | `end` | covered | 21: rd-GC-transcript-1, rd-GC-transcript-2, rd-mitochondrial-gene-order-1, ... |
| `GC_chart` | `group` | covered | 245: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_chart` | `height` | covered | 283: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_chart` | `save_button` | covered | 1: cov-chart-without-extras |
| `GC_chart` | `start` | covered | 21: rd-GC-transcript-1, rd-GC-transcript-2, rd-mitochondrial-gene-order-1, ... |
| `GC_chart` | `strand` | covered | 21: rd-mitochondrial-gene-order-1, vig-Examples-12, vig-Examples-13, ... |
| `GC_chart` | `style` | covered | 2: vig-geneviewer-15, vig-geneviewer-3 |
| `GC_chart` | `width` | covered | 113: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_cluster` | `...` | covered | 1: vig-geneviewer-11 |
| `GC_cluster` | `GC_chart` | covered | 12: beh-tracks-style, rd-GC-cluster-1, rd-GC-cluster-2, ... |
| `GC_cluster` | `cluster` | covered | 1: vig-geneviewer-11 |
| `GC_cluster` | `overlap_min` | covered | 2: vig-Examples-16, vig-Examples-17 |
| `GC_cluster` | `overlap_spacing` | covered | 4: vig-Examples-16, vig-Examples-17, vig-geneviewer-13, ... |
| `GC_cluster` | `prevent_gene_overlap` | covered | 7: beh-tracks-style, rd-GC-cluster-2, vig-Examples-16, ... |
| `GC_cluster` | `separate_strands` | covered | 4: rd-GC-cluster-1, vig-Examples-17, vig-MUMMER-1, ... |
| `GC_cluster` | `strand_spacing` | covered | 3: rd-GC-cluster-1, vig-Examples-17, vig-geneviewer-12 |
| `GC_cluster` | `style` | covered | 2: vig-geneviewer-11, vig-geneviewer-15 |
| `GC_clusterFooter` | `...` | covered | 3: rd-GC-clusterFooter-2, vig-Examples-1, vig-Examples-17 |
| `GC_clusterFooter` | `GC_chart` | covered | 31: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_clusterFooter` | `align` | covered | 10: beh-footer-align-left, beh-footer-align-right, rd-GC-clusterFooter-2, ... |
| `GC_clusterFooter` | `cluster` | covered | 1: rd-GC-clusterFooter-2 |
| `GC_clusterFooter` | `show` | covered | 1: rd-GC-clusterFooter-2 |
| `GC_clusterFooter` | `spacing` | covered | 1: rd-GC-clusterFooter-2 |
| `GC_clusterFooter` | `subtitle` | covered | 9: beh-editor-cluster-parts, rd-GC-clusterFooter-1, rd-GC-clusterFooter-2, ... |
| `GC_clusterFooter` | `subtitleFont` | covered | 1: rd-GC-clusterFooter-2 |
| `GC_clusterFooter` | `title` | covered | 30: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_clusterFooter` | `titleFont` | covered | 1: rd-GC-clusterFooter-2 |
| `GC_clusterLabel` | `...` | covered | 7: rd-GC-clusterLabel-4, vig-Examples-14, vig-Examples-15, ... |
| `GC_clusterLabel` | `GC_chart` | covered | 67: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_clusterLabel` | `align` | covered | 9: beh-cluster-label-center, beh-cluster-label-left, beh-cluster-label-right, ... |
| `GC_clusterLabel` | `cluster` | covered | 1: rd-GC-clusterLabel-2 |
| `GC_clusterLabel` | `position` | covered | 1: rd-GC-clusterLabel-4 |
| `GC_clusterLabel` | `show` | covered | 1: cov-chart-without-extras |
| `GC_clusterLabel` | `spacing` | covered | 2: beh-cluster-label-wrapped-subtitle, rd-GC-clusterLabel-3 |
| `GC_clusterLabel` | `subtitle` | covered | 10: beh-cluster-label-subtitle, beh-cluster-label-wrapped-subtitle, beh-editor-cluster-parts, ... |
| `GC_clusterLabel` | `subtitleFont` | covered | 7: beh-cluster-label-subtitle, rd-GC-clusterLabel-3, vig-Examples-14, ... |
| `GC_clusterLabel` | `title` | covered | 34: beh-cluster-label-center, beh-cluster-label-italic, beh-cluster-label-left, ... |
| `GC_clusterLabel` | `width` | covered | 12: beh-cluster-label-center, beh-cluster-label-italic, beh-cluster-label-left, ... |
| `GC_clusterLabel` | `wrapLabel` | covered | 3: rd-GC-clusterLabel-4, vig-Examples-7, vig-Examples-8 |
| `GC_clusterLabel` | `wrapOptions` | covered | 2: beh-cluster-label-italic, rd-GC-clusterLabel-4 |
| `GC_clusterTitle` | `...` | covered | 5: rd-GC-clusterTitle-2, vig-Examples-16, vig-Examples-17, ... |
| `GC_clusterTitle` | `GC_chart` | covered | 32: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_clusterTitle` | `align` | covered | 6: beh-footer-align-left, beh-footer-align-right, rd-GC-clusterTitle-2, ... |
| `GC_clusterTitle` | `cluster` | covered | 4: rd-GC-clusterTitle-1, rd-GC-clusterTitle-2, vig-Examples-16, ... |
| `GC_clusterTitle` | `height` | covered | 2: vig-Examples-16, vig-Examples-17 |
| `GC_clusterTitle` | `show` | covered | 2: rd-GC-clusterTitle-1, rd-GC-clusterTitle-2 |
| `GC_clusterTitle` | `spacing` | covered | 1: rd-GC-clusterTitle-2 |
| `GC_clusterTitle` | `subtitle` | covered | 4: beh-editor-cluster-parts, rd-GC-clusterTitle-1, rd-GC-clusterTitle-2, ... |
| `GC_clusterTitle` | `subtitleFont` | covered | 1: rd-GC-clusterTitle-2 |
| `GC_clusterTitle` | `title` | covered | 32: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_clusterTitle` | `titleFont` | covered | 7: rd-GC-clusterTitle-2, vig-Examples-10, vig-Examples-16, ... |
| `GC_color` | `GC_chart` | covered | 27: beh-editor-pattern-fill, rd-GC-color-1, rd-GC-color-2, ... |
| `GC_color` | `colorScheme` | covered | 6: rd-GC-color-1, rd-GC-color-4, vig-geneviewer-17, ... |
| `GC_color` | `customColors` | covered | 22: beh-editor-pattern-fill, rd-GC-color-2, rd-GC-color-3, ... |
| `GC_coordinates` | `...` | covered | 3: rd-GC-coordinates-2, vig-Examples-1, vig-geneviewer-92 |
| `GC_coordinates` | `GC_chart` | covered | 28: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_coordinates` | `cluster` | covered | 1: rd-GC-coordinates-2 |
| `GC_coordinates` | `groupStyle` | covered | 5: beh-coordinates-groups, beh-coordinates-shared, beh-coordinates-style-by, ... |
| `GC_coordinates` | `show` | covered | 1: rd-GC-coordinates-2 |
| `GC_coordinates` | `style_by` | covered | 2: beh-coordinates-style-by, cov-coordinates-style-by |
| `GC_coordinates` | `textStyle` | covered | 3: rd-GC-coordinates-2, vig-Examples-1, vig-geneviewer-93 |
| `GC_coordinates` | `tickStyle` | covered | 3: rd-GC-coordinates-2, vig-Examples-1, vig-geneviewer-93 |
| `GC_coordinates` | `tickValuesBottom` | covered | 3: rd-GC-coordinates-2, vig-Examples-1, vig-geneviewer-94 |
| `GC_coordinates` | `tickValuesTop` | covered | 2: rd-GC-coordinates-2, vig-geneviewer-94 |
| `GC_coordinates` | `ticksFormat` | covered | 2: rd-GC-coordinates-2, vig-geneviewer-94 |
| `GC_element_style` | `...` | covered | 14: beh-editor-cluster-parts, beh-editor-drag-scale, beh-editor-drag-scaleBar, ... |
| `GC_element_style` | `GC_chart` | covered | 14: beh-editor-cluster-parts, beh-editor-drag-scale, beh-editor-drag-scaleBar, ... |
| `GC_element_style` | `cluster` | covered | 6: beh-editor-cluster-parts, beh-editor-drag-scale, beh-editor-drag-scaleBar, ... |
| `GC_element_style` | `component` | covered | 14: beh-editor-cluster-parts, beh-editor-drag-scale, beh-editor-drag-scaleBar, ... |
| `GC_element_style` | `end` | covered | 2: beh-editor-cluster-parts, vig-geneviewer-10 |
| `GC_element_style` | `group` | covered | 5: beh-editor-legend-drag, beh-editor-legend-parts, beh-zoom-saved, ... |
| `GC_element_style` | `part` | covered | 8: beh-editor-cluster-parts, beh-editor-legend-drag, beh-editor-legend-parts, ... |
| `GC_element_style` | `reset` | covered | 1: cov-element-style-reset |
| `GC_element_style` | `row_id` | covered | 8: beh-editor-cluster-parts, beh-editor-label-style, beh-editor-toggles, ... |
| `GC_events` | `GC_chart` | covered | 94: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_events` | `click` | covered | 14: beh-editor-box-escape, beh-editor-cluster-parts, beh-editor-drag-escape, ... |
| `GC_events` | `dblclick` | covered | 3: beh-editor-legend-parts, beh-editor-toggles, cov-events |
| `GC_events` | `drag` | covered | 85: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_events` | `highlight` | covered | 5: beh-editor-link-click, beh-every-part-events, beh-sizing, ... |
| `GC_events` | `legend_click` | covered | 2: beh-editor-toggles, cov-events |
| `GC_events` | `render_id` | covered | Shiny only: identifies a render in input$<id>_rendered |
| `GC_events` | `rendered` | covered | Shiny only: reports a finished render |
| `GC_events` | `select` | covered | 88: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_events` | `zoom` | covered | 5: beh-zoom-redraw, beh-zoom-render-id, beh-zoom-slider, ... |
| `GC_genes` | `...` | covered | 14: rd-GC-genes-1, vig-Examples-12, vig-Examples-13, ... |
| `GC_genes` | `GC_chart` | covered | 78: beh-editor-toggles, beh-genes-style-by, beh-tracks-style, ... |
| `GC_genes` | `cluster` | covered | 2: rd-GC-genes-1, rd-GC-genes-2 |
| `GC_genes` | `colorScheme` | covered | 47: rd-GC-genes-1, rd-geneviewer-palette-1, vig-geneviewer-53, ... |
| `GC_genes` | `corner_radius` | covered | 1: cov-corner-radius |
| `GC_genes` | `customColors` | covered | 1: rd-GC-genes-1 |
| `GC_genes` | `group` | covered | 2: rd-GC-genes-1, vig-LoadGFF-1 |
| `GC_genes` | `groupStyle` | covered | 13: beh-editor-toggles, beh-genes-style-by, beh-tracks-style, ... |
| `GC_genes` | `itemStyle` | covered | 2: beh-genes-style-by, rd-GC-genes-2 |
| `GC_genes` | `marker` | covered | 60: cov-corner-radius, rd-GC-genes-1, vig-Examples-11, ... |
| `GC_genes` | `marker_size` | covered | 19: rd-GC-genes-1, vig-Examples-11, vig-Examples-13, ... |
| `GC_genes` | `show` | covered | 2: rd-GC-genes-1, vig-geneviewer-17 |
| `GC_genes` | `style_by` | covered | 10: beh-genes-style-by, beh-tracks-style, rd-GC-cluster-2, ... |
| `GC_grid` | `GC_chart` | covered | 10: beh-labels-spread-no-room, beh-labels-spread-no-room-top, rd-GC-grid-1, ... |
| `GC_grid` | `cluster` | covered | 6: rd-GC-grid-2, vig-Examples-16, vig-Examples-17, ... |
| `GC_grid` | `direction` | covered | 1: vig-geneviewer-16 |
| `GC_grid` | `height` | covered | 6: rd-GC-grid-2, vig-Examples-16, vig-Examples-17, ... |
| `GC_grid` | `margin` | covered | 7: beh-labels-spread-no-room, beh-labels-spread-no-room-top, rd-GC-grid-1, ... |
| `GC_grid` | `width` | covered | 1: vig-geneviewer-16 |
| `GC_labels` | `...` | covered | 34: beh-editor-box-escape, beh-editor-drag-escape, beh-editor-label-style, ... |
| `GC_labels` | `GC_chart` | covered | 151: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_labels` | `cluster` | covered | 11: rd-GC-labels-4, rd-GC-links-4, vig-Examples-12, ... |
| `GC_labels` | `groupStyle` | covered | 9: beh-labels-spread-one-group, beh-labels-style-by, beh-tracks-style, ... |
| `GC_labels` | `itemStyle` | covered | 5: rd-GC-labels-4, vig-geneviewer-13, vig-geneviewer-39, ... |
| `GC_labels` | `label` | covered | 147: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_labels` | `show` | covered | 1: rd-GC-labels-3 |
| `GC_labels` | `style_by` | covered | 7: beh-labels-style-by, beh-tracks-style, vig-Examples-15, ... |
| `GC_legend` | `...` | covered | 4: rd-GC-legend-1, vig-geneviewer-82, vig-geneviewer-83, ... |
| `GC_legend` | `GC_chart` | covered | 162: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_legend` | `align` | covered | 14: beh-legend-align-center, beh-legend-align-left, beh-legend-align-right, ... |
| `GC_legend` | `backgroundColor` | covered | 1: rd-GC-legend-1 |
| `GC_legend` | `corner_radius` | covered | 1: cov-corner-radius |
| `GC_legend` | `group` | covered | 140: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_legend` | `groupStyle` | covered | 6: beh-legend-group-style, beh-legend-large-text, vig-Examples-15, ... |
| `GC_legend` | `legendOptions` | covered | 3: rd-GC-legend-1, vig-geneviewer-82, vig-geneviewer-83 |
| `GC_legend` | `legendTextOptions` | covered | 10: rd-GC-legend-1, vig-Examples-14, vig-Examples-15, ... |
| `GC_legend` | `order` | covered | 18: rd-GC-legend-1, vig-Examples-11, vig-Examples-12, ... |
| `GC_legend` | `position` | covered | 68: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_legend` | `show` | covered | 1: vig-geneviewer-82 |
| `GC_legend` | `style` | covered | 3: rd-GC-legend-1, vig-geneviewer-15, vig-geneviewer-82 |
| `GC_links` | `...` | covered | 1: cov-links-low-color |
| `GC_links` | `GC_chart` | covered | 132: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_links` | `cluster` | covered | 2: rd-GC-links-2, vig-geneviewer-33 |
| `GC_links` | `colorBarOptions` | covered | 117: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_links` | `color_bar` | covered | 68: rd-GC-links-4, vig-Examples-12, vig-Examples-13, ... |
| `GC_links` | `curve` | covered | 69: rd-GC-links-4, vig-Examples-16, vig-Examples-17, ... |
| `GC_links` | `data` | covered | 7: beh-color-bar-legend-right-wrap, beh-links-fade, rd-GC-links-4, ... |
| `GC_links` | `group` | covered | 130: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_links` | `inverted_color` | covered | 68: rd-GC-links-4, vig-Examples-14, vig-Examples-7, ... |
| `GC_links` | `label` | covered | 126: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_links` | `labelStyle` | covered | 69: beh-links-own-labels, rd-GC-links-4, vig-Examples-12, ... |
| `GC_links` | `label_position` | covered | 5: beh-labels-link-measures, beh-labels-link-measures-zoomed, vig-Examples-16, ... |
| `GC_links` | `linkStyle` | covered | 67: rd-GC-links-4, vig-Examples-7, vig-Examples-8, ... |
| `GC_links` | `linkWidth` | covered | 67: rd-GC-links-4, vig-Examples-7, vig-Examples-8, ... |
| `GC_links` | `low_color` | covered | 1: cov-links-low-color |
| `GC_links` | `measure` | covered | 124: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_links` | `normal_color` | covered | 6: beh-links-fade, cov-links-low-color, rd-GC-links-4, ... |
| `GC_links` | `show_links` | covered | 2: rd-GC-links-4, vig-Examples-12 |
| `GC_links` | `use_group_colors` | covered | 3: rd-GC-links-4, vig-Examples-7, vig-Examples-8 |
| `GC_links` | `value1` | covered | 70: beh-links-own-labels, rd-GC-links-1, rd-GC-links-2, ... |
| `GC_links` | `value2` | covered | 70: beh-links-own-labels, rd-GC-links-1, rd-GC-links-2, ... |
| `GC_links` | `vmax` | covered | 2: beh-links-fade, vig-geneviewer-35 |
| `GC_links` | `vmin` | covered | 5: beh-links-fade, vig-Examples-16, vig-Examples-17, ... |
| `GC_normalize` | `GC_chart` | covered | 4: cov-normalize, rd-GC-normalize-1, vig-geneviewer-26, ... |
| `GC_normalize` | `cluster` | covered | 3: rd-GC-normalize-1, vig-geneviewer-26, vig-geneviewer-27 |
| `GC_normalize` | `custom_gaps` | covered | 1: vig-geneviewer-27 |
| `GC_normalize` | `gap` | covered | 3: rd-GC-normalize-1, vig-geneviewer-26, vig-geneviewer-27 |
| `GC_normalize` | `group` | covered | 2: vig-geneviewer-26, vig-geneviewer-27 |
| `GC_normalize` | `normalize` | covered | 1: cov-normalize |
| `GC_normalize` | `preserve_gene_length` | covered | 4: cov-normalize, rd-GC-normalize-1, vig-geneviewer-26, ... |
| `GC_pattern` | `GC_chart` | covered | 17: beh-editor-pattern-fill, rd-GC-pattern-1, rd-GC-pattern-2, ... |
| `GC_pattern` | `background` | covered | 13: beh-editor-pattern-fill, rd-GC-pattern-2, rd-GC-pattern-3, ... |
| `GC_pattern` | `color` | covered | 4: rd-GC-pattern-4, vig-Examples-16, vig-Examples-17, ... |
| `GC_pattern` | `patterns` | covered | 13: beh-editor-pattern-fill, rd-GC-pattern-2, rd-GC-pattern-4, ... |
| `GC_pattern` | `size` | covered | 7: vig-Examples-15, vig-Examples-16, vig-Examples-17, ... |
| `GC_pattern` | `strokeWidth` | covered | 3: vig-Examples-16, vig-Examples-17, vig-geneviewer-69 |
| `GC_scale` | `GC_chart` | covered | 51: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_scale` | `axis_position` | covered | 2: rd-GC-scale-1, vig-geneviewer-84 |
| `GC_scale` | `axis_type` | covered | 14: cov-range-annotations, vig-Examples-14, vig-Examples-15, ... |
| `GC_scale` | `breaks` | covered | 1: vig-geneviewer-86 |
| `GC_scale` | `cluster` | covered | 4: vig-Examples-3, vig-Examples-5, vig-Examples-9, ... |
| `GC_scale` | `end` | covered | 3: rd-GC-scale-1, vig-Examples-11, vig-geneviewer-86 |
| `GC_scale` | `hidden` | covered | 39: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_scale` | `lineStyle` | covered | 2: rd-GC-scale-1, vig-geneviewer-89 |
| `GC_scale` | `padding` | covered | 2: rd-GC-scale-1, vig-geneviewer-84 |
| `GC_scale` | `reverse` | covered | 6: rd-GC-scale-1, vig-Examples-3, vig-Examples-5, ... |
| `GC_scale` | `scale_break_padding` | covered | 10: rd-GC-scale-1, vig-Examples-15, vig-Examples-16, ... |
| `GC_scale` | `scale_break_threshold` | covered | 2: rd-GC-scale-1, vig-geneviewer-85 |
| `GC_scale` | `scale_breaks` | covered | 13: rd-GC-scale-1, rd-GC-sequence-2, vig-Examples-15, ... |
| `GC_scale` | `start` | covered | 3: rd-GC-scale-1, vig-Examples-11, vig-geneviewer-86 |
| `GC_scale` | `textStyle` | covered | 2: rd-GC-scale-1, vig-geneviewer-89 |
| `GC_scale` | `tickStyle` | covered | 2: rd-GC-scale-1, vig-geneviewer-89 |
| `GC_scale` | `tickValues` | covered | 1: vig-geneviewer-89 |
| `GC_scale` | `ticksCount` | covered | 3: rd-GC-scale-1, vig-Examples-11, vig-geneviewer-87 |
| `GC_scale` | `ticksFormat` | covered | 2: rd-GC-scale-1, vig-geneviewer-89 |
| `GC_scale` | `y` | covered | 2: rd-GC-scale-1, vig-geneviewer-84 |
| `GC_scaleBar` | `...` | covered | 10: beh-editor-drag-scale, beh-editor-drag-scaleBar, rd-GC-scaleBar-1, ... |
| `GC_scaleBar` | `GC_chart` | covered | 31: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_scaleBar` | `cluster` | covered | 3: rd-GC-scaleBar-1, rd-GC-scaleBar-2, vig-geneviewer-96 |
| `GC_scaleBar` | `labelStyle` | covered | 2: rd-GC-scaleBar-2, vig-geneviewer-96 |
| `GC_scaleBar` | `scaleBarLineStyle` | covered | 2: rd-GC-scaleBar-2, vig-geneviewer-96 |
| `GC_scaleBar` | `scaleBarTickStyle` | covered | 2: rd-GC-scaleBar-2, vig-geneviewer-96 |
| `GC_scaleBar` | `show` | covered | 1: cov-chart-without-extras |
| `GC_sequence` | `...` | covered | 1: rd-GC-sequence-2 |
| `GC_sequence` | `GC_chart` | covered | 48: rd-GC-sequence-1, rd-GC-sequence-2, vig-geneviewer-37, ... |
| `GC_sequence` | `cluster` | covered | 2: rd-GC-sequence-1, vig-geneviewer-37 |
| `GC_sequence` | `markerStyle` | covered | 2: rd-GC-sequence-2, vig-geneviewer-37 |
| `GC_sequence` | `sequenceStyle` | covered | 2: rd-GC-sequence-2, vig-geneviewer-37 |
| `GC_sequence` | `show` | covered | 47: rd-GC-sequence-1, vig-geneviewer-37, vig-geneviewer-53, ... |
| `GC_sequence` | `y` | covered | 2: rd-GC-sequence-1, vig-geneviewer-37 |
| `GC_theme` | `...` | covered | 4: beh-labels-spread-theme-off, rd-GC-theme-6, vig-geneviewer-79, ... |
| `GC_theme` | `GC_chart` | covered | 86: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_theme` | `background` | covered | 1: cov-theme-background |
| `GC_theme` | `fontFamily` | covered | 3: rd-GC-theme-2, vig-Examples-17, vig-geneviewer-77 |
| `GC_theme` | `lineColor` | covered | 1: vig-geneviewer-77 |
| `GC_theme` | `palette` | covered | 4: rd-GC-theme-2, vig-Examples-12, vig-Examples-13, ... |
| `GC_theme` | `pattern` | covered | 1: rd-GC-theme-4 |
| `GC_theme` | `textColor` | covered | 6: vig-Examples-10, vig-Examples-12, vig-Examples-13, ... |
| `GC_theme` | `textScale` | covered | 2: rd-GC-theme-5, vig-geneviewer-78 |
| `GC_theme` | `theme` | covered | 85: beh-blast-tooltips, beh-cluster-label-center, beh-cluster-label-italic, ... |
| `GC_title` | `...` | covered | 2: rd-GC-title-2, vig-geneviewer-15 |
| `GC_title` | `GC_chart` | covered | 37: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_title` | `align` | covered | 5: rd-GC-title-2, vig-Examples-11, vig-LoadGenBankFiles-2, ... |
| `GC_title` | `height` | covered | 7: rd-GC-title-2, vig-Examples-14, vig-Examples-15, ... |
| `GC_title` | `show` | covered | 2: rd-GC-title-1, rd-GC-title-2 |
| `GC_title` | `spacing` | covered | 1: rd-GC-title-2 |
| `GC_title` | `style` | covered | 2: rd-GC-title-2, vig-geneviewer-15 |
| `GC_title` | `subtitle` | covered | 8: rd-GC-title-1, rd-GC-title-2, vig-Examples-14, ... |
| `GC_title` | `subtitleFont` | covered | 6: rd-GC-title-2, vig-Examples-14, vig-Examples-15, ... |
| `GC_title` | `title` | covered | 37: beh-blast-tooltips, beh-coordinates-groups, beh-coordinates-plain, ... |
| `GC_title` | `titleFont` | covered | 7: rd-GC-title-2, vig-Examples-14, vig-Examples-15, ... |
| `GC_toolbar` | `GC_chart` | covered | 6: beh-toolbar-custom, beh-toolbar-never, beh-toolbar-save-only, ... |
| `GC_toolbar` | `buttons` | covered | 3: beh-toolbar-custom, beh-toolbar-save-only, cov-toolbar |
| `GC_toolbar` | `color` | covered | 3: beh-toolbar-custom, rd-GC-toolbar-1, vig-geneviewer-7 |
| `GC_toolbar` | `fontFamily` | covered | 1: cov-toolbar |
| `GC_toolbar` | `hoverColor` | covered | 2: rd-GC-toolbar-1, vig-geneviewer-7 |
| `GC_toolbar` | `icons` | covered | 3: beh-toolbar-custom, rd-GC-toolbar-1, vig-geneviewer-7 |
| `GC_toolbar` | `position` | covered | 3: beh-toolbar-custom, rd-GC-toolbar-1, vig-geneviewer-7 |
| `GC_toolbar` | `show` | covered | 5: beh-toolbar-custom, beh-toolbar-never, cov-toolbar, ... |
| `GC_toolbar` | `size` | covered | 3: beh-toolbar-custom, rd-GC-toolbar-1, vig-geneviewer-7 |
| `GC_toolbar` | `tooltipBackground` | covered | 2: beh-toolbar-custom, vig-geneviewer-7 |
| `GC_toolbar` | `tooltipBorder` | covered | 1: cov-toolbar |
| `GC_toolbar` | `tooltipColor` | covered | 1: cov-toolbar |
| `GC_toolbar` | `tooltipRadius` | covered | 1: cov-toolbar |
| `GC_toolbar` | `tooltipShadow` | covered | 1: cov-toolbar |
| `GC_tooltip` | `...` | covered | 1: cov-tooltip-style |
| `GC_tooltip` | `GC_chart` | covered | 62: cov-chart-without-extras, cov-tooltip-style, rd-GC-tooltip-1, ... |
| `GC_tooltip` | `cluster` | covered | 2: vig-geneviewer-26, vig-geneviewer-27 |
| `GC_tooltip` | `formatter` | covered | 61: cov-tooltip-style, rd-GC-tooltip-1, vig-Examples-1, ... |
| `GC_tooltip` | `show` | covered | 1: cov-chart-without-extras |
| `GC_trackMouse` | `...` | covered | 1: cov-track-mouse |
| `GC_trackMouse` | `GC_chart` | covered | 14: beh-editor-link-click, cov-track-mouse, rd-GC-annotation-1, ... |
| `GC_trackMouse` | `cluster` | covered | 1: cov-track-mouse |
| `GC_trackMouse` | `show` | covered | 1: cov-track-mouse |
| `GC_transcript` | `...` | covered | 1: cov-transcript-group-styles |
| `GC_transcript` | `GC_chart` | covered | 13: beh-transcript-marker, beh-transcript-styles, cov-transcript-group-styles, ... |
| `GC_transcript` | `colorScheme` | covered | 1: rd-GC-transcript-1 |
| `GC_transcript` | `customColors` | covered | 2: rd-GC-transcript-1, vig-geneviewer-29 |
| `GC_transcript` | `group` | covered | 2: rd-GC-transcript-1, vig-geneviewer-29 |
| `GC_transcript` | `groupStyleExons` | covered | 3: beh-transcript-marker, beh-transcript-styles, cov-transcript-group-styles |
| `GC_transcript` | `groupStyleIntrons` | covered | 2: beh-transcript-styles, cov-transcript-group-styles |
| `GC_transcript` | `groupStyleUTRs` | covered | 2: beh-transcript-styles, cov-transcript-group-styles |
| `GC_transcript` | `itemStyleExons` | covered | 4: beh-transcript-styles, rd-GC-transcript-1, rd-GC-transcript-2, ... |
| `GC_transcript` | `itemStyleIntrons` | covered | 2: rd-GC-transcript-1, vig-geneviewer-31 |
| `GC_transcript` | `itemStyleUTRs` | covered | 1: rd-GC-transcript-1 |
| `GC_transcript` | `labelOptions` | covered | 2: rd-GC-transcript-1, vig-geneviewer-30 |
| `GC_transcript` | `selection` | covered | 3: rd-GC-transcript-1, rd-GC-transcript-2, vig-geneviewer-31 |
| `GC_transcript` | `show` | covered | 1: rd-GC-transcript-1 |
| `GC_transcript` | `strand` | covered | 8: beh-transcript-marker, beh-transcript-styles, cov-transcript-group-styles, ... |
| `GC_transcript` | `styleExons` | covered | 2: rd-GC-transcript-1, vig-geneviewer-30 |
| `GC_transcript` | `styleIntrons` | covered | 2: rd-GC-transcript-1, vig-geneviewer-30 |
| `GC_transcript` | `styleUTRs` | covered | 2: rd-GC-transcript-1, vig-geneviewer-30 |
| `GC_transcript` | `style_by` | covered | 3: beh-transcript-marker, beh-transcript-styles, cov-transcript-group-styles |
| `GC_transcript` | `transcript` | covered | 11: beh-transcript-marker, beh-transcript-styles, cov-transcript-group-styles, ... |
| `GC_transcript` | `type` | covered | 8: beh-transcript-marker, beh-transcript-styles, cov-transcript-group-styles, ... |
| `GC_zoom` | `GC_chart` | covered | 18: beh-labels-link-measures-zoomed, beh-labels-spread-zoomed, beh-zoom-redraw, ... |
| `GC_zoom` | `color` | covered | 1: cov-zoom-styles |
| `GC_zoom` | `handleStyle` | covered | 2: rd-GC-zoom-2, vig-geneviewer-91 |
| `GC_zoom` | `height` | covered | 4: rd-GC-zoom-2, vig-Examples-16, vig-Examples-17, ... |
| `GC_zoom` | `min` | covered | 1: cov-zoom-styles |
| `GC_zoom` | `mode` | covered | 2: rd-GC-zoom-2, vig-geneviewer-91 |
| `GC_zoom` | `overview` | covered | 2: cov-zoom-no-overview, cov-zoom-styles |
| `GC_zoom` | `range` | covered | 13: beh-labels-link-measures-zoomed, beh-labels-spread-zoomed, beh-zoom-redraw, ... |
| `GC_zoom` | `show` | covered | 1: cov-zoom-styles |
| `GC_zoom` | `style` | covered | 1: cov-zoom-styles |
| `GC_zoom` | `update` | covered | 2: rd-GC-zoom-2, vig-geneviewer-91 |
| `GC_zoom` | `windowStyle` | covered | 1: cov-zoom-styles |
