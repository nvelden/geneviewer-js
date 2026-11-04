# Export the test fixtures from the geneviewer R package.
#
# Sources, each run top to bottom in its own environment:
#   - the @examples of every help page (man/*.Rd)
#   - the code of every vignette (vignettes/*.Rmd)
#   - test/charts.R in this repo: charts added for coverage. A comment line
#     "## fixture: <id>" names the next chart in the file.
#
# Every top-level expression whose value is a geneviewer chart becomes a
# fixture in test/fixtures/<id>/: call.R (the code before it in the same
# source, then the expression), payload.json (the x that htmlwidgets sends to
# the browser, after the widget's preRenderHook) and meta.json. Charts identical to an earlier one are
# skipped. Expressions that fail (e.g. no network, MUMmer not installed) are
# logged and the source continues.
#
# Run from the repo root, with GENEVIEWER_R_DIR set (or in .try-app.env):
#   Rscript scripts/export-fixtures.R

env_file <- ".try-app.env"
if (file.exists(env_file) && !nzchar(Sys.getenv("GENEVIEWER_R_DIR"))) {
  readRenviron(env_file)
}
r_dir <- gsub('^"|"$', "", Sys.getenv("GENEVIEWER_R_DIR"))
if (!dir.exists(r_dir)) stop("Set GENEVIEWER_R_DIR to the geneviewer R package repo.")

suppressMessages(pkgload::load_all(r_dir, quiet = TRUE))
suppressMessages(library(magrittr))

out_dir <- "test/fixtures"
log_lines <- character()
note <- function(...) {
  line <- paste0(...)
  log_lines <<- c(log_lines, line)
  message(line)
}

# Code of each source as a temporary R file
rd_sources <- function() {
  files <- sort(list.files(file.path(r_dir, "man"), pattern = "\\.Rd$", full.names = TRUE))
  out <- list()
  for (file in files) {
    tmp <- tempfile(fileext = ".R")
    tools::Rd2ex(file, tmp, commentDontrun = TRUE, commentDonttest = FALSE)
    if (file.exists(tmp)) {
      out[[paste0("rd-", tools::file_path_sans_ext(basename(file)))]] <- tmp
    }
  }
  out
}

vignette_sources <- function() {
  files <- sort(list.files(file.path(r_dir, "vignettes"), pattern = "\\.Rmd$", full.names = TRUE))
  out <- list()
  for (file in files) {
    tmp <- tempfile(fileext = ".R")
    suppressMessages(knitr::purl(file, output = tmp, quiet = TRUE, documentation = 0))
    out[[paste0("vig-", tools::file_path_sans_ext(basename(file)))]] <- tmp
  }
  out
}

is_chart <- function(x) inherits(x, "htmlwidget") && inherits(x, "geneviewer")

slug <- function(x) gsub("[^A-Za-z0-9]+", "-", x)

# "## fixture: <id>" comments before each expression
fixture_ids <- function(exprs) {
  refs <- attr(exprs, "srcref")
  lines <- readLines(attr(refs[[1]], "srcfile")$filename, warn = FALSE)
  ends <- c(0, vapply(refs, function(r) r[3], 1L))
  vapply(seq_along(refs), function(i) {
    above <- lines[seq_len(refs[[i]][1] - 1)]
    above <- above[seq_along(above) > ends[i]]
    hit <- regmatches(above, regexpr("(?<=^## fixture: )\\S+", above, perl = TRUE))
    if (length(hit)) hit[length(hit)] else NA_character_
  }, "")
}

seen <- character()
written <- character()

export_source <- function(name, file) {
  exprs <- tryCatch(parse(file, keep.source = TRUE), error = function(e) {
    note("skip ", name, ": cannot parse: ", conditionMessage(e))
    NULL
  })
  if (!length(exprs)) return(invisible())
  refs <- attr(exprs, "srcref")
  ids <- fixture_ids(exprs)
  env <- new.env(parent = globalenv())
  set.seed(1)
  setup <- character()
  count <- 0
  pending <- NA_character_
  for (i in seq_along(exprs)) {
    if (!is.na(ids[i])) pending <- ids[i]
    code <- paste(as.character(refs[[i]]), collapse = "\n")
    result <- tryCatch(
      withVisible(suppressWarnings(suppressMessages(eval(exprs[[i]], env)))),
      error = function(e) {
        note(name, " #", i, ": error: ", conditionMessage(e))
        NULL
      }
    )
    if (is.null(result) || !result$visible || !is_chart(result$value)) {
      if (!is.null(result)) setup <- c(setup, code)
      next
    }
    widget <- result$value
    sent <- htmlwidgets:::createPayload(widget)
    count <- count + 1
    id <- if (!is.na(pending)) pending else paste0(slug(name), "-", count)
    pending <- NA_character_
    if (length(sent$evals)) {
      note(id, ": skipped, payload contains JavaScript functions")
      next
    }
    payload <- as.character(htmlwidgets:::toJSON(sent$x))
    hash <- digest_text(payload)
    if (hash %in% seen) {
      note(id, ": skipped, same chart as an earlier fixture")
      next
    }
    seen <<- c(seen, hash)
    height <- widget$height
    if (is.numeric(height)) height <- paste0(height, "px")
    if (is.null(height)) height <- "400px"
    covers <- sort(unique(grep("^GC_", all.names(exprs[[i]]), value = TRUE)))

    dir <- file.path(out_dir, id)
    dir.create(dir, recursive = TRUE, showWarnings = FALSE)
    writeLines(c(setup, code), file.path(dir, "call.R"), useBytes = TRUE)
    writeLines(payload, file.path(dir, "payload.json"), useBytes = TRUE)
    meta <- list(id = id, source = name, width = 1000, height = height, covers = covers)
    writeLines(jsonlite::toJSON(meta, auto_unbox = TRUE, pretty = TRUE),
               file.path(dir, "meta.json"))
    written <<- c(written, id)
  }
}

digest_text <- function(text) {
  tmp <- tempfile()
  writeLines(text, tmp, useBytes = TRUE)
  on.exit(unlink(tmp))
  unname(tools::md5sum(tmp))
}

sources <- c(
  list(charts = "test/charts.R"),
  vignette_sources(),
  rd_sources()
)
for (name in names(sources)) export_source(name, sources[[name]])

# Fixtures no longer produced by any source
stale <- setdiff(list.dirs(out_dir, full.names = FALSE, recursive = FALSE), written)
for (id in stale) note("stale fixture (no longer exported): ", id)

writeLines(c(sprintf("%d fixtures", length(written)), log_lines), "test/fixtures/EXPORT-LOG.txt")
message(length(written), " fixtures written")
