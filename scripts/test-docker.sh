#!/usr/bin/env bash
# Run the fixture tests in the Docker test image (docker/Dockerfile), which
# fixes Chromium and the fonts. Arguments go to test/run.cjs, e.g. --update
# or --only <id>. The image is arm64: Apple silicon or an arm64 CI runner.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "$(docker info --format '{{.Architecture}}')" != "aarch64" ]; then
  echo "The test image must run natively on arm64 (see docker/Dockerfile)." >&2
  exit 1
fi
node scripts/build.mjs > /dev/null
docker build --quiet -t geneviewer-js-test -f docker/Dockerfile . > /dev/null
docker run --rm -v "$PWD":/work -w /work geneviewer-js-test node test/run.cjs "$@"
