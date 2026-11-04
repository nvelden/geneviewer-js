genes_data <- data.frame(
  start = c(10, 90, 130, 170, 210),
  end = c(40, 120, 160, 200, 240),
  name = c('Gene 1', 'Gene 3', 'Gene 4', 'Gene 5', 'Gene 6'),
  group = c('A', 'B', 'B', 'A', 'C'),
  cluster = c(1, 1, 2, 2, 2)
)
GC_chart(genes_data, cluster = "cluster", group = "group", height = "200px") %>%
GC_labels(
 label = "group",
 show = TRUE,
 x = 0,
 y = 50,
 dy = "-1.2em",
 dx = "0em",
 rotate = 0,
 adjustLabels = TRUE, # Rotate labels to prevent overlap; "hide" hides them
 fontSize = "12px",
 fontStyle = "italic",
 fill = "black",
 fontFamily = "sans-serif",
 textAnchor = "middle",
 cursor = "default",
)
