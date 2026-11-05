gene_cluster <- data.frame(
  name = c("ophB1", "ophC", "ophA", "ophD", "ophB2", "ophP", "ophE"),
  start = c(2522, 5286, 9536, 12616, 13183, 19346, 20170),
  end = c(4276, 4718, 10904, 11859, 15046, 16016, 21484),
  class = c("Monooxygenase", "NTF2-like", "Methyltransferase",
  "O-acyltransferase", "Monooxygenase", "Prolyloligopeptidase",
  "F-box/RNHI-like")
)
GC_chart(data.frame(start = c(1000, 1500, 200, 600), end = c(1400, 1900, 500, 900),
                    name = c("a", "b", "c", "d"), cluster = c(1, 1, 2, 2)),
         cluster = "cluster", group = "name", height = "250px") %>%
  GC_annotation(cluster = 1, type = "rectangle",
                position = list(list(c(1100, 60), c(1300, 40)))) %>%
  GC_scale(axis_type = "range") %>%
  GC_annotation(cluster = 1, type = "text", text = "x", x = 1450) %>%
  GC_annotation(cluster = 2, type = "rectangle",
                position = list(list(c(250, 60), c(450, 40)), list(c(650, 60), c(850, 40))))
