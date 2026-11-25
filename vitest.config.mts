import { getViteConfig } from "astro/config";
import { defineConfig as defineVitestConfig } from "vitest/config";

export default getViteConfig(
  defineVitestConfig({
    test: {
      coverage: {
        include: ["src/**"],
        reporter: ["html", "text", "json-summary"],
        thresholds: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
      execArgv: ["--expose-gc"],
      setupFiles: ["./test/setup.ts"],
    },
  }) as any,
  {
    cacheDir: "./.astro-cache",
    configFile: false,
    devToolbar: { enabled: false },
    srcDir: "./test/astro",
  },
);
