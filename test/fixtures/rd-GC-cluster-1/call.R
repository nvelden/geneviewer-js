genes_data <- data.frame(
  start = c(1, 10, 200, 220, 600),
  end = c(10, 150, 180, 400, 400),
  name = c('Gene 1', 'Gene 2', 'Gene 3', 'Gene 4', 'Gene 5'),
  group = c('A', 'A', 'A', 'A', 'A')
)
GC_chart(genes_data, group = "group", height = "150px") %>%
  GC_cluster(separate_strands=TRUE, strand_spacing = 0) %>%
  GC_legend(FALSE)
