genes_data <- data.frame(
  start = c(10, 90, 130, 170, 240, 250, 300, 340, 380, 420),
  end = c(40, 120, 160, 200, 210, 270, 330, 370, 410, 450),
  name = c('Gene 1', 'Gene 2', 'Gene 3', 'Gene 4', 'Gene 5',
           'Gene 6', 'Gene 7', 'Gene 8', 'Gene 9', 'Gene 10'),
  group = c('A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'D'),
  identity = c(NA, NA, NA, 50, 40, 100, 60, 65, 20, NA),
  similarity = c(NA, NA, NA, 40, 30, 90, 50, 55, 10, NA),
  cluster = c(1, 1, 1, 2, 2, 2, 3, 3, 3, 3)
)
GC_chart(genes_data, cluster = "cluster", group = "group",
         height = "220px") %>%
  GC_links(group = "group", measure = "identity", label = FALSE,
           colorBarOptions = list(position = "legend")) %>%
  GC_legend(position = "top")
