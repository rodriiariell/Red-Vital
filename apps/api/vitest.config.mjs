import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: [{ find: /^(\.{1,2}\/.*)\.js$/, replacement: "$1.ts" }] },
  plugins: [{
    name: "redvital-ts-esm-resolution",
    async resolveId(source, importer, options) {
      if (importer && source.startsWith(".") && source.endsWith(".js")) {
        return this.resolve(`${source.slice(0, -3)}.ts`, importer, { ...options, skipSelf: true });
      }
      return null;
    }
  }]
});
