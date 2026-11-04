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
GC_chart(blastp, 
         cluster = "cluster",
         strand = "strand",
         group = "Functions",
         height = 700) %>%
  GC_title(
    title = "Protein Alignment Results"
  ) %>%
  GC_labels("Gene", cluster = 1) %>%
  GC_links(group = "Gene", 
           show_links = FALSE,
           color_bar = FALSE,
           labelStyle = list(fontSize = "10px")
           ) %>%
  GC_clusterLabel() %>%
  GC_genes(stroke = "#6E7079", strokeWidth = 0.5) %>%
  GC_legend(order = c(setdiff(sort(unique(blastp$Functions)), "No Hit"), "No Hit")) %>%
  GC_color(customColors = list("No Hit" = "white")) %>%
  GC_theme("infographic", textColor = "#333333", palette = "okabeIto")
