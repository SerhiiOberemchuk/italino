import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)),
    "server-only": fileURLToPath(new URL("./tests/empty.ts", import.meta.url)),
    "client-only": fileURLToPath(new URL("./tests/empty.ts", import.meta.url)) } },
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], include: ["tests/**/*.test.{ts,tsx}"] },
  oxc: { jsx: { runtime: "automatic" } },
});
