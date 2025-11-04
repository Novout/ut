import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  target: ["node24"],
  minify: true,
  clean: true,
});
