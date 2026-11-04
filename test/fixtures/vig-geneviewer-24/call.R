library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(ophA_cluster, cluster = "cluster", group = "class", height = "100px") %>%
  GC_genes(
    groupStyle = list(
      Methyltransferase = list(stroke = "black", strokeWidth = 2),
      Prolyloligopeptidase = list(markerHeight = 8, arrowheadHeight = 8)
    )
  ) %>%
  GC_legend(FALSE)
