import "@testing-library/jest-dom/vitest";

if (!import.meta.env.VITE_API_BASE) {
  import.meta.env.VITE_API_BASE = "https://api.test";
}
