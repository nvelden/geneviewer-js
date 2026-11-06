#!/usr/bin/env bash
# Build, and compile the type usage test (test/types/). Then run the fixture
# tests in the Docker test image (docker/Dockerfile), which
# fixes Chromium and the fonts: the fixture tests (test/run.cjs), the
# interaction tests (test/interaction.cjs), the spec updates
# (test/update.mjs), the chart methods (test/methods.mjs), then the save, two-chart, binding and warning checks
# (test/save.cjs, test/two-charts.cjs, test/binding.cjs, test/warnings.cjs). Arguments go to the first two, e.g. --update. The
# image is arm64: Apple silicon or an arm64 CI runner.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "$(docker info --format '{{.Architecture}}')" != "aarch64" ]; then
  echo "The test image must run natively on arm64 (see docker/Dockerfile)." >&2
  exit 1
fi
node scripts/build.mjs > /dev/null
node scripts/build-types.mjs > /dev/null
node node_modules/typescript/bin/tsc -p test/types/tsconfig.json
node scripts/build-test.mjs > /dev/null
node test/compile.mjs > /dev/null || node test/compile.mjs --verbose
docker build --quiet -t geneviewer-js-test -f docker/Dockerfile . > /dev/null
docker run --rm -v "$PWD":/work -w /work geneviewer-js-test \
  sh -c 'node test/run.cjs "$@" && node test/run.cjs --build min --mode spec && node test/interaction.cjs "$@" && node test/update.mjs && node test/methods.mjs && node test/icons.cjs && node test/save.cjs && node test/two-charts.cjs && node test/binding.cjs && node test/warnings.cjs' sh "$@"
