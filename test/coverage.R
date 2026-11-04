# Which documented arguments of the exported GC_* chart functions the
# fixtures use. Writes test/coverage.md, uncovered arguments first.
#
# Run from the repo root, with GENEVIEWER_R_DIR set (or in .try-app.env):
#   Rscript test/coverage.R

env_file <- ".try-app.env"
if (file.exists(env_file) && !nzchar(Sys.getenv("GENEVIEWER_R_DIR"))) {
  readRenviron(env_file)
}
r_dir <- gsub('^"|"$', "", Sys.getenv("GENEVIEWER_R_DIR"))
if (!dir.exists(r_dir)) stop("Set GENEVIEWER_R_DIR to the geneviewer R package repo.")
suppressMessages(pkgload::load_all(r_dir, quiet = TRUE))
ns <- asNamespace("geneviewer")

# Arguments that a static fixture cannot show, with the reason
not_drawable <- list(
  "GC_chart:elementId" = "the id of the HTML element, not part of the drawing",
  "GC_zoom_to:session" = "Shiny only",
  "GC_zoom_to:outputId" = "Shiny only",
  "GC_zoom_to:range" = "Shiny only (GC_zoom(range = ) covers the drawing)",
  "GC_events:render_id" = "Shiny only: identifies a render in input$<id>_rendered",
  "GC_events:rendered" = "Shiny only: reports a finished render"
)
# Shiny functions, not chart functions
skip_functions <- c("GC_chartOutput")

exports <- sort(grep("^GC_", getNamespaceExports(ns), value = TRUE))
exports <- setdiff(exports, skip_functions)

# Documented arguments, from the help pages
rd_arguments <- function(fn) {
  rd_db <- tools::Rd_db(dir = r_dir)
  topic <- Filter(function(rd) {
    aliases <- unlist(lapply(rd, function(x) if (attr(x, "Rd_tag") == "\\alias") as.character(x)))
    fn %in% aliases
  }, rd_db)
  if (!length(topic)) return(character())
  rd <- topic[[1]]
  args <- Filter(function(x) attr(x, "Rd_tag") == "\\arguments", rd)
  if (!length(args)) return(character())
  items <- Filter(function(x) attr(x, "Rd_tag") == "\\item", args[[1]])
  names <- vapply(items, function(item) paste(unlist(item[[1]]), collapse = ""), "")
  names <- trimws(unlist(strsplit(names, ",")))
  # Only arguments of this function (a help page can document several)
  intersect(names, c(names(formals(get(fn, ns))), "..."))
}
documented <- do.call(rbind, lapply(exports, function(fn) {
  args <- rd_arguments(fn)
  if (!length(args)) return(NULL)
  data.frame(fn = fn, arg = args, stringsAsFactors = FALSE)
}))

# Argument names used in every GC_* call in an expression. The right side of
# %>% gets the chart as its first argument, as magrittr does.
used_in <- function(expr) {
  found <- list()
  walk <- function(e) {
    if (!is.call(e)) return()
    head <- e[[1]]
    if (identical(head, as.name("%>%")) && is.call(e[[3]])) {
      walk(e[[2]])
      rhs <- e[[3]]
      e <- as.call(c(rhs[[1]], quote(.chart), as.list(rhs)[-1]))
      head <- e[[1]]
    }
    if (is.name(head) && grepl("^GC_", as.character(head)) &&
        as.character(head) %in% exports) {
      fn <- as.character(head)
      def <- get(fn, ns)
      matched <- tryCatch(match.call(def, e, expand.dots = FALSE), error = function(err) NULL)
      if (!is.null(matched)) {
        args <- names(as.list(matched))[-1]
        dots <- matched$...
        if (!is.null(dots)) args <- c(setdiff(args, "..."), "...")
        found[[length(found) + 1]] <<- data.frame(fn = fn, arg = args, stringsAsFactors = FALSE)
      }
    }
    for (i in seq_along(e)[-1]) {
      # Empty arguments, as in x[, 1], have nothing to walk
      if (identical(e[[i]], quote(expr = ))) next
      walk(e[[i]])
    }
  }
  walk(expr)
  do.call(rbind, found)
}

fixtures <- sort(list.dirs("test/fixtures", full.names = FALSE, recursive = FALSE))
uses <- do.call(rbind, lapply(fixtures, function(id) {
  exprs <- tryCatch(parse(file.path("test/fixtures", id, "call.R")), error = function(e) NULL)
  if (is.null(exprs)) return(NULL)
  rows <- do.call(rbind, lapply(exprs, used_in))
  if (is.null(rows) || !nrow(rows)) return(NULL)
  rows$fixture <- id
  unique(rows)
}))

key <- paste0(documented$fn, ":", documented$arg)
use_key <- paste0(uses$fn, ":", uses$arg)
documented$fixtures <- vapply(key, function(k) {
  ids <- unique(uses$fixture[use_key == k])
  if (!length(ids)) return("")
  shown <- head(ids, 3)
  paste0(length(ids), ": ", paste(shown, collapse = ", "), if (length(ids) > 3) ", ...")
}, "")
documented$status <- ifelse(nzchar(documented$fixtures), "covered",
                     ifelse(key %in% names(not_drawable), "not drawable", "UNCOVERED"))
documented$note <- ifelse(key %in% names(not_drawable), unlist(not_drawable[key]), "")
documented <- documented[order(documented$status != "UNCOVERED",
                               documented$status != "not drawable",
                               documented$fn, documented$arg), ]

counts <- table(factor(documented$status, c("covered", "not drawable", "UNCOVERED")))
lines <- c(
  "# Fixture coverage",
  "",
  "Documented arguments of the exported `GC_*` chart functions, and the",
  "fixtures whose code uses them. Written by `Rscript test/coverage.R`.",
  "",
  sprintf("- %d fixtures", length(fixtures)),
  sprintf("- %d arguments: %d covered, %d not drawable, %d uncovered",
          nrow(documented), counts[["covered"]], counts[["not drawable"]], counts[["UNCOVERED"]]),
  "",
  "| Function | Argument | Status | Fixtures |",
  "|----------|----------|--------|----------|",
  sprintf("| `%s` | `%s` | %s | %s |", documented$fn, documented$arg, documented$status,
          ifelse(nzchar(documented$note), documented$note, documented$fixtures))
)
writeLines(lines, "test/coverage.md")
cat(lines[6:7], sep = "\n")
