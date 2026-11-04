genes_data <- data.frame(
  start = c(10, 90, 130, 170, 210),
  end = c(40, 120, 160, 200, 240),
  name = c('Gene 1', 'Gene 2', 'Gene 3', 'Gene 4', 'Gene 5'),
  group = c('A', 'B', 'C', 'C', 'A'),
  cluster =  c(1, 1, 1, 2, 2)
)
GC_chart(genes_data, group = "group", cluster = "cluster", height = "150px") %>%
  GC_align("group", "A", align = "left") %>%
  GC_legend(FALSE)
