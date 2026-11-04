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
genomes <- distinct(coronavirus_genomes, cluster, genus, subgenus, host)
first_of_genus <- genomes[!duplicated(genomes$genus), ]
colors <- list(
  "5' UTR" = "#1A1A1A", ORF1a = "#4E79A7", ORF1b = "#A0CBE8", spike = "#E15759",
  "hemagglutinin-esterase" = "#F28E2B", envelope = "#EDC948",
  membrane = "#59A14F", nucleocapsid = "#2F4B7C", accessory = "#B07AA1",
  "3' UTR" = "#BDBDBD"
)
nested <- list(markerHeight = 13, arrowheadHeight = 13, fill = "#E8DCE6",
               stroke = "#B07AA1")
nested_label <- list(dy = "-1.6em", fontSize = "8px")
chart <- GC_chart(coronavirus_genomes, cluster = "cluster", group = "category",
                  height = "700px") %>%
  GC_color(customColors = colors) %>%
  # Every gene a box; ORFs that lie inside another gene, e.g. 9b inside N,
  # go on the tracks below. 3c and 3d of SARS-CoV-2 overlap by less than
  # half, so they share a track
  GC_cluster(prevent_gene_overlap = "nested", overlap_min = "50%",
             overlap_spacing = -4) %>%
  GC_genes(marker = "box", markerHeight = 18, arrowheadHeight = 18,
           style_by = "geneTrack",
           groupStyle = list("2" = nested, "3" = nested)) %>%
  GC_labels("gene", style_by = "geneTrack",
            groupStyle = list("2" = nested_label, "3" = nested_label)) %>%
  # Homologous genes of neighbouring genomes, coloured by the protein
  # identity, written on each link where it fits
  GC_links(group = "homolog", measure = "identity", label = TRUE,
           label_position = "link", vmin = 20, curve = TRUE,
           labelStyle = list(fontSize = "9px"),
           colorBarOptions = list(position = "legend", legendSide = "right")) %>%
  # Room above the first genome of each genus for its name: 22 pixels more
  # height, taken up by a margin
  GC_grid(margin = list(top = 22), height = 700 / 11 + 22,
          cluster = first_of_genus$cluster) %>%
  GC_clusterLabel(title = genomes$cluster,
                  subtitle = paste0("<i>", genomes$subgenus, "</i>, ", genomes$host),
                  width = "170px", fontSize = "13px",
                  subtitleFont = list(fontSize = "11px"),
                  align = "right", x = -10) %>%
  GC_clusterTitle(title = first_of_genus$genus, cluster = first_of_genus$cluster,
                  align = "left", height = "0px", x = -165, y = -16,
                  titleFont = list(fontSize = "13px", fontWeight = "bold")) %>%
  GC_title("Conserved core, variable accessory genes: coronaviruses of the four genera",
           subtitle = paste("Homologous proteins of close relatives linked by identity;",
                            "after Fig. 1 of Chazal (2021)"),
           height = "55px",
           titleFont = list(fontSize = "16px", fontWeight = "bold"),
           subtitleFont = list(fontSize = "12px", fontStyle = "italic")) %>%
  GC_tooltip(formatter = "<b>{gene}</b> {product}<br>{virus} {strain}<br>{start} - {end}") %>%
  # The legend names each category with its gene
  GC_legend(position = "top", align = "center", order = names(colors),
            legendTextOptions = list(fontSize = "12px"),
            groupStyle = list(
              "5' UTR" = list(text = "5' UTR (L)"),
              spike = list(text = "spike (S)"),
              "hemagglutinin-esterase" = list(text = "hemagglutinin-esterase (HE)"),
              envelope = list(text = "envelope (E)"),
              membrane = list(text = "membrane (M)"),
              nucleocapsid = list(text = "nucleocapsid (N)")
            )) %>%
  # The untranslated ends share a pattern, in a shade that shows on each
  GC_pattern(patterns = list("5' UTR" = "diagonal", "3' UTR" = "diagonal"),
             color = list("5' UTR" = "#8C8C8C", "3' UTR" = "#6E6E6E"),
             background = NULL, size = 4, strokeWidth = 1) %>%
  GC_zoom(height = 44) %>%
  GC_theme("publication")
chart
