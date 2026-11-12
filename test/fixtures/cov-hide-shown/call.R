gene_cluster <- data.frame(
  name = c("ophB1", "ophC", "ophA", "ophD", "ophB2", "ophP", "ophE"),
  start = c(2522, 5286, 9536, 12616, 13183, 19346, 20170),
  end = c(4276, 4718, 10904, 11859, 15046, 16016, 21484),
  class = c("Monooxygenase", "NTF2-like", "Methyltransferase",
  "O-acyltransferase", "Monooxygenase", "Prolyloligopeptidase",
  "F-box/RNHI-like")
)
GC_chart(ophA_clusters, cluster = "cluster", height = "250px") %>%
  GC_labels("name") %>% GC_labels(show = FALSE, cluster = 2) %>%
  GC_coordinates() %>% GC_coordinates(show = FALSE, cluster = 1) %>%
  GC_clusterTitle("Title") %>% GC_clusterTitle(show = FALSE, cluster = 2)
