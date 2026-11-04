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
