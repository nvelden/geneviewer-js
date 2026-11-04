library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "280px") %>%
   GC_normalize(
     group = "name", 
     cluster = 1, # By default all clusters are normalized
     gap = 0.01, # 0-1
     custom_gaps = list(ophC = 5, ophB2 = 5),
     preserve_gene_length = FALSE
     ) %>%
  GC_labels(label = "name") %>%
  # Update tooltip
  GC_tooltip(
    cluster = 1,
    formatter = "<b>Start:</b> {original_start}<br><b>End:</b> {original_end}"
  ) %>%
  GC_legend(FALSE)
