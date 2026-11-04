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
GC_chart(blastp, 
         cluster = "cluster",
         strand = "strand",
         group = "Functions",
         height = 250) %>%
  GC_labels("Gene", cluster = 1) %>%
  GC_genes(marker_size = "small", marker = "rbox", markerHeight = 15,
           stroke = "#6E7079", strokeWidth = 0.5) %>%
  GC_links(group = "BlastP", 
           label = FALSE,
           color_bar = FALSE
           ) %>%
  GC_clusterLabel() %>%
  GC_legend(FALSE) %>%
  GC_color(customColors = list("No Hit" = "white")) %>%
  GC_theme("classic", textColor = "#333333", palette = "okabeIto")
