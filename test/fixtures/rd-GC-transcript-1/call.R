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
    strand = "strand",
    type = "type",
    group = NULL,
    show = TRUE,
    selection = NULL,
    colorScheme = NULL,
    customColors = NULL,
    styleExons = list(
      show = TRUE,
      strokeWidth = 0,
      cursor = "default",
      marker = "box",
      markerSize = "medium",
      arrowheadWidth = NULL,
      arrowheadHeight = NULL,
      markerHeight = NULL,
      cornerRadius = NULL
      # Any other CSS style
    ),
    styleIntrons = list(
      show = TRUE,
      strokeWidth = 1,
      fill = "none",
      cursor = "default",
      marker = "intron",
      markerSize = "medium",
      arrowheadWidth = NULL,
      arrowheadHeight = NULL,
      markerHeight = NULL,
      cornerRadius = NULL
      # Any other CSS style
    ),
    styleUTRs = list(
      show = TRUE,
      fontSize = "10px",
      fontStyle = "normal",
      fontFamily = "sans-serif",
      cursor = "default",
      color = "black",
      fill = "#FFF",
      strokeWidth = 1,
      marker = "box",
      markerSize = "medium",
      arrowheadWidth = NULL,
      arrowheadHeight = NULL,
      markerHeight = NULL,
      cornerRadius = NULL
      # Any other CSS style
    ),
    labelOptions = list(
      show = TRUE,
      xOffset = 2,
      yOffset = 0,
      fontSize = "12px",
      fontStyle = "normal",
      fontWeight = "normal",
      fontFamily = "sans-serif",
      cursor = "default",
      color = "black"
    ),
    itemStyleExons = list(),
    itemStyleIntrons = list(),
    itemStyleUTRs = list()
  )
