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
  start = "start",
  end = "end",
  strand = "strand",
  height = "600px"
) %>%
  GC_transcript(
    transcript = "ensembl_transcript_id",
    type = "type"
  )
