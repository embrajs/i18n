import { defineConfig } from "export-size-svg";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const mangleCache = JSON.parse(readFileSync(join(__dirname, "mangle-cache.json"), "utf-8"));

export default defineConfig({
  title: "@embra/i18n",
  out: "./docs/assets",
  esbuildOptions: {
    sourcesContent: false,
    mangleProps: /[^_]_$/,
    mangleCache,
  },
  svg: {
    cardWidth: 400,
    theme: {
      titleColor: "#fb4c1bf7",
      progressColor: "#fb4a1b",
      progressTrackColor: "#fb4c1b37",
    },
  },
  exports: [
    {
      title: 'export * from "@embra/i18n"',
      code: "export * from './src'",
      externals: ["@embra/i18n", "@embra/reactivity", "react"],
    },
    {
      title: 'export * from "@embra/i18n/react"',
      code: "export * from './src/react'",
      externals: ["@embra/i18n", "@embra/reactivity", "react"],
    },
  ],
});
