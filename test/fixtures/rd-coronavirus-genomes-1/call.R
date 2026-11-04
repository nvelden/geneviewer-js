GC_chart(coronavirus_genomes, cluster = "cluster", group = "category",
         height = "700px") %>%
  GC_labels("gene") %>%
  GC_clusterLabel() %>%
  GC_zoom(range = c(0.75, 1))
