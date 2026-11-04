genes_data <- data.frame(
  start = c(10, 90, 130, 170, 210),
  end = c(40, 120, 160, 200, 240),
  name = c('Gene 1', 'Gene 3', 'Gene 4', 'Gene 5', 'Gene 6'),
  group = c('A', 'B', 'B', 'A', 'C'),
  cluster = c(1, 1, 2, 2, 2)
)
GC_chart(genes_data, cluster = "cluster", group = "group", height = "200px") %>%
GC_labels(label = "group") %>%
GC_labels(
  cluster = 1,
  itemStyle = list(
    list(index = 0, fill = "red", fontSize = "14px", fontWeight = "bold")
  )
)
