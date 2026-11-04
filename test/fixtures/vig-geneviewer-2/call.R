library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(ophA_clusters, 
         start = "start", 
         end = "end", 
         group = "class", 
         cluster = "cluster", 
         height = "300px"
         )
