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
links_data <- data.frame(
  start1 = c(5000, 16000),
  end1 =  c(9000, 19000),
  start2 = c(20000, 42000),
  end2 = c(25000, 32000),
  cluster1 = c("ophA","ophA"),
  cluster2 = c("dbophA", "dbophA"),
  identity = c(20, 100),
  similarity = c(10, 90)
)
transcript_data <- data.frame(
  transcript = c("transcript1", "transcript1", "transcript1", "transcript1"),
  type = c("5_utr", "exon", "exon", "3_utr"),
  start = c(1, 101, 201, 301),
  end = c(50, 150, 250, 350),
  strand = rep("forward", 4)
)
generate_GC_color_patches <- function(color_scheme_name, color_scheme_length) {
  if (color_scheme_length <= 0) {
    stop("Color scheme length must be positive")
  }

  color_array <- data.frame(
    start = seq(1, (color_scheme_length - 1) * 10 + 1, by = 10),
    end = seq(10, color_scheme_length * 10, by = 10),
    group = 1:color_scheme_length
  )

  chart <- GC_chart(color_array, group = "group", height = "30px", width = 300) %>%
    GC_genes(colorScheme = color_scheme_name, marker = "box") %>%
    GC_legend(FALSE) %>%
    GC_tooltip(FALSE) %>%
    GC_sequence(show = FALSE)

  return(chart)
}
custom_colors <- c("#F8766D","#00BA38","#619CFF","#F564E3","#FFC61E","#00BFC4")
custom_colors <- c("#D62728", "#2CA02C", "#1F77B4", "#9467BD", "#FF7F0E", "#17BECF")
named_vector <- setNames(custom_colors, unique(ophA_cluster$class))
custom_colors <- as.list(named_vector)
custom_colors <- c("#D62728", "#D62728", "#D62728", "#D62728", "#D62728", "#D62728")
named_vector <- setNames(custom_colors, unique(ophA_cluster$class))
custom_colors <- as.list(named_vector)
all_patterns <- c(
  "diagonal", "dots", "horizontal", "crosshatch", "vertical", "zigzag",
  "checkerboard", "solid", "rings", "bricks", "inverseDots", "grid",
  "wideStripes", "plus", "antidiagonal", "none"
)
pattern_genes <- data.frame(
  start = rep(seq(0, by = 100, length.out = 8), 2),
  end = rep(seq(85, by = 100, length.out = 8), 2),
  pattern = all_patterns,
  row = rep(c("1", "2"), each = 8)
)
geneviewer_palette()
my_theme <- utils::modifyList(
  geneviewer_theme("classic"),
  list(textColor = "darkgreen", palette = "okabeIto")
)
GC_chart(ophA_cluster, group = "class", height = "100px") %>%
  GC_scale(
    padding = 2,
    hidden = FALSE,
    axisType = "bottom",
    y = NULL) %>%
   GC_legend(FALSE)
