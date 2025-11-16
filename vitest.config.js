import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    reporters: ["verbose"],
    exclude: [...configDefaults.exclude, "playwright/**"],
  },
});
