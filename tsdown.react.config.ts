import { defineConfig } from "tsdown";

const createReplaceImportsPlugin = (format: string) => ({
  name: "replace-imports",
  resolveId(source: string) {
    if (/^@embra\/i18n$/.test(source)) {
      return {
        id: format === "cjs" ? "." : "./index.mjs",
        external: true,
      };
    }
    return null;
  },
});

export default defineConfig({
  clean: false,
  dts: true,
  entry: {
    react: "src/react/index.ts",
  },
  format: {
    cjs: {
      plugins: [createReplaceImportsPlugin("cjs")],
    },
    esm: {
      plugins: [createReplaceImportsPlugin("esm")],
    },
  },
  minify: Boolean(process.env.MINIFY),
  sourcemap: false,
  target: "esnext",
  treeshake: false,
});
