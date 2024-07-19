import { defineConfig } from "tsup";

const isProduction =
  process.env.NODE_ENV === "production" || process.env.CI === "true";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    formats: "src/formats/index.ts",
    nestjs: "src/nestjs/index.ts",
  },
  format: ["cjs", "esm"],
  treeshake: true,
  clean: true,
  minify: isProduction,
  sourcemap: !isProduction,
  dts: true,
  env: {
    NODE_ENV: isProduction ? "production" : "development",
  },
});
