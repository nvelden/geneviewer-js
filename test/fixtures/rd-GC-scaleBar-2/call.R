genes_data <- data.frame(
 start = c(1000, 9000, 13000, 17000, 21000),
 end = c(4000, 12000, 16000, 20000, 24000),
 name = c('Gene 1', 'Gene 3', 'Gene 4', 'Gene 5', 'Gene 6'),
 group = c('A', 'B', 'B', 'A', 'C'),
 cluster = c(1, 1, 2, 2, 2)
)
GC_chart(genes_data, cluster ="cluster", group = "group", height = "400px") %>%
  GC_scaleBar(
    title = "1kb",
    scaleBarUnit = 1000,
    cluster = NULL,
    x = 0,
    y = 50,
    labelStyle = list(
      labelPosition =  "left",
      fontSize = "10px",
      fontFamily = "sans-serif",
      fill = "red", # Text color
      cursor = "default"
      # Any other CSS style for the label
    ),
    textPadding = -2,
    scaleBarLineStyle = list(
      stroke = "black",
      strokeWidth = 1
      # Any other CSS style for the line
    ),
    scaleBarTickStyle = list(
      stroke = "black",
      strokeWidth = 1
      # Any other CSS style for the tick
    )
  )
