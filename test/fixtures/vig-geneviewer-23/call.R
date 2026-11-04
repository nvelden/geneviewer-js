library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(ophA_cluster, cluster = "cluster", group = "class", height = "100px") %>%
  GC_genes(
    y = 55,
    marker = "arrow", 
    markerHeight = 10,
    arrowheadHeight = 15,
    arrowheadWidth = 15
    ) %>%
  GC_clusterLabel("customized arrows") %>%
  GC_legend(FALSE)
