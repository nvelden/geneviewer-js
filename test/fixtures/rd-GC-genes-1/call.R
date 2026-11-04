genes_data <- data.frame(
  start = c(10, 90, 130, 170, 210),
  end = c(40, 120, 160, 200, 240),
  name = c('Gene 1', 'Gene 3', 'Gene 4', 'Gene 5', 'Gene 6'),
  group = c('A', 'B', 'B', 'A', 'C'),
  cluster = c(1, 1, 2, 2, 2)
)
GC_chart(genes_data, cluster = "cluster", group = "group", height = "200px") %>%
  GC_genes(
    group = "group",
    show = TRUE,
    marker = "arrow",
    marker_size = "medium",
    colorScheme = NULL, # One of D3.js build in colorSchemes
                        # (eg. "schemeCategory10",
                        # "schemeAccent", "schemeTableau10")
    customColors = NULL, # A vector of color names
    prevent_overlap = FALSE,
    gene_overlap_spacing = 40,
    cluster = 1, # Specify a specific cluster
    x = 1,
    y = 50,
    stroke = "black",
    strokeWidth = 1,
    arrowheadWidth = NULL,
    arrowheadHeight = NULL,
    arrowHeight = NULL,
    markerHeight = NULL # overwrites marker_size
   )
