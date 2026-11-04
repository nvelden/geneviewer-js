gene_cluster <- data.frame(
  name = c("ophB1", "ophC", "ophA", "ophD", "ophB2", "ophP", "ophE"),
  start = c(2522, 5286, 9536, 12616, 13183, 19346, 20170),
  end = c(4276, 4718, 10904, 11859, 15046, 16016, 21484),
  class = c("Monooxygenase", "NTF2-like", "Methyltransferase",
  "O-acyltransferase", "Monooxygenase", "Prolyloligopeptidase",
  "F-box/RNHI-like")
)
GC_chart(BRCA1_splice_variants, height = "500px") %>%
  GC_transcript(
    transcript = "ensembl_transcript_id", strand = "strand", type = "type",
    style_by = "ensembl_transcript_id",
    groupStyleExons = list(ENST00000357654 = list(fill = "red")),
    groupStyleIntrons = list(ENST00000357654 = list(stroke = "red")),
    groupStyleUTRs = list(ENST00000357654 = list(fill = "pink")),
    opacity = 0.8
  )
