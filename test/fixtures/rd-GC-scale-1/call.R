genes_data <- data.frame(
  start = c(100, 1000, 2000),
  end = c(150, 1500, 2500),
  name = c('Gene 4', 'Gene 5', 'Gene 6'),
  group = c('B', 'A', 'C'),
  cluster = c(2, 2, 2)
)
GC_chart(genes_data, cluster = "cluster", group = "group", height = "200px") %>%
  GC_scale(
    start = 1,
    end = 2600,
    padding = 2,
    hidden = FALSE,
    reverse = FALSE,
    axis_position = "bottom",
    # breaks = list(
    #  list(start = 160, end = 900),
    #  list(start = 1600, end = 1900)
    # ),
    # tickValues = c(1, 2600),
    scale_breaks = TRUE,
    scale_break_threshold = 20,
    scale_break_padding = 1,
    ticksCount = 10,
    ticksFormat = ",.0f",
    y = NULL,
    tickStyle =
      list(
        stroke = "grey",
        strokeWidth = 1,
        lineLength = 6
        # Any other CSS styles
      ),
    textStyle =
      list(
        fill = "black",
        fontSize = "10px",
        fontFamily = "Arial",
        cursor = "default"
        # Any other CSS styles
      ),
    lineStyle = list(
      stroke = "grey",
      strokeWidth = 1
      # Any other CSS styles
    )
  ) %>%
  GC_legend(FALSE)
