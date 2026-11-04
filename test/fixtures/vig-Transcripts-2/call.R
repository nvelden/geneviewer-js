library(knitr)
library(dplyr)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
library(geneviewer)
transcrips <- data.frame(
  ensembl_gene_id = "ENSG00000012048",
  ensembl_transcript_id = unique(BRCA1_splice_variants$ensembl_transcript_id)
)
kable(head(transcrips))
transcript_attributes <- BRCA1_splice_variants[, c("ensembl_transcript_id", "type", "start", "end", "strand")]
kable(head(transcript_attributes))
GC_chart(
  data = transcript_attributes, 
  height = "600px"
  ) %>%
  GC_transcript(
    transcript = "ensembl_transcript_id", 
    strand = "strand", 
    type = "type",
  ) %>%
  GC_clusterTitle(
    title = unique(transcript_attributes$ensembl_transcript_id),
    titleFont = list(
      fontSize = "12px"
    )
  ) %>%
  GC_clusterFooter(
    title = c("0.8%", "0.1%", "0.07%", "0.02%", "0.01%"),
    align = "center"
  )
