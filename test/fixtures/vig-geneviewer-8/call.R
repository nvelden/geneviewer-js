library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "350px") %>%
  GC_title(title = "ophA Gene Clusters") %>%
  GC_labels(label = "name", cluster = "ophA", y = 18) %>%
  GC_labels(label = "name", cluster = 2)
