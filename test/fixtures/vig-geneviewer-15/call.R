library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
GC_chart(ophA_clusters, group = "class", cluster = "cluster",
         style = list(backgroundColor = "red"),
         height = "300px"
         ) %>%
  GC_title(
    "Adjusting Margins of a GC_chart", 
    align = "left", 
    y = 15, 
    style = list(backgroundColor = "yellow", 
                 align = "left")
    ) %>%
  GC_cluster(style = list(backgroundColor = "green")) %>%
  GC_legend(TRUE, style = list(backgroundColor = "yellow")) %>%
  GC_grid(margin = list(top = 50, bottom = 50, left = 25, right = 25))
