library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(
  ophA_clusters,
  group = "name",
  cluster = "cluster",
  height = "350px" 
  ) %>% 
  GC_labels() %>%
  GC_cluster(separate_strands = TRUE, strand_spacing = 3) %>%
  GC_legend(FALSE)
