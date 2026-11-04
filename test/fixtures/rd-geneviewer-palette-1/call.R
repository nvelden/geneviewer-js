geneviewer_palette("okabeIto")
geneviewer_palette()
genes_data <- data.frame(
  start = c(10, 90, 130, 170, 210),
  end = c(40, 120, 160, 200, 240),
  group = c('A', 'B', 'B', 'A', 'C')
)
GC_chart(genes_data, group = "group", height = "100px") %>%
  GC_genes(colorScheme = "okabeIto")
