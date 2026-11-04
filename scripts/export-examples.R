# Export the documentation examples from the geneviewer R package.
#
# For each example this writes site/examples/<id>.json with the R code, the
# chart height and the payload the R package sends to the browser. The site
# draws the charts from these files with the JavaScript in this repo.
#
# Run from the repo root, with GENEVIEWER_R_DIR set (or in .try-app.env):
#   Rscript scripts/export-examples.R

env_file <- ".try-app.env"
if (file.exists(env_file) && !nzchar(Sys.getenv("GENEVIEWER_R_DIR"))) {
  readRenviron(env_file)
}
r_dir <- gsub('^"|"$', "", Sys.getenv("GENEVIEWER_R_DIR"))
if (!dir.exists(r_dir)) stop("Set GENEVIEWER_R_DIR to the geneviewer R package repo.")

suppressMessages(pkgload::load_all(r_dir, quiet = TRUE))
library(magrittr)

examples <- list(
  list(
    id = "ophA",
    title = "Gene cluster with labels",
    description = "Genes drawn from their start and end positions, coloured by class, with a label above each gene.",
    code = '
gene_cluster <- data.frame(
  name = c("ophB1", "ophC", "ophA", "ophD", "ophB2", "ophP", "ophE"),
  start = c(2522, 5286, 9536, 12616, 13183, 19346, 20170),
  end = c(4276, 4718, 10904, 11859, 15046, 16016, 21484),
  class = c("Monooxygenase", "NTF2-like", "Methyltransferase",
  "O-acyltransferase", "Monooxygenase", "Prolyloligopeptidase",
  "F-box/RNHI-like")
)

GC_chart(gene_cluster, group = "class", height = "100px") %>%
  GC_labels("name")'
  ),
  list(
    id = "lac-operon",
    title = "E. coli lac operon",
    description = "A single operon with a scale bar, custom tooltips, a footer and coordinates at the ends only.",
    code = '
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
  GC_scaleBar(title = "0.2 kb", scaleBarUnit = 200, y = 30) %>%
  GC_tooltip(
    formatter = "
    <b>ID:</b> {NCBI_Gene_ID}<br>
    <b>Description:</b> {Description}<br>
    <b>Start:</b> {start}<br>
    <b>End:</b> {end}"
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
  GC_legend(FALSE)'
  ),
  list(
    id = "erythromycin-blastp",
    title = "Protein alignment between clusters",
    description = "Erythromycin gene clusters compared by BlastP. Genes with a hit share a colour by function; the identity of each match is shown beside the gene.",
    code = '
blastp <- erythromycin_BlastP
blastp$Functions[is.na(blastp$Functions)] <- "No Hit"

GC_chart(blastp,
         cluster = "cluster",
         strand = "strand",
         group = "Functions",
         height = 700) %>%
  GC_title(title = "Protein Alignment Results") %>%
  GC_labels("Gene", cluster = 1) %>%
  GC_links(group = "Gene",
           show_links = FALSE,
           color_bar = FALSE,
           labelStyle = list(fontSize = "10px")) %>%
  GC_clusterLabel() %>%
  GC_genes(stroke = "#6E7079", strokeWidth = 0.5) %>%
  GC_legend(order = c(setdiff(sort(unique(blastp$Functions)), "No Hit"), "No Hit")) %>%
  GC_color(customColors = list("No Hit" = "white")) %>%
  GC_theme("infographic", textColor = "#333333", palette = "okabeIto")'
  ),
  list(
    id = "pqeb1",
    title = "Plasmid alignment blocks",
    description = "Plasmid pQEB1 and rearranged variants, linked by whole-sequence alignment blocks. Orange links mark inversions.",
    code = '
plasmids <- dplyr::distinct(pQEB1_plasmids, cluster, host)
colors <- list(
  "Carbapenemase (KPC)" = "#d62728",
  "Other resistance" = "#ff7f0e",
  "Arsenic resistance" = "#8c564b",
  "Mobile element" = "#9467bd",
  "Conjugation" = "#1f77b4",
  "Replication & maintenance" = "#2ca02c",
  "Hypothetical" = "#d9d9d9",
  "Other" = "#9e9e9e"
)

GC_chart(pQEB1_plasmids, cluster = "cluster", group = "category",
         strand = "strand", height = "760px") %>%
  GC_links(data = pQEB1_alignment, measure = "none", label = FALSE,
           color_bar = FALSE, normal_color = "#7f9cbf",
           inverted_color = "#e6894e") %>%
  GC_genes(marker_size = "small") %>%
  GC_scale(axis_type = "range") %>%
  GC_clusterLabel(
    title = plasmids$cluster,
    subtitle = plasmids$host,
    width = "175px",
    fontSize = "13px",
    subtitleFont = list(fontSize = "12px", fontStyle = "italic"),
    align = "right",
    x = -10
  ) %>%
  GC_title(
    "<i>bla</i>KPC-2 plasmid pQEB1 and its rearranged variants",
    subtitle = paste("IncN plasmids aligned with nucmer",
                     "(all blocks \\u2265 99.2% identity);",
                     "orange links mark inversions"),
    height = "70px",
    titleFont = list(fontSize = "20px", fontWeight = "bold"),
    subtitleFont = list(fontSize = "15px", fontStyle = "italic")
  ) %>%
  GC_tooltip(formatter = "<b>{gene}</b> {product}<br>{start} - {end}") %>%
  GC_color(customColors = colors) %>%
  GC_legend(position = "top", align = "center", order = names(colors),
            legendTextOptions = list(fontSize = "14px")) %>%
  GC_theme("publication")'
  ),
  list(
    id = "brca1",
    title = "Transcripts",
    description = "BRCA1 splice variants drawn as exons and introns, with a title and footer per transcript.",
    code = '
GC_chart(BRCA1_splice_variants, height = "600px") %>%
  GC_transcript(
    transcript = "ensembl_transcript_id",
    strand = "strand",
    type = "type"
  ) %>%
  GC_clusterTitle(
    title = unique(BRCA1_splice_variants$ensembl_transcript_id),
    titleFont = list(fontSize = "12px")
  ) %>%
  GC_clusterFooter(
    title = c("0.8%", "0.1%", "0.07%", "0.02%", "0.01%"),
    align = "center"
  ) %>%
  GC_theme("infographic", textColor = "#333333")'
  ),
  list(
    id = "interactive",
    title = "Zoom, select and drag",
    description = "The toolbar and zoom slider. Drag the slider to zoom, click genes to select them, drag labels to move them, and use undo, redo and save.",
    code = '
GC_chart(ophA_clusters, group = "class", cluster = "cluster",
         height = "320px") %>%
  GC_labels("name") %>%
  GC_links("class", measure = "identity") %>%
  GC_clusterLabel() %>%
  GC_zoom() %>%
  GC_events(select = TRUE)'
  )
)

dir.create("site/examples", recursive = TRUE, showWarnings = FALSE)
for (example in examples) {
  code <- trimws(example$code)
  widget <- eval(parse(text = code))
  if (any(unlist(htmlwidgets:::shouldEval(widget$x)))) {
    stop(example$id, ": JavaScript functions in the payload are not supported.")
  }
  height <- widget$height
  if (is.numeric(height)) height <- paste0(height, "px")
  out <- list(
    id = example$id,
    title = example$title,
    description = example$description,
    code = code,
    height = if (is.null(height)) "400px" else height,
    x = widget$x
  )
  json <- htmlwidgets:::toJSON(out)
  writeLines(json, file.path("site/examples", paste0(example$id, ".json")), useBytes = TRUE)
  cat("wrote site/examples/", example$id, ".json\n", sep = "")
}
writeLines(
  jsonlite::toJSON(vapply(examples, `[[`, "", "id")),
  "site/examples/index.json"
)
cat("wrote site/examples/index.json\n")
