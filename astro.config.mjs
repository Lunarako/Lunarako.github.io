// @ts-check
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// A fully static site for GitHub Pages: every page is built to HTML at build time.
// The deploy workflow (.github/workflows/deploy.yml) sets SITE_URL and BASE_PATH from the Pages settings.
// - A user site (<user>.github.io) has the base "/".
// - A project site (<user>.github.io/<repo>) has the base "/<repo>".
export default defineConfig({
  site: process.env.SITE_URL || "https://example.github.io",
  base: process.env.BASE_PATH || "/",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // E2E_FIXTURES=1 draws sample contribution counts instead of asking GitHub, and holds the page ground still.
    define: { "import.meta.env.E2E_FIXTURES": JSON.stringify(process.env.E2E_FIXTURES === "1") },
  },
  fonts: [
    {
      // Prose: sentences, the name and the about text. Labels, numbers and ASCII stay in Paper Mono.
      name: "Inter",
      cssVariable: "--font-inter",
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
    },
    {
      name: "Paper Mono",
      cssVariable: "--font-paper-mono",
      provider: fontProviders.local(),
      fallbacks: ["monospace"],
      // The metric fallback is local("Courier New"). Linux has no Courier New, so that face fails to load.
      optimizedFallbacks: false,
      options: {
        variants: [{ weight: "100 800", style: "normal", src: ["./src/assets/fonts/PaperMono-Variable.woff2"] }],
      },
    },
  ],
});
