library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(
  subset(coronavirus_genomes, cluster == "SARS-CoV-2"),
  group = "category",
  cluster = "cluster",
  height = "230px"
  ) %>%
  GC_cluster(prevent_gene_overlap = "nested") %>%
  GC_genes(style_by = "geneTrack", groupStyle = list("2" = nested, "3" = nested)) %>%
  GC_labels("gene") %>%
  GC_zoom(range = c(0.83, 1))
