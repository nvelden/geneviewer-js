genes_data <- data.frame(
  start = c(10, 90, 130, 10, 90, 130),
  end = c(40, 120, 160, 40, 120, 160),
  name = c('Gene 1', 'Gene 2', 'Gene 3','Gene 1', 'Gene 2', 'Gene 3'),
  group = c('A', 'B', 'C', 'A', 'B', 'C'),
  cluster =  c(1, 1, 1, 2, 2, 2)
)
GC_chart(genes_data, group = "group", cluster = "cluster", height = "150px") %>%
  GC_normalize(
    cluster = 2,
    preserve_gene_length = TRUE,
    gap = NULL
 )
