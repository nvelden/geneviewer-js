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
GC_chart(
  transcript_data, 
  start = "start",
  end = "end",
  height = "200px"
  ) %>%
  GC_transcript(
    transcript = "transcript",
    selection = 1,
    itemStyleExons = 
      list(
        list(index = 0, fill = "red")
      )
  ) %>%
  GC_transcript(
    transcript = "transcript",
    selection = 2,
    itemStyleIntrons = 
    list(
      list(index = 1, stroke = "red", strokeWidth = 2)
    )
  )
