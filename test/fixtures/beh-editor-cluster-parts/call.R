gene_cluster <- data.frame(
  name = c("ophB1", "ophC", "ophA", "ophD", "ophB2", "ophP", "ophE"),
  start = c(2522, 5286, 9536, 12616, 13183, 19346, 20170),
  end = c(4276, 4718, 10904, 11859, 15046, 16016, 21484),
  class = c("Monooxygenase", "NTF2-like", "Methyltransferase",
  "O-acyltransferase", "Monooxygenase", "Prolyloligopeptidase",
  "F-box/RNHI-like")
)
beh_two_genes <- data.frame(start = c(10, 60), end = c(40, 90), group = c("A", "B"))
beh_two_labels <- data.frame(start = c(10, 100), end = c(50, 140), name = c("Gene", "Other"))
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "500px") %>%
  GC_clusterTitle(title = c("Title A", "Title B"), subtitle = "Sub") %>%
  GC_clusterFooter(title = "Foot", subtitle = "Foot sub") %>%
  GC_clusterLabel(title = c("Label A", "Label B"), subtitle = "Species") %>%
  GC_coordinates() %>%
  GC_element_style("clusterTitle", cluster = 1, part = "subtitle", text = "Edited",
                   fill = "red", fontStyle = "italic") %>%
  GC_element_style("clusterFooter", cluster = "ophA", part = "title", text = "") %>%
  GC_element_style("clusterLabel", cluster = 2, part = "title", fontSize = "20px") %>%
  GC_element_style("clusterLabel", cluster = 2, part = "subtitle", fill = "blue") %>%
  GC_element_style("coordinates", row_id = 1, end = "start", fill = "red") %>%
  GC_element_style("coordinates", row_id = 2, show = FALSE) %>%
  GC_events(click = FALSE, select = TRUE)
