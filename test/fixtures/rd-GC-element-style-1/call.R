genes <- data.frame(start = c(90, 10), end = c(130, 50), name = c("a", "a"))
GC_chart(genes) %>%
  GC_labels("name") %>%
  GC_clusterTitle("Cluster", subtitle = "Subtitle") %>%
  GC_element_style("genes", row_id = 1, fill = "red", marker = "box") %>%
  GC_element_style("labels", row_id = 1, text = "Edited", fontSize = "16px") %>%
  GC_element_style("clusterTitle", cluster = 1, part = "subtitle",
                   fontStyle = "italic", fill = "grey")
