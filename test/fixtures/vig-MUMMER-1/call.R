library(knitr)
library(geneviewer)
library(dplyr)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
folder_path <- "~/Desktop/Bacillus/"
alignment <- 
  mummer_alignment(
    path = folder_path,
    cluster = NULL,
    maptype = "many-to-many",
    seqtype = "protein",
  )
kable(head(alignment))
folder_path <- "~/Desktop/Bacillus/"
gbk <- read_gbk(folder_path)
cds_df <- gbk_features_to_df(
  gbk, 
  feature = "CDS",
  keys = c("region", "gene", "protein_id", "note", "product")
  )
kable(head(cds_df))
GC_chart(cds_df, strand = "strand", cluster = "cluster") %>%
  GC_links(data = alignment, measure = "identity", vmin = floor(min(alignment$identity))) %>%
  GC_scale(axis_type = "range") %>%
  GC_cluster(separate_strands = TRUE) %>%
  GC_genes(marker_size = "small") %>%
  GC_clusterLabel(
    title = c("pALH1", "pBFQ", "F837_55", "pBFI_4"),
    width = "75px",
    fontSize = "12px"
  ) %>%
  GC_tooltip(formatter = "<b>{protein_id}</b><br>{start} - {end}") %>%
  GC_legend(FALSE) %>%
  GC_theme("publication")
