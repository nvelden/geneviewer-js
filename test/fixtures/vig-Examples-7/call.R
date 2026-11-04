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
GC_chart(
    ophA_clusters,
    cluster = "cluster",
    group = "class",
    width = "800px",
    height = "400px"
  ) %>%
  GC_labels(
    cluster = 1,
    label = "name"
  ) %>%
  GC_links(
    "class",
    use_group_colors = FALSE,
    measure = "none",
    normal_color = "#969696",
    inverted_color = "#969696",
    curve = TRUE,
    label = FALSE,
    linkWidth = 0.2,
  ) %>%
  GC_links(
    group = "name",
    value1 = "ophA",
    value2 = "dbophA",
    use_group_colors = TRUE,
    linkStyle = list(
      stroke = "black",
      strokeWidth = 2
    )
  ) %>%
  GC_clusterLabel(
    title = c("<i>O.</i> <i>olearius</i>", "<i>D. bispora</i>"),
    wrapLabel = FALSE
  ) %>%
  # Reduce space between legend and cluster
  GC_grid(
    cluster = 2,
    height = "25%"
  ) %>%
  GC_legend(
    legendTextOptions = list(fontSize = "14px")
  ) %>%
  GC_annotation(
    cluster = 1,
    x = 10884,
    y = 11,
    type = "text",
    text = "90%",
    style = list(fontSize = "16px", fill = "#1c641c")
  ) %>%
  GC_trackMouse()
