library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "150px") %>%
   GC_normalize(
     group = "class", 
     cluster = 1, # By default all clusters are normalized
     gap = NULL, # 0-1
     preserve_gene_length = TRUE
     ) %>%
  # Update tooltip
  GC_tooltip(
    cluster = 1,
    formatter = "<b>Start:</b> {original_start}<br><b>End:</b> {original_end}"
  ) %>%
  GC_legend(FALSE)
