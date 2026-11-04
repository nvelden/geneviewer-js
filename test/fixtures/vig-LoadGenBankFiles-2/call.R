library(knitr)
library(geneviewer)
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>"
)
library(geneviewer)
file_path <- "~/Documents/2023 github/geneviewer/genbank_files/abyssomicin/BGC0000001.gbk"
gbk <- read_gbk(file_path)
CDS_1 <- gbk[["BGC0000001"]][["FEATURES"]][["CDS"]][[1]]
df <- data.frame(values = CDS_1)
df
CDS_1 <- gbk[["BGC0000001"]][["FEATURES"]][["CDS"]][[1]]
df <- data.frame(values = CDS_1)
df["translation", "values"] <- substr(df["translation", "values"], 1, 40)
rownames(df) <- names(CDS_1)
kable(df)
cds_df <- gbk_features_to_df(
  gbk, 
  feature = "CDS",
  keys = c("region", "gene", "protein_id", "gene_kind", "product"), 
  process_region = TRUE
  )
cds_df$region <- NULL
kable(head(cds_df))
cds_df$gene_kind[is.na(cds_df$gene_kind)] <- "other"
chart <- GC_chart(
  cds_df,
  start = "start",
  end = "end",
  group = "gene_kind",
  strand = "strand",
  height = "150px"
)
colors <- list(
  "biosynthetic" = "#810E15", 
  "biosynthetic-additional" = "#F16D75", 
  "transport" = "#6495ED",
  "regulatory" = "#2E8B57", 
  "other" = "#808080"
)
chart %>%
  GC_genes(
    marker = "boxarrow",
    marker_size = "small",
    stroke = "#6E7079",
    strokeWidth = 0.5
  ) %>%
  GC_title(
    "BGC0000001: abyssomicin C biosynthetic gene cluster
    from <i>Verrucosispora maris</i> AB-18-032",
    align = "left",
    titleFont = list(
      fontSize = "12px"
    )
    ) %>%
  GC_scale() %>%
  GC_color(customColors = colors) %>%
  GC_legend(order = names(colors)) %>%
  GC_tooltip(
    formatter = "
    <b>Gene:</b> {gene}<br>
    <b>Product:</b> {product}<br>
    <b>Region:</b>{start} - {end}
    "
  ) %>%
  GC_theme("classic", textColor = "#333333")
