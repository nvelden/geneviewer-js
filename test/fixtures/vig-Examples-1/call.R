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
GC_chart(lacZ_operon, group = "Gene_symbol", height = "140px") %>%
  GC_labels() %>%
  GC_scaleBar(title = "0.2 kb", scaleBarUnit = 200, y=30) %>%
  GC_tooltip(
    formatter = "
    <b>ID:</b> {NCBI_Gene_ID}<br>
    <b>Description:</b> {Description}<br>
    <b>Start:</b> {start}<br>
    <b>End:</b> {end}",
  ) %>%
  GC_clusterFooter(
    align = "center",
    y = -30,
    subtitle = "<i>Escherichia coli</i> str. K-12 substr. MG1655" 
  ) %>%
  GC_coordinates(
    rotate = 0,
    tickValuesBottom = c(min(lacZ_operon$start), max(lacZ_operon$end)),
    textStyle = list(fontSize = "10px", x = -2.2, y = 1.2),
    tickStyle = list(lineLength = 10)
    ) %>%
  GC_legend(FALSE)
