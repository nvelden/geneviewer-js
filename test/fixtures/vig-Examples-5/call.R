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
GC_chart(ophA_clusters, 
           start = "start",
           end = "end",
           group = "class",
           cluster = "cluster") %>%
  GC_clusterFooter(
    title = c("<i>Omphalotus olearius</i>", "<i>Dendrothele bispora</i>"), 
    subtitle = c("Locus: 2,522 - 21,484", "Locus: 19,236 - 43,005"),
    align = "left") %>%
  GC_legend(position = "top") %>%
  GC_labels(label = "name") %>%
  GC_scaleBar(y = 20) %>%
  GC_scale(cluster = 1,  scale_breaks = TRUE, hidden = TRUE) %>%
  GC_scale(cluster = 2, reverse = TRUE, hidden = TRUE) %>%
  GC_theme("bw")
