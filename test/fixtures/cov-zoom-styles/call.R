gene_cluster <- data.frame(
  name = c("ophB1", "ophC", "ophA", "ophD", "ophB2", "ophP", "ophE"),
  start = c(2522, 5286, 9536, 12616, 13183, 19346, 20170),
  end = c(4276, 4718, 10904, 11859, 15046, 16016, 21484),
  class = c("Monooxygenase", "NTF2-like", "Methyltransferase",
  "O-acyltransferase", "Monooxygenase", "Prolyloligopeptidase",
  "F-box/RNHI-like")
)
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "300px") %>%
  GC_zoom(show = TRUE, range = c(0.1, 0.5), min = 0.05, overview = TRUE,
          color = "grey", style = list(backgroundColor = "#eeeeee"),
          windowStyle = list(border = "1px solid red"))
