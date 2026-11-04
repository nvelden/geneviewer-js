genes_data <- data.frame(
  start = c(10, 90, 130, 170, 210),
  end = c(40, 120, 160, 200, 240),
  name = c('Gene 1', 'Gene 3', 'Gene 4', 'Gene 5', 'Gene 6'),
  group = c('A', 'B', 'B', 'A', 'C'),
  cluster = c(1, 1, 2, 2, 2)
)
GC_chart(genes_data, cluster ="cluster", group = "group", height = "200px") %>%
  GC_clusterLabel(
    title = c("Cluster 1", "Cluster 2"),
    width = "100px",
    x = 0,
    y = 0,
    position = "left",
    align = "left", # center / right
    wrapLabel = TRUE,
    wrapOptions = list(
      dyAdjust = 0,
      lineHeightEms = 1.05,
      lineHeightSquishFactor =  1,
      splitOnHyphen =  TRUE,
      centreVertically = TRUE
     ),
    fontSize = "12px",
    fontStyle = "normal",
    fontWeight = "bold",
    fontFamily = "sans-serif",
    cursor = "default"
  )
