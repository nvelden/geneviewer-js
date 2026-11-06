import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitepress";
import { expand, sections, writeDataFiles } from "./charts.mjs";

const { version } = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
const base = "/geneviewer-js/";

const guide = (text, hash) => ({ text, link: `/getting-started#${hash}` });

export default defineConfig({
  title: "geneviewer",
  description: "The JavaScript library for interactive gene cluster, transcript and genome alignment charts",
  base,
  outDir: "../_site",
  appearance: "force-auto",
  cleanUrls: true,
  sitemap: { hostname: "https://nvelden.github.io/geneviewer-js/" },
  head: [
    ["link", { rel: "icon", href: `${base}favicon.ico` }],
  ],
  markdown: {
    config(md) {
      md.core.ruler.before("normalize", "geneviewer-markers", (state) => {
        state.src = expand(state.src);
      });
    },
  },
  vite: {
    resolve: {
      alias: [
        { find: /^.*\/VPFooter\.vue$/, replacement: fileURLToPath(new URL("./theme/SiteFooter.vue", import.meta.url)) },
      ],
    },
    define: { __APP_VERSION__: JSON.stringify(version) },
  },
  buildEnd(site) {
    writeDataFiles(site.outDir);
  },
  themeConfig: {
    logo: "/logo.png",
    siteTitle: "geneviewer",
    outline: { level: [2, 3], label: "On this page" },
    search: { provider: "local" },
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "What is geneviewer?", link: "/what-is-geneviewer" },
          { text: "Getting started", link: "/getting-started" },
          { text: "Examples", link: "/examples" },
          { text: "API reference", link: "/api" },
        ],
      },
      {
        text: "Chart parts",
        collapsed: false,
        items: [
          guide("Genes", "genes"),
          guide("Transcripts", "transcripts"),
          guide("Links", "links"),
          guide("Labels", "labels"),
          guide("Annotations", "annotations"),
          guide("Legend", "legend"),
          guide("Scale", "scale"),
          guide("Coordinates", "coordinates"),
          guide("Scale bar", "scale-bar"),
          guide("Tooltip", "tooltip"),
        ],
      },
      {
        text: "Look and feel",
        collapsed: false,
        items: [
          guide("Colors", "colors"),
          guide("Patterns", "patterns"),
          guide("Themes", "themes"),
          guide("Layout", "layout"),
        ],
      },
      {
        text: "Interaction",
        collapsed: false,
        items: [
          guide("Events", "events"),
          guide("Moving elements", "moving-elements"),
          guide("Zoom", "zoom"),
          guide("Toolbar", "toolbar"),
          guide("Saving charts", "saving-charts"),
        ],
      },
      {
        text: "Examples",
        collapsed: true,
        items: sections.map((section) => ({
          text: section.heading.replace(/\*([^*]+)\*/g, "<i>$1</i>").replace(/`([^`]+)`/g, "<code>$1</code>"),
          link: `/examples#${section.id}`,
        })),
      },
    ],
  },
});
