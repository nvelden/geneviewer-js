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
GC_chart(genes_data,
         cluster = "cluster",
         height = "200px"
) %>%
  GC_links(
    group = "group",
    data = NULL,
    curve = TRUE,
    measure = "identity",
    show_links = TRUE,
    label = TRUE,
    normal_color = "#1f77b4",
    inverted_color = "#d62728",
    use_group_colors = FALSE,
    color_bar = TRUE,
    colorBarOptions = list(
      x = 0,
      y = 24,
      width = 10,
      height = 60,
      labelOptions = list(
        fontSize = 8,
        xOffset = 2,
        yOffset = 0
        # Any other CSS style
      ),
      titleOptions = list(
        fontSize = 10,
        xOffset = 2,
        yOffset = 0
        # Any other CSS style
      ),
      barOptions = list(
        stroke = "#000",
        strokeWidth = 0.5,
        opacity = 1
        # Any other CSS style
      )
    ),
    linkWidth = 1,
    linkStyle = list(
      stroke = "black",
      strokeWidth = 0.5,
      fillOpacity = 0.4
      # Any other CSS style
    ),
    labelStyle = list(
      fontSize = "8px"
      # Any other CSS style
    )
  ) %>%
  GC_labels(label = "group", cluster = 1) %>%
  GC_clusterLabel()
