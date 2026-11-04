genes_data <- data.frame(
  start = c(1, 10, 200, 220, 600),
  end = c(10, 150, 180, 400, 400),
  name = c('Gene 1', 'Gene 2', 'Gene 3', 'Gene 4', 'Gene 5'),
  group = c('A', 'A', 'A', 'A', 'A')
)
nested_genes <- data.frame(
  start = c(1, 120, 300, 340), end = c(125, 400, 380, 600),
  name = c("A", "B", "B2", "C")
)
GC_chart(nested_genes, height = "150px") %>%
  GC_cluster(prevent_gene_overlap = "nested") %>%
  GC_genes(style_by = "geneTrack",
           groupStyle = list("2" = list(markerHeight = 8, arrowheadHeight = 8))) %>%
  GC_labels("name")
