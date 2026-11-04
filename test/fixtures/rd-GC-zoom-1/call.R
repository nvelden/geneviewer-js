GC_chart(ophA_clusters, cluster = "cluster", group = "class",
         height = "300px") %>%
  GC_labels("name") %>%
  GC_zoom(range = c(0.2, 0.6))
