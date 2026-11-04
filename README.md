# geneviewer-js

The D3 rendering code behind [geneviewer](https://github.com/nvelden/geneviewer),
kept in one place so the R package and a future Python package can draw
gene cluster charts with the same JavaScript.

## Contents

| File | What it is |
|------|------------|
| `src/geneviewer.js` | Chart library: genes, links, labels, legends, scales, colour bars, SVG/PNG export |
| `src/styles.css` | Chart styles |
| `src/htmlwidgets/geneviewerwidget.js` | htmlwidgets binding used by the R package: rendering pipeline, toolbar, zoom, selection, drag and undo/redo |

The files run as classic browser scripts. They expect these globals:

- `d3` (D3 7.8.5)
- `saveAs` (FileSaver.js 2.0.4), for the save buttons
- `HTMLWidgets`, for `HTMLWidgets.dataframeToD3` and the widget binding

## Build

```sh
npm run check   # syntax-check the sources
npm run build   # write dist/ and dist/SHA256SUMS
```

The build copies the sources unchanged and unminified, so the R package can
ship readable source, as CRAN expects. D3 and FileSaver are not bundled; each
host package ships them as separate dependencies with their own licences.

## Releases

1. Bump `version` in `package.json`.
2. Commit, then tag and push: `git tag v0.2.1 && git push origin main v0.2.1`.

The release workflow checks that the tag matches `package.json`, builds
`dist/` and publishes the files with `SHA256SUMS` as a GitHub release.

## Using a release in the R package

The R package vendors a release: its copies of the files are stored in the R
repo and shipped inside the package, so users never download JavaScript
separately. A maintainer pulls a new release with:

```sh
curl -sSLO https://github.com/nvelden/geneviewer-js/releases/download/v0.2.0/{geneviewer.js,styles.css,geneviewerwidget.js,SHA256SUMS}
shasum -a 256 -c SHA256SUMS
```

They then copy the files into `inst/htmlwidgets/`. Do not edit those copies in
the R repo; make changes here and cut a new release.

## Roadmap

- Separate the shared chart logic in `geneviewerwidget.js` (pipeline, toolbar,
  zoom, selection, undo/redo) from the htmlwidgets-specific parts, so a Python
  binding can reuse it.
- Add an ES-module build with D3 included, for anywidget and Shinylive (Python).
- Split `geneviewer.js` into ES modules.

## Licence

MIT. Copyright (c) 2023 geneviewer authors.
