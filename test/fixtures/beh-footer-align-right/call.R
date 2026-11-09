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
beh_toolbar_chart <- GC_chart(data.frame(start = c(10, 60), end = c(40, 90), name = c("A", "B")),
                              height = "200px") %>%
  GC_labels("name") %>%
  GC_events(select = TRUE, drag = TRUE)
beh_placement_genes <- data.frame(
  cluster = rep(c("a", "b"), each = 6),
  start = rep(c(1, 400, 800, 830, 860, 890), 2),
  end = rep(c(380, 780, 828, 858, 888, 1000), 2),
  name = rep(c("first gene", "second gene", "x long name", "y long name",
               "z long name", "last long name"), 2),
  homolog = rep(paste0("h", 1:6), 2),
  identity = c(rep(NA, 6), 91.25, 64, 80, 55, 70, 99)
)
beh_placement_chart <- GC_chart(beh_placement_genes, cluster = "cluster",
                                height = "260px", width = "700px")
beh_turning_chart <- GC_chart(
  data.frame(start = c(1, 900, 930, 960, 985), end = c(880, 928, 958, 983, 1000),
             name = c("first gene", "alpha", "beta", "gamma", "last label here")),
  height = "300px", width = "700px")
beh_color_bar_chart <- function(colorBarOptions = list(), legend = TRUE, theme = "default") {
  chart <- GC_chart(
    data.frame(start = c(10, 90, 130, 170, 240, 250), end = c(40, 120, 160, 200, 210, 270),
               group = c("A", "B", "C", "A", "B", "C"), identity = c(NA, NA, NA, 50, 40, 100),
               cluster = c(1, 1, 1, 2, 2, 2)),
    cluster = "cluster", group = "group", height = "240px", width = "700px") %>%
    GC_links(group = "group", measure = "identity", label = FALSE,
             colorBarOptions = colorBarOptions) %>%
    GC_theme(theme)
  if (legend) GC_legend(chart, position = "top") else GC_legend(chart, FALSE)
}
beh_ab <- data.frame(start = c(10, 50), end = c(40, 80), group = c("A", "B"))
beh_abc <- data.frame(start = c(10, 50, 90), end = c(40, 80, 120), group = c("A", "B", "C"))
GC_chart(beh_ab, group = "group", width = "600px", height = "200px") %>%
  GC_clusterLabel("Cluster") %>%
  GC_clusterTitle(title = "Title", align = "right") %>%
  GC_clusterFooter(title = "Footer", align = "right")
