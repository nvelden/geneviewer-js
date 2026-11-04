library(knitr)
library(geneviewer)
library(dplyr)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
library(geneviewer)
file_path <- "~/Documents/2023 github/geneviewer/fasta_files/"
fasta_df <- read_fasta(file_path, sequence = FALSE)
kable(head(fasta_df))
chart <- GC_chart(
  fasta_df,
  start = "start",
  end = "end",
  strand = "strand",
  cluster = "cluster",
  height = "400px"
) %>% 
  GC_clusterLabel(unique(fasta_df$cluster))
chart
