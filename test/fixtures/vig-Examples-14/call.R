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
GC_chart(pQEB1_plasmids, cluster = "cluster", group = "category",
         strand = "strand", height = "760px") %>%
  GC_links(data = pQEB1_alignment, measure = "none", label = FALSE,
           color_bar = FALSE, normal_color = "#7f9cbf",
           inverted_color = "#e6894e") %>%
  GC_genes(marker_size = "small") %>%
  GC_scale(axis_type = "range") %>%
  GC_clusterLabel(
    title = plasmids$cluster,
    subtitle = plasmids$host,
    width = "175px",
    fontSize = "13px",
    subtitleFont = list(fontSize = "12px", fontStyle = "italic"),
    align = "right",
    x = -10
  ) %>%
  GC_title(
    "<i>bla</i>KPC-2 plasmid pQEB1 and its rearranged variants",
    subtitle = paste("IncN plasmids aligned with nucmer",
                     "(all blocks \u2265 99.2% identity);",
                     "orange links mark inversions"),
    height = "70px",
    titleFont = list(fontSize = "20px", fontWeight = "bold"),
    subtitleFont = list(fontSize = "15px", fontStyle = "italic")
  ) %>%
  GC_tooltip(formatter = "<b>{gene}</b> {product}<br>{start} - {end}") %>%
  GC_color(customColors = colors) %>%
  GC_legend(position = "top", align = "center", order = names(colors),
            legendTextOptions = list(fontSize = "14px")) %>%
  GC_theme("publication")
