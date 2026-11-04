genes_data <- data.frame(
  start = c(10, 50, 90, 130, 170, 210),
  end = c(40, 80, 120, 160, 200, 240),
  name = c('Gene 1', 'Gene 2', 'Gene 3', 'Gene 4', 'Gene 5', 'Gene 6'),
  group = c('A', 'A', 'B', 'B', 'A', 'C'),
  cluster = c(1, 1, 1, 2, 2, 2)
)
GC_chart(genes_data, cluster = "cluster", group = "group", height = "220px") %>%
  GC_annotation(
    type = "textMarker",
    cluster = 1,
    position = 24,
    text = "Gene 1",
    arrowSize = 8
  ) %>%
  GC_annotation(
    type = "text",
    text = "feature 1",
    x = 91,
    y = 71
  ) %>%
  GC_annotation(
    type = "symbol",
    symbol = "triangle",
    x = 95,
    y = 64,
    size = 10,
    rotation = 180
  ) %>%
  GC_annotation(
    type = "terminator",
    x = 81
  ) %>%
  GC_annotation(
    type = "promoter",
    x = 49
  ) %>%
  # Convenience function to track mouse position on hoover
  GC_trackMouse()
