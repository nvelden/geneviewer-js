#!/usr/bin/env bash
# Run the geneviewer Shiny app with the JavaScript from this repo, then run
# the app's tests against it. The app keeps running so you can try it.
#
# Neither the R repo nor your R library is changed: the R package is copied
# to a temporary folder, the built files replace its JavaScript there, and the
# app loads that copy with pkgload::load_all().
#
# Usage: npm run try-app [-- --no-tests] [-- --r-tests]
#   --no-tests  only start the app
#   --r-tests   also run the R package's own tests (devtools::test()) on the
#               temporary copy, which include its browser tests
#
# Settings (environment variables, or a .try-app.env file in this repo):
#   GENEVIEWER_R_DIR    the geneviewer R package repo
#   GENEVIEWER_APP_DIR  the geneviewer-shinylive repo
#   PORT                port for the app (default 4849)
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .try-app.env ] && . ./.try-app.env

PORT="${PORT:-4849}"
RUN_TESTS=1
R_TESTS=0
for arg in "$@"; do
  case "$arg" in
    --no-tests) RUN_TESTS=0 ;;
    --r-tests) R_TESTS=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

for var in GENEVIEWER_R_DIR GENEVIEWER_APP_DIR; do
  if [ -z "${!var:-}" ] || [ ! -d "${!var}" ]; then
    echo "Set $var to a folder (in the environment or .try-app.env)." >&2
    exit 2
  fi
done

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is in use. Stop that process or choose another PORT." >&2
  exit 1
fi

echo "== Build"
npm run -s build

echo "== Copy the R package and swap in the built JavaScript"
work="$(mktemp -d "${TMPDIR:-/tmp}/geneviewer-try-app.XXXXXX")"
pkg="$work/geneviewer"
rsync -a --exclude .git --exclude docs --exclude renv --exclude revdep \
  "$GENEVIEWER_R_DIR/" "$pkg/"
# The R package's files and the builds that replace them: the core build
# (the page's d3, not minified), the stylesheet and the binding
for pair in geneviewer.core.js:geneviewer.js geneviewer.css:styles.css geneviewerwidget.js:geneviewerwidget.js; do
  file="dist/${pair%%:*}"
  name="${pair##*:}"
  matches=()
  while IFS= read -r match; do matches+=("$match"); done \
    < <(find "$pkg/inst/htmlwidgets" -name "$name" -type f)
  if [ "${#matches[@]}" -ne 1 ]; then
    echo "Expected one $name in inst/htmlwidgets, found ${#matches[@]}." >&2
    exit 1
  fi
  if cmp -s "$file" "${matches[0]}"; then state="same as R repo"; else state="changed"; fi
  cp "$file" "${matches[0]}"
  echo "  ${matches[0]#"$pkg/"}  ($state)"
done

echo "== Start the app"
log="$work/app.log"
cat > "$work/run-app.R" <<EOF
pkgload::load_all("$pkg", quiet = TRUE)
shiny::runApp("$GENEVIEWER_APP_DIR/app", port = $PORT, launch.browser = FALSE)
EOF
nohup Rscript --vanilla "$work/run-app.R" > "$log" 2>&1 &
app_pid=$!
url="http://127.0.0.1:$PORT/"
for _ in $(seq 1 120); do
  curl -sf -o /dev/null "$url" && break
  if ! kill -0 "$app_pid" 2>/dev/null; then
    echo "The app stopped while starting. Log:" >&2
    cat "$log" >&2
    exit 1
  fi
  sleep 1
done
curl -sf -o /dev/null "$url" || { echo "The app did not start within 120 s. Log: $log" >&2; exit 1; }
echo "  $url (pid $app_pid)"

status=0
if [ "$RUN_TESTS" -eq 1 ]; then
  echo "== App tests (tests/testthat)"
  if ! (cd "$GENEVIEWER_APP_DIR" && Rscript --vanilla -e \
      "pkgload::load_all('$pkg', quiet = TRUE); source('tests/testthat.R')"); then
    status=1
  fi

  echo "== Browser tests (tests/browser)"
  passed=() failed=()
  for test in "$GENEVIEWER_APP_DIR"/tests/browser/*.cjs; do
    name="$(basename "$test")"
    if GENEVIEWER_APP_URL="$url" node "$test" > "$work/$name.log" 2>&1; then
      passed+=("$name"); echo "  pass  $name"
    else
      failed+=("$name"); echo "  FAIL  $name  (log: $work/$name.log)"
    fi
  done
  echo "  ${#passed[@]} passed, ${#failed[@]} failed"
  [ "${#failed[@]}" -eq 0 ] || status=1
fi

if [ "$R_TESTS" -eq 1 ]; then
  echo "== R package tests (devtools::test() on the copy)"
  if Rscript --vanilla -e "devtools::test('$pkg', stop_on_failure = TRUE)" \
      > "$work/r-tests.log" 2>&1; then
    echo "  pass  (log: $work/r-tests.log)"
  else
    echo "  FAIL  (log: $work/r-tests.log)"
    status=1
  fi
  tail -n 15 "$work/r-tests.log" | sed 's/^/  /'
fi

echo
echo "The app is still running at $url"
echo "Stop it with: kill $app_pid"
echo "Files and logs: $work"
exit "$status"
