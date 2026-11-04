genes_data <- data.frame(
  start = c(10, 90, 130, 170, 210),
  end = c(40, 120, 160, 200, 240),
  name = c('Gene 1', 'Gene 3', 'Gene 4', 'Gene 5', 'Gene 6'),
  group = c('A', 'B', 'B', 'A', 'C'),
  cluster = c('A', 'A', 'A', 'B', 'B')
)
GC_chart(genes_data, cluster = "cluster", group = "group", height = "200px") %>%
  GC_legend(
    position = "top", #bottom
    orientation = "horizontal", #vertical
    align = "center", #left / right
    x = 0,
    y = 0,
    adjustHeight = TRUE,
    backgroundColor = "#0000",
    order = list(),
    style = list(
      backgroundColor = "#0000"
      # Any other CSS styles
    ),
    legendOptions = list(
      cursor = "pointer",
      colorScheme = NULL,
      customColors = NULL # c("red", "green", "orange")
      # Additional styles
    ),
    legendTextOptions = list(
      cursor = "pointer",
      textAnchor = "start",
      dy = ".35em",
      fontSize = "12px",
      fontFamily = "sans-serif",
      fill = "black"
      # Additional styles
    )
  )
