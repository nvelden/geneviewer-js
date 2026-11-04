library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "350px") %>%
  GC_title("ophA gene clusters", subtitle = "Drag me") %>%
  GC_labels("name") %>%
  GC_clusterLabel(title = c("O. olearius", "D. bispora")) %>%
  GC_scaleBar() %>%
  GC_events(select = TRUE, drag = TRUE)
