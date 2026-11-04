library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "300px") %>%
  GC_labels("name") %>%
  GC_coordinates() %>%
  GC_clusterLabel(title = c("O. olearius", "D. bispora"), subtitle = "ophA") %>%
  GC_element_style("genes", row_id = 3, fill = "red", markerHeight = 30) %>%
  GC_element_style("labels", row_id = 3, text = "ophMA", fontWeight = "bold") %>%
  GC_element_style("coordinates", row_id = 1, end = "start", show = FALSE) %>%
  GC_element_style("clusterLabel", cluster = 2, part = "subtitle",
                   text = "dbophA", fill = "grey")
