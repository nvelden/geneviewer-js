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
GC_chart(transcript_data, height = "200px") %>%
  GC_transcript(
    styleIntrons = 
      list(
      strokeWidth = 2,
      markerHeight = 60
      # Any other CSS style
      ),
    styleExons = 
      list(
        markerSize = "small",
        fill = "none",
        strokeWidth = 2,
        stroke = "red"
        # Any other CSS style
      ),
    styleUTRs = list(
      marker = "boxarrow",
      markerSize = "small",
      fill = "green"
      # Any other CSS style
    ),
    labelOptions = list(
      show = TRUE,
      xOffset = 0,
      yOffset = 0,
      fontSize = "10px",
      fontWeight = "bold"
      # Any other CSS style
    )
  )
