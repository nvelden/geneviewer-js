genes_data <- data.frame(
  start = c(10, 50, 90),
  end = c(40, 80, 120),
  name = c("Gene 1", "Gene 2", "Gene 3")
)
GC_chart(genes_data, height = "150px") %>%
  GC_labels("name") %>%
  GC_events(select = TRUE, drag = TRUE) %>%
  GC_toolbar(show = "always", position = "topleft", size = 16,
             color = "#9e9e9e", hoverColor = "black",
             icons = list(reset = "arrows-to-circle", save = "camera"))
