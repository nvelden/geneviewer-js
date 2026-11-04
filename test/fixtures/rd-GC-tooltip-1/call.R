genes_data <- data.frame(
  start = c(10, 90, 130, 170, 210),
  end = c(40, 120, 160, 200, 240),
  name = c('Gene 1', 'Gene 2', 'Gene 3', 'Gene 4', 'Gene 5'),
  group = c('A', 'B', 'B', 'A', 'C')
)
GC_chart(genes_data, group = "group", height = "200px") %>%
GC_tooltip(formatter = " <b>Start:</b> {start}<br><b>end:</b> {end}")
