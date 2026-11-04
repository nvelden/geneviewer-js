library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "350px") %>%
  GC_labels("name") %>%
  GC_clusterLabel(title = c("O. olearius", "D. bispora")) %>%
  GC_scaleBar() %>%
  GC_element_style("labels", row_id = 3, moveY = -12) %>%
  GC_element_style("clusterLabel", cluster = 2, part = "title", moveX = 10) %>%
  GC_element_style("scaleBar", cluster = 1, moveX = -40) %>%
  GC_element_style("legend", group = "Methyltransferase", part = "marker", moveY = 4) %>%
  GC_events(select = TRUE, drag = TRUE)
