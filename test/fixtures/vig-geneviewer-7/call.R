library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
GC_chart(ophA_cluster, group = "class", height = "180px") %>%
  GC_labels("name") %>%
  GC_events(select = TRUE, drag = TRUE) %>%
  GC_toolbar(show = "always",
             position = "topleft",
             size = 16,
             color = "#9e9e9e",
             hoverColor = "#1f77b4",
             tooltipBackground = "#1f77b4",
             icons = list(undo = "arrow-left", redo = "arrow-right",
                          reset = "arrows-to-circle", save = "camera"))
