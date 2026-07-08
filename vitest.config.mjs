import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const projectRoot = fileURLToPath(new URL("./", import.meta.url)).replace(/\\/g, "/");

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: `${projectRoot}/` }]
  },
  test: {
    environment: "node",
    include: ["tests/**/*.{test,spec}.ts", "tests/**/*.{test,spec}.tsx"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"]
  }
});
