library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "300px") %>%
  GC_title(title = "ophA Gene Clusters", height = "30px") %>%
  GC_labels(label = "name", 
            cluster = "ophA", 
            itemStyle = 
              list(
                list(index = 2, fill = "red", fontWeight = "bold")
                )
            ) %>%
  GC_labels(
    label = "name", 
    cluster = 2,
    itemStyle = 
              list(
                list(index = 4, fill = "red", fontWeight = "bold"),
                list(index = 3, y = 10, x = -5)
                )
    )
