GC_chart(ophA_clusters, cluster = "cluster", group = "class",
         height = "300px") %>%
  GC_zoom(mode = "absolute", update = "release", height = 30,
          handleStyle = list(backgroundColor = "#d9d9d9"))
