library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(
  ophA_clusters,
  group = "class",
  cluster = "cluster",
  height = "300px" 
  ) %>%
  GC_title("Adjust margins of GC clusters", align = "left") %>%
  GC_cluster(margin = list(left = 25, right = 25)) %>%
  GC_cluster(cluster = 1, style = list(backgroundColor = "green")) %>%
  GC_cluster(cluster = 2, style = list(backgroundColor = "red"))
