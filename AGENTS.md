# AGENTS.md

glyph (GitHub Pages edition): an ASCII-style personal site, forked from https://github.com/Franvy/glyph.
An Astro site, built to static HTML and hosted on GitHub Pages. There is no server and no database.

Astro changes fast. Check the current docs (https://docs.astro.build) before you write Astro code from memory.

## Design
- Keep the ASCII / monospace visual language and the minimal style.

## Stack
- Astro 7, TypeScript strict, pnpm (`packageManager` pins the version).
- Output: static (no adapter). Images are optimised at build time (sharp).
- UI: .astro components, Tailwind v4 and plain CSS in src/styles. React only for islands.
- Content: src/lib/site.ts. src/lib/content.ts checks it with Zod at build time.
- Contribution calendar: GitHub GraphQL at build time (src/data/contributions.ts), with GITHUB_TOKEN.
- Weather: the browser asks Open-Meteo (src/components/weather.tsx). The place is site.weather.
- Project media: files in public/, paths in site.ts (src/lib/media.ts).
- Deploy: .github/workflows/deploy.yml, on push to main, once a day and by hand.
  It sets SITE_URL and BASE_PATH from the Pages settings.
- Tests: astro check, Vitest (src/lib only).

## Commands
pnpm dev                  # :4321
pnpm build                # static site in dist/
pnpm preview              # build, then serve dist/
pnpm check && pnpm test

## Code rules
- Every page is static. Do not add an adapter or server routes: GitHub Pages serves files only.
- Links to files in public/ go through import.meta.env.BASE_URL, so a project site (/<repo>/) works too.
- Use .astro components by default. Use a React island only when the reader must interact.
  Use client:visible. Use client:load only for an island that must listen before it is seen.
- src/lib must not import astro:*. Code that needs it goes in src/data.
- Validate all external data with Zod before you use it.
- Every page gets a title and a description through the Base layout.
- Give each image alt text.
- Secrets go in GitHub Actions secrets and a local .env (never committed). Add each new key name to .env.example.
  A secret must never reach the browser: read it only in build-time code (src/data, page frontmatter).

## Test rules
- Fixing a bug: first write a test that fails because of the bug, then fix it.
- New feature: write the failing test first, then the code.
- Do not change, skip or delete an existing test to make it pass. Change a test only when the behaviour it pins
  was meant to change, and say so.
- Tests must not depend on the content of src/lib/site.ts: use fixed fixtures.
- Unit tests: src/**/*.test.ts.
- After a UI change, look at it in a real browser before you say it is done.

## Writing
Code, comments and commit messages are in English.
For README, docs, commit messages, steps and user-facing text, write in the spirit of ASD-STE100:
- Short sentences. One idea per sentence. Steps are numbered imperatives.
- Active voice. Say who does what.
- One word, one meaning. Use simple words.
- In a warning, give the instruction first, then the reason.
- Do not remove facts to make it shorter.

An error says what happened and what to do next.
