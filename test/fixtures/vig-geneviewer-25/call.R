library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "150px") %>%
   GC_align(
     id_column = "class", 
     id = "NTF2-like",
     align = "left" # center / right
     ) %>%
   GC_legend(TRUE)
