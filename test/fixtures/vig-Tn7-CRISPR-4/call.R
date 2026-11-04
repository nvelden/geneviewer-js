library(knitr)
library(geneviewer)
library(dplyr)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
kable(head(tn7_crispr_elements[, c("cluster", "strain", "gene", "label", "product",
                                   "category", "start", "end", "strand")], 8))
genes <- tn7_crispr_elements %>%
  mutate(end = ifelse(gene == "R", end + 100, end),
         start = ifelse(gene == "L", start - 100, start))
colors <- list(
  "insertion site" = "#F3C79B",
  "tnsA" = "#D62728",
  "tnsB" = "#AEB6F0",
  "tnsC" = "#D7F2F2",
  "tniQ / tnsD" = "#2CA02C",
  "tnsE" = "#C7E02C",
  "cas8f / cas5f" = "#8C1515",
  "cas7f" = "#F2A5C4",
  "cas6f" = "#7B3FD4",
  "cas5" = "#B5651D",
  "cas, other" = "#C9A0DC",
  "CRISPR array" = "#555555",
  "right end" = "#9FD4DE",
  "left end" = "#F28E2B",
  "other" = "#E8E8E8"
)
chart <- GC_chart(genes, cluster = "cluster", group = "category",
                  strand = "strand", height = "900px") %>%
  GC_color(customColors = colors) %>%
  GC_scale(axis_type = "range", hidden = TRUE) %>%
  GC_legend(position = "bottom", align = "center", order = names(colors))
chart <- chart %>%
  GC_scale(axis_type = "range", hidden = TRUE, scale_breaks = TRUE,
           scale_break_padding = "500bp")
chart <- chart %>%
  GC_align(id_column = "gene", id = "R", align = "left")
end_bar <- list(marker = "box", markerHeight = 38, arrowheadHeight = 38)
gene_box <- list(marker = "box", markerHeight = 20, arrowheadHeight = 20)
shapes <- list(
  R = end_bar,
  L = end_bar,
  CRISPR = c(gene_box, stroke = "black", strokeWidth = 1),
  "tnsA (fused)" = gene_box
)
chart <- chart %>%
  GC_genes(marker_size = "small", markerHeight = 20,
           style_by = "gene", groupStyle = shapes) %>%
  GC_pattern(patterns = list("right end" = "diagonal", "left end" = "diagonal"),
             background = NULL, size = 4)
chart
