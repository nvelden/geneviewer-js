# Export the built-in themes and palettes of the geneviewer R package to
# src/themes.json, the single source of both from M4 on (in M6 the R package
# reads a vendored copy of this file).
#
# Run from the repo root, with GENEVIEWER_R_DIR set (or in .try-app.env):
#   Rscript scripts/export-themes.R

env_file <- ".try-app.env"
if (file.exists(env_file) && !nzchar(Sys.getenv("GENEVIEWER_R_DIR"))) {
  readRenviron(env_file)
}
r_dir <- gsub('^"|"$', "", Sys.getenv("GENEVIEWER_R_DIR"))
if (!dir.exists(r_dir)) stop("Set GENEVIEWER_R_DIR to the geneviewer R package repo.")
suppressMessages(pkgload::load_all(r_dir, quiet = TRUE))

ns <- asNamespace("geneviewer")
# An empty theme is an object, not an array
themes <- lapply(get("builtin_themes", ns), function(theme) {
  if (length(theme) == 0) structure(list(), names = character(0)) else theme
})
palettes <- lapply(get("geneviewer_palettes", ns), as.list)
json <- jsonlite::toJSON(list(palettes = palettes, themes = themes),
                         auto_unbox = TRUE, pretty = 2, digits = NA)
writeLines(json, "src/themes.json", useBytes = TRUE)
message("wrote src/themes.json")
