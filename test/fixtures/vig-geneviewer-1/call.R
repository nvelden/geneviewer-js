library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(ophA_cluster, 
         start = "start", 
         end = "end", 
         group = "class", 
         height = "150px"
         )
