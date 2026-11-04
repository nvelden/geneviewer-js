library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(ophA_cluster, cluster = "cluster", group = "class", height = "100px") %>%
  GC_genes(marker = "box", marker_size = "small") %>%
  GC_clusterLabel("box") %>% 
  GC_legend(FALSE)
