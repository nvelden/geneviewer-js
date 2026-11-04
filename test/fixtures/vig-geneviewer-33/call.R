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
chart %>% 
  GC_links(
    "name", 
    value1 = c("ophB1", "ophC"), 
    value2 = c("dbophB1", "dbophC"),
    cluster = c(1,2)
    ) %>% 
  GC_labels("name")
