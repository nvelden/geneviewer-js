library(geneviewer)
library(dplyr)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
lacZ_operon <- data.frame(
  start = c(361249, 361926, 363231, 366428), 
  end = c(361860, 363179, 366305, 367510), 
  Gene_symbol = c("lacA", "lacY", "lacZ", "lacI"), 
  Strand = c("minus", "minus", "minus", "minus"), 
  NCBI_Gene_ID = as.character(c(945674, 949083, 945006, 945007)), 
  Description = c("galactoside O-acetyltransferase", 
                  "lactose permease", "beta-galactosidase", 
                  "DNA-binding transcriptional repressor LacI")
)
lacZ_operon <- data.frame(
  start = c(361249, 361926, 363231, 366428), 
  end = c(361860, 363179, 366305, 367510), 
  Gene_symbol = c("lacA", "lacY", "lacZ", "lacI"), 
  Strand = c("minus", "minus", "minus", "minus"), 
  NCBI_Gene_ID = as.character(c(945674, 949083, 945006, 945007)), 
  Description = c("galactoside O-acetyltransferase", 
                  "lactose permease", "beta-galactosidase", 
                  "DNA-binding transcriptional repressor LacI")
)
blastp <- erythromycin_BlastP
blastp$Functions[is.na(blastp$Functions)] <- "No Hit"
library(dplyr)
blastp <- erythromycin_BlastP %>% dplyr::filter(cluster %in% c("BGC0000055", "BGC0000054"))
blastp$Functions[is.na(blastp$Functions)] <- "No Hit"
plasmids <- dplyr::distinct(pQEB1_plasmids, cluster, host)
colors <- list(
  "Carbapenemase (KPC)" = "#d62728",
  "Other resistance" = "#ff7f0e",
  "Arsenic resistance" = "#8c564b",
  "Mobile element" = "#9467bd",
  "Conjugation" = "#1f77b4",
  "Replication & maintenance" = "#2ca02c",
  "Hypothetical" = "#d9d9d9",
  "Other" = "#9e9e9e"
)
genes <- tn7_crispr_elements %>%
  dplyr::mutate(end = ifelse(gene == "R", end + 100, end),
                start = ifelse(gene == "L", start - 100, start))
elements <- dplyr::distinct(genes, cluster, strain_short)
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
gene_names <- c("tnsA", "tnsB", "tnsC", "tniQ / tnsD", "tnsE", "cas8f / cas5f",
                "cas7f", "cas6f", "cas5")
legend_styles <- lapply(stats::setNames(nm = gene_names),
                        function(x) list(fontStyle = "italic"))
white <- list(fill = "white")
label_styles <- list(
  tnsA = white, cas8f = white, cas6f = white, cas5 = white,
  "SRP-RNA" = list(y = 55, dy = "0px", textAnchor = "end", x = -4)
)
end_bar <- list(marker = "box", markerHeight = 38, arrowheadHeight = 38)
gene_box <- list(marker = "box", markerHeight = 20, arrowheadHeight = 20)
shapes <- list(
  R = end_bar,
  L = end_bar,
  CRISPR = c(gene_box, stroke = "black", strokeWidth = 1),
  "tnsA (fused)" = gene_box
)
chart <- GC_chart(genes, cluster = "cluster", group = "category",
                  strand = "strand", height = "900px") %>%
  # tall arrows, with the labels inside them
  GC_genes(marker_size = "small", markerHeight = 20,
           style_by = "gene", groupStyle = shapes) %>%
  GC_labels(label = "label", fontSize = "9px", y = 50, dy = "14.5px",
            adjustLabels = FALSE, style_by = "label", groupStyle = label_styles) %>%
  # most elements run on far beyond the genes shown, up to ~100 kb: scale breaks
  # (//) leave out such long stretches, as in the published figure
  GC_scale(axis_type = "range", hidden = TRUE, scale_breaks = TRUE,
           scale_break_padding = "500bp") %>%
  # line the elements up on their right end, as in the published figure
  GC_align("gene", "R", align = "left") %>%
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
  GC_color(customColors = colors) %>%
  # the two ends share a pattern and are told apart by their colour
  GC_pattern(patterns = list("right end" = "diagonal", "left end" = "diagonal"),
             background = NULL, size = 4) %>%
  GC_legend(position = "bottom", align = "center", order = names(colors),
            legendTextOptions = list(fontSize = "12px"),
            groupStyle = legend_styles) %>%
  GC_theme("publication")
chart
