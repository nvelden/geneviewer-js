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
GC_chart(data.frame(start = c(10, 30, 50), end = c(25, 45, 65),
                    name = c("long gene label alpha", "long gene label beta", "long gene label gamma")),
         width = "450px", height = "400px") %>%
  GC_labels("name", fontSize = "16px") %>%
  GC_element_style("labels", 1, fill = "red", moveX = 25, moveY = 10) %>%
  GC_events(click = FALSE, select = TRUE, drag = TRUE)
