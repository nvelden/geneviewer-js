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
GC_chart(ophA_clusters, cluster = "cluster", group = "class", height = "400px") %>%
  GC_links("class", label = FALSE) %>%
  GC_trackMouse() %>%
  GC_events(click = TRUE, highlight = TRUE, select = TRUE)
