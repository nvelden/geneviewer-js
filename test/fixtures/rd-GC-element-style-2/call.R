genes <- data.frame(start = c(90, 10), end = c(130, 50), name = c("a", "a"))
GC_chart(data.frame(start = 10, end = 40, family = "A"), group = "family") %>%
  GC_element_style("legend", group = "A", part = "label", text = "Family A") %>%
  GC_element_style("legend", group = "A", part = "marker", fill = "red")
