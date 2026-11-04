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
