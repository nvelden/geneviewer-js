gene_cluster <- data.frame(
  name = c("ophB1", "ophC", "ophA", "ophD", "ophB2", "ophP", "ophE"),
  start = c(2522, 5286, 9536, 12616, 13183, 19346, 20170),
  end = c(4276, 4718, 10904, 11859, 15046, 16016, 21484),
  class = c("Monooxygenase", "NTF2-like", "Methyltransferase",
  "O-acyltransferase", "Monooxygenase", "Prolyloligopeptidase",
  "F-box/RNHI-like")
)
GC_chart(ophA_clusters, group = "class", cluster = "cluster", height = "250px") %>%
  GC_events(drag = TRUE) %>%
  GC_toolbar(show = "always", buttons = c("undo", "redo", "save"),
             fontFamily = "serif", tooltipColor = "#333333",
             tooltipBorder = "1px solid #b7b9be", tooltipRadius = "4px",
             tooltipShadow = "1px 2px 10px rgba(0, 0, 0, 0.2)")
