library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(
  subset(human_hox_genes, cluster %in% c("HOXA", "HOXB")),
  group = "name",
  cluster = "cluster",
  height = "390px" 
  ) %>% 
  GC_labels(label = "name", adjustLabels = FALSE) %>%
  GC_labels(label = "name", 
            cluster = 2, 
            itemStyle = list(list(index = 5, x=10))
            ) %>%
  GC_cluster(prevent_gene_overlap = TRUE, overlap_spacing = 30) %>%
  GC_legend(FALSE)
