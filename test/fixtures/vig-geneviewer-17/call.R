library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(ophA_cluster, cluster = "cluster", group = "class", height = "150px") %>%
  GC_genes(
    show = TRUE,
    stroke = "grey",
    strokeWidth = 2
    # Any other CSS style
  ) %>%
   GC_color(colorScheme = "schemeAccent") %>%
   GC_legend()
