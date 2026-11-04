library(knitr)
library(geneviewer)
library(dplyr)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
library(geneviewer)
library(dplyr)
folder_path <- "~/Documents/2023 github/geneviewer/gff_files/marseilleviridae/"
gff <- read_gff(folder_path, fields = c("source", "type", "start", "end", "strand", "Name")) %>%
  dplyr::filter(type == "CDS")
virus_names <- c(
  GU071086 = "Marseillevirus", 
  HQ113105.1 = "Lausannevirus",
  KF261120 = "Cannesvirus",
  KF483846 = "Tunisvirus"
)
gff <- gff %>% dplyr::mutate(Virus = virus_names[filename])
kable(head(gff))
GC_chart(gff, 
         start = "start", 
         end = "end", 
         strand = "strand", 
         cluster = "Virus",
         height = "400px",
         ) %>%
  GC_title("<i>Marseilleviridae</i> viral genomes") %>%
  GC_clusterLabel() %>%
  GC_scale(axis_type = "range") %>%
  GC_genes(
    group = "filename", 
    stroke = "none", 
    marker_size = "small"
    ) %>%
  GC_tooltip(formatter = "<b>Gene:</b> {Name}")
