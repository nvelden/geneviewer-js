# Charts for the fixture tests, in addition to the R package's help-page
# examples and vignettes. Each "## fixture: <id>" names the chart made by the
# next expression. Exported by scripts/export-fixtures.R.

## fixture: ophA
gene_cluster <- data.frame(
  name = c("ophB1", "ophC", "ophA", "ophD", "ophB2", "ophP", "ophE"),
  start = c(2522, 5286, 9536, 12616, 13183, 19346, 20170),
  end = c(4276, 4718, 10904, 11859, 15046, 16016, 21484),
  class = c("Monooxygenase", "NTF2-like", "Methyltransferase",
  "O-acyltransferase", "Monooxygenase", "Prolyloligopeptidase",
  "F-box/RNHI-like")
)

GC_chart(gene_cluster, group = "class", height = "100px") %>%
  GC_labels("name")

## fixture: interactive
GC_chart(ophA_clusters, group = "class", cluster = "cluster",
         height = "320px") %>%
  GC_labels("name") %>%
  GC_links("class", measure = "identity") %>%
  GC_clusterLabel() %>%
  GC_zoom() %>%
  GC_events(select = TRUE)

# Coverage: arguments not used by the help-page examples or vignettes
# (see test/coverage.md)

## fixture: cov-chart-without-extras
GC_chart(ophA_clusters, group = "class", cluster = "cluster",
         height = "250px", save_button = FALSE) %>%
  GC_labels("name") %>%
  GC_clusterLabel(show = FALSE) %>%
  GC_scaleBar(show = FALSE) %>%
  GC_tooltip(show = FALSE)

## fixture: cov-coordinates-group-style
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_coordinates(groupStyle = list(
    Monooxygenase = list(fill = "red", tick = list(stroke = "red")),
    "NTF2-like" = list(show = FALSE)
  ))

## fixture: cov-coordinates-style-by
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_coordinates(style_by = "name",
                 groupStyle = list(ophA = list(fill = "blue", fontWeight = "bold")))

## fixture: cov-element-style-reset
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_labels("name") %>%
  GC_element_style("labels", row_id = 1, fill = "red") %>%
  GC_element_style("labels", row_id = 2, fill = "blue") %>%
  GC_element_style("labels", row_id = 2, reset = TRUE)

## fixture: cov-events
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_legend(TRUE) %>%
  GC_events(click = FALSE, dblclick = TRUE, legend_click = FALSE,
            zoom = TRUE, highlight = TRUE)

## fixture: cov-corner-radius
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_genes(marker = "rbox", corner_radius = 6) %>%
  GC_legend(corner_radius = 4)

## fixture: cov-links-low-color
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_links("class", measure = "identity", low_color = "#dddddd",
           normal_color = "#1f77b4", opacity = 0.6)

## fixture: cov-normalize
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_normalize(normalize = TRUE, preserve_gene_length = FALSE)

## fixture: cov-theme-background
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_labels("name") %>%
  GC_theme("dark", background = "#1d2433")

## fixture: cov-toolbar
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_events(drag = TRUE) %>%
  GC_toolbar(show = "always", buttons = c("undo", "redo", "save"),
             fontFamily = "serif", tooltipColor = "#333333",
             tooltipBorder = "1px solid #b7b9be", tooltipRadius = "4px",
             tooltipShadow = "1px 2px 10px rgba(0, 0, 0, 0.2)")

## fixture: cov-tooltip-style
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_tooltip(formatter = "<b>{name}</b>", backgroundColor = "#ffffcc")

## fixture: cov-range-annotations
# Annotations move with the genes of a range axis, added before or after it;
# a rectangle moves corner by corner (M6.3)
GC_chart(data.frame(start = c(1000, 1500, 200, 600), end = c(1400, 1900, 500, 900),
                    name = c("a", "b", "c", "d"), cluster = c(1, 1, 2, 2)),
         cluster = "cluster", group = "name", height = "250px") %>%
  GC_annotation(cluster = 1, type = "rectangle",
                position = list(list(c(1100, 60), c(1300, 40)))) %>%
  GC_scale(axis_type = "range") %>%
  GC_annotation(cluster = 1, type = "text", text = "x", x = 1450) %>%
  GC_annotation(cluster = 2, type = "rectangle",
                position = list(list(c(250, 60), c(450, 40)), list(c(650, 60), c(850, 40))))

## fixture: cov-track-mouse
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_trackMouse(show = TRUE, cluster = 1, backgroundColor = "black", color = "white")

## fixture: cov-transcript-group-styles
GC_chart(BRCA1_splice_variants, height = "500px") %>%
  GC_transcript(
    transcript = "ensembl_transcript_id", strand = "strand", type = "type",
    style_by = "ensembl_transcript_id",
    groupStyleExons = list(ENST00000357654 = list(fill = "red")),
    groupStyleIntrons = list(ENST00000357654 = list(stroke = "red")),
    groupStyleUTRs = list(ENST00000357654 = list(fill = "pink")),
    opacity = 0.8
  )

## fixture: cov-zoom-styles
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "300px") %>%
  GC_zoom(show = TRUE, range = c(0.1, 0.5), min = 0.05, overview = TRUE,
          color = "grey", style = list(backgroundColor = "#eeeeee"),
          windowStyle = list(border = "1px solid red"))

## fixture: cov-zoom-no-overview
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "300px") %>%
  GC_zoom(range = c(0.3, 0.7), overview = FALSE)

# Data without rows, e.g. a Shiny filter that leaves nothing: an empty chart
# with its title, legend and other options, no error (R's B75)
## fixture: cov-empty-data
GC_chart(ophA_clusters[0, ], cluster = "cluster", group = "class", height = "200px") %>%
  GC_title("No genes") %>% GC_labels("name") %>% GC_legend() %>% GC_coordinates() %>%
  GC_zoom()

## fixture: cov-empty-data-no-cluster
GC_chart(data.frame(start = NA, end = 10, name = "a"), height = "150px") %>%
  GC_labels("name")

# show = FALSE hides what an earlier call shows, per cluster; hidden labels
# need no column, also without a group (R's B76)
## fixture: cov-hide-shown
GC_chart(ophA_clusters, cluster = "cluster", height = "250px") %>%
  GC_labels("name") %>% GC_labels(show = FALSE, cluster = 2) %>%
  GC_coordinates() %>% GC_coordinates(show = FALSE, cluster = 1) %>%
  GC_clusterTitle("Title") %>% GC_clusterTitle(show = FALSE, cluster = 2)

# Interaction tests (test/interaction/scenarios.cjs)

## fixture: interaction-zoom-events
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "300px") %>%
  GC_labels("name") %>%
  GC_zoom() %>%
  GC_events(zoom = TRUE)

# Behaviour tests (test/behaviour/*.cjs): what a drawn chart does, checked
# with assertions. Moved from the R package's browser tests.

# Element editor (test/behaviour/editor.cjs)

beh_two_genes <- data.frame(start = c(10, 60), end = c(40, 90), group = c("A", "B"))
beh_two_labels <- data.frame(start = c(10, 100), end = c(50, 140), name = c("Gene", "Other"))

## fixture: beh-editor-toggles
GC_chart(data.frame(start = c(90, 10), end = c(130, 40), name = c("same", "same"), group = "A"),
         group = "group", height = "300px") %>%
  GC_labels("name") %>%
  GC_genes(groupStyle = list(A = list(fill = "green"))) %>%
  GC_element_style("genes", 1, fill = "red") %>%
  GC_element_style("labels", 1, text = "Edited") %>%
  GC_events(click = FALSE, select = TRUE, dblclick = TRUE, legend_click = FALSE)

## fixture: beh-editor-link-click
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "400px") %>%
  GC_links("class", label = FALSE) %>%
  GC_trackMouse() %>%
  GC_events(click = TRUE, highlight = TRUE, select = TRUE)

## fixture: beh-editor-pattern-fill
GC_chart(beh_two_genes, group = "group", height = "200px") %>%
  GC_color(customColors = list(A = "#c7e02c", B = "#1f77b4")) %>%
  GC_pattern(patterns = list(B = "diagonal"), background = NULL) %>%
  GC_events(select = TRUE)

## fixture: beh-editor-cluster-parts
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "500px") %>%
  GC_clusterTitle(title = c("Title A", "Title B"), subtitle = "Sub") %>%
  GC_clusterFooter(title = "Foot", subtitle = "Foot sub") %>%
  GC_clusterLabel(title = c("Label A", "Label B"), subtitle = "Species") %>%
  GC_coordinates() %>%
  GC_element_style("clusterTitle", cluster = 1, part = "subtitle", text = "Edited",
                   fill = "red", fontStyle = "italic") %>%
  GC_element_style("clusterFooter", cluster = "ophA", part = "title", text = "") %>%
  GC_element_style("clusterLabel", cluster = 2, part = "title", fontSize = "20px") %>%
  GC_element_style("clusterLabel", cluster = 2, part = "subtitle", fill = "blue") %>%
  GC_element_style("coordinates", row_id = 1, end = "start", fill = "red") %>%
  GC_element_style("coordinates", row_id = 2, show = FALSE) %>%
  GC_events(click = FALSE, select = TRUE)

## fixture: beh-editor-legend-parts
GC_chart(beh_two_genes, group = "group", height = "300px") %>%
  GC_element_style("legend", group = "A", part = "label", text = "Edited", fill = "red") %>%
  GC_element_style("legend", group = "A", part = "marker", fill = "blue", strokeWidth = 3) %>%
  GC_events(select = TRUE, dblclick = TRUE)

## fixture: beh-editor-drag-escape
GC_chart(data.frame(start = 10, end = 50, name = "Gene"), height = "250px") %>%
  GC_labels("name", adjustLabels = FALSE, rotate = 30) %>%
  GC_events(click = FALSE, drag = TRUE)

## fixture: beh-editor-label-style
GC_chart(data.frame(start = c(10, 30, 50), end = c(25, 45, 65),
                    name = c("long gene label alpha", "long gene label beta", "long gene label gamma")),
         width = "450px", height = "400px") %>%
  GC_labels("name", fontSize = "16px") %>%
  GC_element_style("labels", 1, fill = "red", moveX = 25, moveY = 10) %>%
  GC_events(click = FALSE, select = TRUE, drag = TRUE)

## fixture: beh-editor-drag-scaleBar
GC_chart(data.frame(start = c(10, 20), end = c(50, 60), cluster = c("A", "B")),
         cluster = "cluster", height = "400px") %>%
  GC_scale(hidden = FALSE) %>%
  GC_scaleBar(scaleBarUnit = 10) %>%
  GC_element_style("scaleBar", cluster = "A", moveX = 5, moveY = -5) %>%
  GC_events(click = FALSE, select = TRUE, drag = TRUE)

## fixture: beh-editor-drag-scale
GC_chart(data.frame(start = c(10, 20), end = c(50, 60), cluster = c("A", "B")),
         cluster = "cluster", height = "400px") %>%
  GC_scale(hidden = FALSE) %>%
  GC_scaleBar(scaleBarUnit = 10) %>%
  GC_element_style("scale", cluster = "A", moveX = 5, moveY = -5) %>%
  GC_events(click = FALSE, select = TRUE, drag = TRUE)

## fixture: beh-editor-undo
GC_chart(beh_two_labels, height = "250px") %>%
  GC_labels("name", adjustLabels = FALSE) %>%
  GC_element_style("labels", 2, moveX = 5, moveY = 5) %>%
  GC_events(click = FALSE, select = TRUE, drag = TRUE)

## fixture: beh-editor-scaled-drag
GC_chart(data.frame(start = 10, end = 50, name = "Gene"), height = "250px") %>%
  GC_labels("name", adjustLabels = FALSE) %>%
  GC_events(click = FALSE, drag = TRUE)

## fixture: beh-editor-legend-drag
GC_chart(beh_two_genes, group = "group", height = "250px") %>%
  GC_legend(TRUE) %>%
  GC_element_style("legend", group = "B", part = "marker", moveX = 4, moveY = -3) %>%
  GC_events(click = FALSE, drag = TRUE)

## fixture: beh-editor-multi-select
GC_chart(data.frame(beh_two_labels, group = c("A", "B")), group = "group", height = "300px") %>%
  GC_labels("name", adjustLabels = FALSE) %>%
  GC_legend(TRUE) %>%
  GC_events(click = FALSE, select = TRUE, drag = TRUE)

## fixture: beh-editor-box-escape
GC_chart(beh_two_labels, height = "300px") %>%
  GC_labels("name", adjustLabels = FALSE) %>%
  GC_events(click = FALSE, select = TRUE, drag = TRUE)

beh_toolbar_chart <- GC_chart(data.frame(start = c(10, 60), end = c(40, 90), name = c("A", "B")),
                              height = "200px") %>%
  GC_labels("name") %>%
  GC_events(select = TRUE, drag = TRUE)

## fixture: beh-toolbar-custom
beh_toolbar_chart %>% GC_theme("dark") %>%
  GC_toolbar(show = "always", position = "bottomleft", buttons = c("undo", "save"), size = 16,
             color = "rgb(1, 2, 3)", tooltipBackground = "rgb(4, 5, 6)",
             icons = list(undo = "fa-regular fa-circle-left", save = "camera"))

## fixture: beh-toolbar-themed
beh_toolbar_chart %>% GC_theme("dark")

## fixture: beh-toolbar-never
beh_toolbar_chart %>% GC_toolbar(show = "never")

## fixture: beh-toolbar-save-only
GC_chart(data.frame(start = c(10, 60), end = c(40, 90), name = c("A", "B")), height = "200px") %>%
  GC_toolbar(buttons = c("undo", "save"))

# Label placement (test/behaviour/labels.cjs)

beh_placement_genes <- data.frame(
  cluster = rep(c("a", "b"), each = 6),
  start = rep(c(1, 400, 800, 830, 860, 890), 2),
  end = rep(c(380, 780, 828, 858, 888, 1000), 2),
  name = rep(c("first gene", "second gene", "x long name", "y long name",
               "z long name", "last long name"), 2),
  homolog = rep(paste0("h", 1:6), 2),
  identity = c(rep(NA, 6), 91.25, 64, 80, 55, 70, 99)
)
beh_placement_chart <- GC_chart(beh_placement_genes, cluster = "cluster",
                                height = "260px", width = "700px")
# One cluster of narrow genes with short names, up to the right end
beh_turning_chart <- GC_chart(
  data.frame(start = c(1, 900, 930, 960, 985), end = c(880, 928, 958, 983, 1000),
             name = c("first gene", "alpha", "beta", "gamma", "last label here")),
  height = "300px", width = "700px")

## fixture: beh-labels-turned
beh_turning_chart %>% GC_labels("name")

## fixture: beh-labels-too-long
beh_placement_chart %>% GC_labels("name")

## fixture: beh-labels-hide
beh_turning_chart %>% GC_labels("name", adjustLabels = "hide")

## fixture: beh-labels-link-measures
beh_placement_chart %>% GC_labels("name") %>%
  GC_links(group = "homolog", label_position = "link", label = TRUE)

## fixture: beh-labels-link-measures-zoomed
beh_placement_chart %>% GC_labels("name") %>%
  GC_links(group = "homolog", label_position = "link", label = TRUE) %>%
  GC_zoom(range = c(0.78, 1))

## fixture: beh-labels-spread
beh_turning_chart %>% GC_labels("name", adjustLabels = "spread")

## fixture: beh-labels-spread-top
beh_turning_chart %>% GC_labels("name", adjustLabels = "spread", spreadPosition = "top")

## fixture: beh-labels-spread-empty
GC_chart(data.frame(start = c(1, 300, 600, 800), end = c(250, 550, 750, 1000),
                    name = c("first", NA, "", "last")),
         height = "300px", width = "700px") %>%
  GC_labels("name", adjustLabels = "spread")

## fixture: beh-labels-spread-no-lines
beh_turning_chart %>% GC_labels("name", adjustLabels = "spread", leaderLine = FALSE)

## fixture: beh-labels-spread-zoomed
beh_turning_chart %>% GC_labels("name", adjustLabels = "spread") %>% GC_zoom(range = c(0.85, 1))

## fixture: beh-labels-spread-vintage
beh_turning_chart %>% GC_labels("name", adjustLabels = "spread") %>% GC_theme("vintage")

## fixture: beh-labels-spread-own-line
beh_turning_chart %>% GC_labels("name", adjustLabels = "spread", leaderLine = list(stroke = "red")) %>%
  GC_theme("vintage")

## fixture: beh-labels-spread-many
GC_chart(data.frame(start = seq(1, 5901, by = 100), end = seq(90, 5990, by = 100),
                    name = paste0("gene", 1:60)),
         height = "300px", width = "700px") %>%
  GC_labels("name", adjustLabels = "spread")

## fixture: beh-labels-spread-no-room
beh_turning_chart %>% GC_labels("name", adjustLabels = "spread", leaderLine = list(length = 200)) %>%
  GC_grid(margin = list(top = 0, bottom = 0))

## fixture: beh-labels-spread-no-room-top
beh_turning_chart %>%
  GC_labels("name", adjustLabels = "spread", spreadPosition = "top", leaderLine = list(length = 200)) %>%
  GC_grid(margin = list(top = 0, bottom = 0))

## fixture: beh-labels-spread-one-group
GC_chart(data.frame(start = c(1, 110, 800), end = c(100, 200, 1000), kind = c("a", "b", "b"),
                    name = c("a rather long gene name", "another long gene name", "")),
         group = "kind", height = "300px", width = "700px") %>%
  GC_labels("name", groupStyle = list(a = list(adjustLabels = "spread")))

## fixture: beh-labels-spread-theme-off
beh_turning_chart %>% GC_labels("name", adjustLabels = "spread", leaderLine = list(stroke = "red")) %>%
  GC_theme(labels = list(leaderLine = FALSE))

# Color bar (test/behaviour/color-bar.cjs)

beh_color_bar_chart <- function(colorBarOptions = list(), legend = TRUE, theme = "default") {
  chart <- GC_chart(
    data.frame(start = c(10, 90, 130, 170, 240, 250), end = c(40, 120, 160, 200, 210, 270),
               group = c("A", "B", "C", "A", "B", "C"), identity = c(NA, NA, NA, 50, 40, 100),
               cluster = c(1, 1, 1, 2, 2, 2)),
    cluster = "cluster", group = "group", height = "240px", width = "700px") %>%
    GC_links(group = "group", measure = "identity", label = FALSE,
             colorBarOptions = colorBarOptions) %>%
    GC_theme(theme)
  if (legend) GC_legend(chart, position = "top") else GC_legend(chart, FALSE)
}

## fixture: beh-color-bar-legend
beh_color_bar_chart(list(position = "legend"))

## fixture: beh-color-bar-default
beh_color_bar_chart()

## fixture: beh-color-bar-topleft
beh_color_bar_chart(list(position = "topleft", orientation = "horizontal"))

## fixture: beh-color-bar-bottomleft
beh_color_bar_chart(list(position = "bottomleft"))

## fixture: beh-color-bar-topright
beh_color_bar_chart(list(position = "topright"))

## fixture: beh-color-bar-no-legend
beh_color_bar_chart(list(position = "legend"), legend = FALSE)

## fixture: beh-color-bar-publication
beh_color_bar_chart(list(position = "legend"), theme = "publication")

## fixture: beh-color-bar-labels-below
beh_color_bar_chart(list(orientation = "horizontal", position = "bottomright", labels = "below"))

## fixture: beh-color-bar-horizontal
beh_color_bar_chart(list(orientation = "horizontal"))

## fixture: beh-color-bar-legend-right
beh_color_bar_chart(list(position = "legend", legendSide = "right"))

## fixture: beh-color-bar-legend-right-wrap
GC_chart(pQEB1_plasmids, cluster = "cluster", group = "category",
         height = "420px", width = "700px") %>%
  GC_links(data = pQEB1_alignment, label = FALSE,
           colorBarOptions = list(position = "legend", legendSide = "right")) %>%
  GC_legend(position = "top")

# Zoom (test/behaviour/zoom.cjs)

## fixture: beh-zoom-slider
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "400px", width = "800px") %>%
  GC_labels("name") %>%
  GC_links("class") %>%
  GC_scale(hidden = FALSE) %>%
  GC_events(zoom = TRUE) %>%
  GC_zoom(range = c(0.25, 0.5))

## fixture: beh-zoom-redraw
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "400px", width = "800px") %>%
  GC_events(zoom = TRUE) %>%
  GC_zoom(range = c(0.25, 0.5))

## fixture: beh-zoom-render-id
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "400px", width = "800px") %>%
  GC_events(zoom = TRUE, render_id = "load-1") %>%
  GC_zoom(range = c(0.25, 0.5))

## fixture: beh-zoom-saved
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "400px", width = "800px") %>%
  GC_title("Zoomed") %>%
  GC_legend(position = "bottom") %>%
  GC_element_style("legend", group = "Monooxygenase", part = "label", moveY = 4) %>%
  GC_zoom(range = c(0.2, 0.6))

# Layout (test/behaviour/layout.cjs)

beh_ab <- data.frame(start = c(10, 50), end = c(40, 80), group = c("A", "B"))
beh_abc <- data.frame(start = c(10, 50, 90), end = c(40, 80, 120), group = c("A", "B", "C"))

## fixture: beh-title-descenders
GC_chart(beh_ab, group = "group", height = "150px") %>%
  GC_title("Gypsy group") %>%
  GC_theme("classic")

## fixture: beh-legend-fixed-width
GC_chart(beh_ab, group = "group", width = "600px", height = "150px")

## fixture: beh-legend-align-left
GC_chart(beh_abc, group = "group", width = "600px", height = "150px") %>% GC_legend(align = "left")

## fixture: beh-legend-align-center
GC_chart(beh_abc, group = "group", width = "600px", height = "150px") %>% GC_legend(align = "center")

## fixture: beh-legend-align-right
GC_chart(beh_abc, group = "group", width = "600px", height = "150px") %>% GC_legend(align = "right")

## fixture: beh-footer-align-left
GC_chart(beh_ab, group = "group", width = "600px", height = "200px") %>%
  GC_clusterLabel("Cluster") %>%
  GC_clusterTitle(title = "Title", align = "left") %>%
  GC_clusterFooter(title = "Footer", align = "left")

## fixture: beh-footer-align-right
GC_chart(beh_ab, group = "group", width = "600px", height = "200px") %>%
  GC_clusterLabel("Cluster") %>%
  GC_clusterTitle(title = "Title", align = "right") %>%
  GC_clusterFooter(title = "Footer", align = "right")

## fixture: beh-cluster-label-left
GC_chart(beh_ab, group = "group", width = "600px", height = "200px") %>%
  GC_clusterLabel("A long cluster name wrapped", width = "120px", align = "left")

## fixture: beh-cluster-label-center
GC_chart(beh_ab, group = "group", width = "600px", height = "200px") %>%
  GC_clusterLabel("A long cluster name wrapped", width = "120px", align = "center")

## fixture: beh-cluster-label-right
GC_chart(beh_ab, group = "group", width = "600px", height = "200px") %>%
  GC_clusterLabel("A long cluster name wrapped", width = "120px", align = "right")

## fixture: beh-cluster-label-italic
GC_chart(beh_ab, group = "group", width = "600px", height = "200px") %>%
  GC_clusterLabel("pQEB1_inv3 <i>Enterobacter cloacae ECL-21</i>", width = "120px",
                  wrapOptions = list(splitOnHyphen = FALSE))

## fixture: beh-cluster-label-subtitle
GC_chart(beh_ab, group = "group", width = "600px", height = "200px") %>%
  GC_clusterLabel("pQEB1", subtitle = "E. cloacae", subtitleFont = list(fontStyle = "italic"))

## fixture: beh-cluster-label-wrapped-subtitle
GC_chart(beh_ab, group = "group", width = "600px", height = "200px") %>%
  GC_clusterLabel("A long cluster name wrapped", subtitle = "E. cloacae",
                  width = "100px", spacing = 20)

## fixture: beh-links-fade
GC_chart(data.frame(cluster = c("A", "B"), start = c(1, 1), end = c(400, 400)),
         cluster = "cluster", height = "300px") %>%
  GC_links(data = data.frame(cluster1 = "A", start1 = c(1, 101, 201, 301), end1 = c(90, 190, 290, 390),
                             cluster2 = "B", start2 = c(1, 101, 201, 301), end2 = c(90, 190, 290, 390),
                             identity = c(40, 60, 80, 100)),
           vmin = 60, vmax = 100, normal_color = "#000000")

beh_link_genes <- data.frame(cluster = rep(c("A", "B"), each = 2), start = c(1, 201, 1, 201),
                             end = c(150, 350, 150, 350), name = rep(c("a", "b"), 2),
                             identity = c(NA, NA, 90, 70))

## fixture: beh-links-own-labels
GC_chart(beh_link_genes, cluster = "cluster", group = "name", height = "300px") %>%
  GC_links("name", value1 = "a", value2 = "a", labelStyle = list(fill = "red")) %>%
  GC_links("name", value1 = "b", value2 = "b", labelStyle = list(fill = "blue"))

## fixture: beh-links-shared-labels
GC_chart(beh_link_genes, cluster = "cluster", group = "name", height = "300px") %>%
  GC_links("name") %>%
  GC_links("name")

beh_every_part <- GC_chart(beh_link_genes, cluster = "cluster", group = "name", height = "500px") %>%
  GC_title("Chart title") %>%
  GC_clusterTitle(title = c("Title A", "Title B")) %>%
  GC_clusterFooter(title = c("Footer A", "Footer B")) %>%
  GC_clusterLabel() %>%
  GC_labels("name") %>%
  GC_coordinates() %>%
  GC_scale(hidden = FALSE) %>%
  GC_scaleBar() %>%
  GC_annotation(cluster = "A", type = "text", text = "note", x = 100, y = 80) %>%
  GC_links("name")

## fixture: beh-every-part
beh_every_part

## fixture: beh-every-part-events
beh_every_part %>% GC_events(highlight = TRUE)

# Group styles (test/behaviour/styles.cjs)

beh_group_genes <- data.frame(start = c(10, 50, 90, 130), end = c(40, 80, 120, 160),
                              name = c("a1", "b1", "a2", "c1"), class = c("A", "B", "A", "C"),
                              family = c("x", "y", "y", "x"), cluster = 1)
beh_transcripts <- data.frame(
  transcript = c("tx1", "tx1", "tx1", "tx1", "tx2", "tx2", "tx2"),
  type = c("5_utr", "exon", "exon", "3_utr", "5_utr", "exon", "3_utr"),
  start = c(1, 101, 201, 301, 1, 101, 301),
  end = c(50, 150, 250, 350, 50, 150, 350),
  strand = "forward"
)

## fixture: beh-genes-style-by
GC_chart(beh_group_genes, group = "class", height = "150px") %>%
  GC_genes(style_by = "family",
           groupStyle = list(y = list(fill = "rgb(255, 0, 0)")),
           itemStyle = list(list(index = 2, fill = "rgb(0, 0, 255)")))

## fixture: beh-labels-style-by
GC_chart(beh_group_genes, group = "class", height = "150px") %>%
  GC_labels(label = "name", style_by = "name",
            groupStyle = list(b1 = list(fill = "rgb(255, 0, 0)", fontWeight = "bold")))

## fixture: beh-legend-group-style
GC_chart(beh_group_genes, group = "class", width = "600px", height = "150px") %>%
  GC_legend(groupStyle = list(
    A = list(fontStyle = "italic"),
    B = list(fill = "rgb(255, 0, 0)", marker = list(stroke = "rgb(0, 128, 0)"))
  ))

## fixture: beh-legend-large-text
GC_chart(beh_group_genes, group = "class", width = "600px", height = "150px") %>%
  GC_legend(groupStyle = list(A = list(fontSize = "24px", fontWeight = "bold")))

## fixture: beh-transcript-styles
GC_chart(beh_transcripts, height = "200px") %>%
  GC_transcript(transcript = "transcript", type = "type", strand = "strand",
                style_by = "transcript",
                groupStyleExons = list(tx1 = list(fill = "rgb(255, 0, 0)")),
                groupStyleIntrons = list(tx1 = list(stroke = "rgb(0, 0, 255)")),
                groupStyleUTRs = list(tx2 = list(fill = "rgb(0, 128, 0)")),
                itemStyleExons = list(list(index = 1, fill = "rgb(0, 0, 0)")))

## fixture: beh-transcript-marker
GC_chart(beh_transcripts, height = "200px") %>%
  GC_transcript(transcript = "transcript", type = "type", strand = "strand",
                style_by = "transcript",
                groupStyleExons = list(tx2 = list(markerHeight = 40)))

## fixture: beh-coordinates-groups
GC_chart(beh_group_genes, group = "class", height = "200px") %>%
  GC_coordinates(groupStyle = list(
    B = list(show = FALSE),
    C = list(fill = "rgb(255, 0, 0)", tick = list(stroke = "rgb(0, 0, 255)"))
  ))

## fixture: beh-coordinates-shared
GC_chart(data.frame(start = c(10, 50, 80), end = c(40, 80, 120), class = c("A", "B", "A")),
         group = "class", height = "200px") %>%
  GC_coordinates(groupStyle = list(B = list(show = FALSE)))

## fixture: beh-coordinates-style-by
GC_chart(beh_group_genes, group = "class", height = "200px") %>%
  GC_coordinates(style_by = "family", groupStyle = list(y = list(show = FALSE)))

## fixture: beh-coordinates-plain
GC_chart(beh_group_genes, group = "class", height = "200px") %>%
  GC_labels("name") %>%
  GC_coordinates()

## fixture: beh-tracks-style
GC_chart(data.frame(name = c("A", "B", "B2", "B3", "C"), start = c(1, 120, 300, 320, 400),
                    end = c(125, 400, 380, 350, 600)),
         height = "150px") %>%
  GC_cluster(prevent_gene_overlap = "nested") %>%
  GC_genes(style_by = "geneTrack",
           groupStyle = list("2" = list(markerHeight = 8, arrowheadHeight = 8))) %>%
  GC_labels("name", style_by = "geneTrack", groupStyle = list("2" = list(fontSize = "8px")))

## fixture: beh-blast-tooltips
GC_chart(data.frame(protein_id = c("A1", "A2", "B1", "B2"), cluster = c("A", "A", "B", "B"),
                    start = c(1, 200, 1, 200), end = c(150, 350, 150, 350),
                    BlastP = c("A1", "No Hit", "A1", "No Hit"),
                    identity = c(100, 100, 55.4, NA), similarity = c(100, 100, 68.2, NA)),
         cluster = "cluster", group = "BlastP", width = "600px", height = "300px") %>%
  GC_links(group = "BlastP")

## fixture: beh-tooltip-escape
GC_chart(data.frame(start = c(1, 200), end = c(150, 350),
                    product = c("<img src=x onerror=\"window.hacked = true\">", "A & B <i>")),
         width = "600px", height = "200px") %>%
  GC_tooltip(formatter = "<b>Product:</b> {product}")

# The widget (test/behaviour/widget.cjs)

## fixture: beh-render-events
GC_chart(beh_link_genes, cluster = "cluster", group = "name", width = "600px", height = "400px") %>%
  GC_title("Render completion") %>% GC_labels("name") %>% GC_links("name") %>%
  GC_events(rendered = TRUE)

## fixture: beh-render-ids
GC_chart(data.frame(start = c(1, 50), end = c(40, 90)), height = "200px") %>%
  GC_events(click = FALSE, rendered = TRUE)

## fixture: beh-png
GC_chart(ophA_clusters, cluster = "cluster", group = "class", width = "600px", height = "300px") %>%
  GC_title("PNG export") %>% GC_theme("bw") %>% GC_labels("name")

## fixture: beh-sizing
GC_chart(ophA_clusters, cluster = "cluster", group = "class", width = "600px", height = "400px") %>%
  GC_title("Sizing regression") %>% GC_labels("name") %>% GC_events(highlight = TRUE)
