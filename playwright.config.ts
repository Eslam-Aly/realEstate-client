import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config({ path: ".env.e2e" });

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: process.env.BASE_URL,
    headless: true,
  },
});
