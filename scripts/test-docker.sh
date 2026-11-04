#!/usr/bin/env bash
# Run the fixture tests in the Docker test image (docker/Dockerfile), which
# fixes Chrome and the fonts. Arguments go to test/run.cjs, e.g. --update or
# --only <id>.
set -euo pipefail
cd "$(dirname "$0")/.."

node scripts/build.mjs > /dev/null
docker build --quiet --platform linux/amd64 -t geneviewer-js-test -f docker/Dockerfile . > /dev/null
docker run --rm --platform linux/amd64 -v "$PWD":/work -w /work \
  geneviewer-js-test node test/run.cjs "$@"
