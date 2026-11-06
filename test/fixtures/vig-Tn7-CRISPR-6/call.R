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
white <- list(fill = "white")
label_styles <- list(
  tnsA = white, cas8f = white, cas6f = white, cas5 = white,
  "SRP-RNA" = list(y = 55, dy = "0px", textAnchor = "end", x = -4)
)
chart <- chart %>%
  GC_labels(label = "label", fontSize = "9px", y = 50, dy = "14.5px",
            adjustLabels = FALSE, style_by = "label", groupStyle = label_styles)
elements <- distinct(genes, cluster, strain_short)
gene_names <- c("tnsA", "tnsB", "tnsC", "tniQ / tnsD", "tnsE", "cas8f / cas5f",
                "cas7f", "cas6f", "cas5")
legend_styles <- lapply(setNames(nm = gene_names),
                        function(x) list(fontStyle = "italic"))
chart <- chart %>%
  GC_clusterLabel(
    title = elements$cluster,
    subtitle = elements$strain_short,
    width = "190px",
    fontSize = "12px",
    subtitleFont = list(fontSize = "10px", fontStyle = "italic"),
    align = "right",
    x = -10
  ) %>%
  GC_title(
    "Tn7-like transposons that carry a minimal CRISPR-Cas system",
    subtitle = paste("Redrawn from Fig. 3 of Peters et al. (2017),",
                     "Proc Natl Acad Sci USA 114:E7358-E7366"),
    height = "70px",
    titleFont = list(fontSize = "19px", fontWeight = "bold"),
    subtitleFont = list(fontSize = "14px", fontStyle = "italic")
  ) %>%
  GC_tooltip(formatter = "<b>{gene}</b> {product}<br>{start} - {end}") %>%
  GC_legend(legendTextOptions = list(fontSize = "12px"),
            groupStyle = legend_styles) %>%
  GC_theme("publication")
chart
