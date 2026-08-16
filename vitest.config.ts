import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Multi-seed campaigns are deterministic but 5×2 full replays.
    testTimeout: 30_000,
  },
});
