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
GC_chart(BRCA1_splice_variants, height = "600px") %>%
  GC_transcript(
    transcript = "ensembl_transcript_id", 
    strand = "strand", 
    type = "type",
  ) %>%
  GC_clusterTitle(
    title = unique(BRCA1_splice_variants$ensembl_transcript_id),
    titleFont = list(
      fontSize = "12px"
    )
  ) %>%
  GC_clusterFooter(
    title = c("0.8%", "0.1%", "0.07%", "0.02%", "0.01%"),
    align = "center"
  ) %>%
  GC_theme("infographic", textColor = "#333333")
