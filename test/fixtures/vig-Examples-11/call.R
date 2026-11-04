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
GC_chart(erythromycin_cluster,
         start = "Start",
         end = "End",
         group = "Functions",
         height = "170px") %>%
  GC_title(
    title = "Erythromycin A biosynthetic gene cluster from <i>Saccharopolyspora erythraea</i>",
    align = "left"
  ) %>%
  GC_genes(marker = "boxarrow", marker_size = "small") %>%
  GC_tooltip(
    formatter = "<b>{Identifiers}</b><br>{Product}<br>{start} - {end}({Strand})"
  ) %>%
  GC_scale(start = 778000, end = 832000, ticksCount = 8) %>%
  GC_legend(order = c(setdiff(sort(erythromycin_cluster$Functions), "Other"), "Other")) %>%
  GC_color(customColors = list(Other = "grey")) %>%
  GC_theme("classic")
