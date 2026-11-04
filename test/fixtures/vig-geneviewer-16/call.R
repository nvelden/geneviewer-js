library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_grid(direction = "row", margin = list(left = 15, right = 15)) %>%
  GC_clusterTitle(c("<i>Omphalotus Olearius</i>", "<i>Dendrothele Bisporus</i>")) %>%
  GC_legend(position = "top") %>%
  GC_grid(
    cluster = c(1,2), 
    width = "50%",
    height = "50%"
  )
