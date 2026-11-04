cox1 <- with(subset(mitochondrial_gene_order, gene == "COX1"),
             setNames(start, cluster))
genes <- within(mitochondrial_gene_order, {
  plot_start <- (start - cox1[cluster]) %% genome_length + 1
  plot_end <- plot_start + end - start
})
GC_chart(genes, start = "plot_start", end = "plot_end", cluster = "cluster",
         group = "block", strand = "strand") %>%
  GC_labels("gene") %>%
  GC_clusterLabel()
