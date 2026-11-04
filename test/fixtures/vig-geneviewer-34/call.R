library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
ophA_cluster <- subset(ophA_clusters, cluster == "ophA")
nested <- list(markerHeight = 8, arrowheadHeight = 8)
transcript_data <- data.frame(
  transcript = c("transcript1", "transcript1", "transcript1", "transcript1",
                 "transcript2", "transcript2", "transcript2"),
  type = c("5_utr", "exon", "exon", "3_utr",
           "5_utr", "exon", "3_utr"),
  start = c(1, 101, 201, 301,
            1, 101, 301),
  end = c(50, 150, 250, 350,
          50, 150, 350),
  strand = rep("forward", 7)
)
chart <- GC_chart(
  ophA_clusters, 
  cluster = "cluster", 
  group = "class", 
  height = "250px") %>%
  GC_legend(FALSE)
ophA_clusters$identity <- sample(1:100, size = nrow(ophA_clusters), replace = TRUE)
ophA_clusters$identity[ophA_clusters$cluster == "ophA"] <- NA
chart <- GC_chart(
  ophA_clusters, 
  cluster = "cluster", 
  group = "class", 
  height = "250px") %>%
  GC_links(
    "class", 
    value1 = c("Methyltransferase", "Prolyloligopeptidase"), 
    value2 = c("Methyltransferase", "Prolyloligopeptidase"),
    inverted_color = "green", 
    measure = "identity", # similarity / none
    label = TRUE,
    curve = FALSE,
    color_bar = TRUE,
    colorBarOptions = list(
       x = 0,
       y = 24,
       width = 10,
       height = 60,
       labelOptions = list(
         fontSize = 8,
         xOffset = 2,
         yOffset = 0
         # Any other CSS style
       ),
       titleOptions = list(
         fontSize = 10,
         xOffset = 2,
         yOffset = 0
         # Any other CSS style
       ),
       barOptions = list(
         stroke = "#000",
         strokeWidth = 0.5,
         opacity = 1
         # Any other CSS style
       )
     ),
    linkWidth = 0.5,
    linkStyle = list(
      stroke = "black",
      strokeWidth = 0.5
      # Any other CSS style
    ),
    labelStyle = list(
      fill = "red"
      # Any other CSS style
    )
    ) %>% 
  GC_legend(TRUE)
chart
