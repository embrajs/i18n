import { getViteConfig } from "astro/config";
import { defineConfig as defineVitestConfig } from "vitest/config";

export default getViteConfig(
  defineVitestConfig({
    test: {
      coverage: {
        include: ["src/**"],
        reporter: ["html", "text", "json-summary"],
      },
    },
  }) as any,
  {
    cacheDir: "./.astro-cache",
    configFile: false,
    devToolbar: { enabled: false },
    srcDir: "./test/astro",
  },
);
