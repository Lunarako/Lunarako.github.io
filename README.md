<div align="center">

# glyph (GitHub Pages edition)

An ASCII-style personal site. A pixel garden at the top changes with the real sky.

[English](README.md) · [简体中文](README.zh-CN.md)

</div>

This is a static fork of [glyph by franvy](https://github.com/Franvy/glyph). The original runs on a Cloudflare Worker
with a database. This edition builds to plain HTML, so GitHub Pages can host it for free.

## What it has

- **A banner that changes.** The pixel garden follows the phase of the moon, the Chinese festivals and, if you set a
  city, its live weather. The dark theme shows the night garden, the light theme the day garden.
- **The moon on the sides.** On a wide screen, tonight's pixel moon fills the left side and this lunar month the
  right side, one small moon a day. Point at a day to see its moon on the left. The lunar calendar is built at
  deploy time; the phase comes from the mean lunar month, so the lit share is shown with "≈".
- **A cat.** Meiqiu walks in the garden and in the footer. Hover or tap to pet it.
- **Your GitHub data.** The avatar and the contribution calendar come from your GitHub account.
- **Agent-friendly.** `/index.md` gives the home page as Markdown.

## What is different from the original

| Original | This edition |
|---|---|
| Content in a database, edited in `/admin` | Content in `src/lib/site.ts` |
| Weather from Caiyun or Open-Meteo, through the Worker | Weather from Open-Meteo, asked by the browser |
| Contribution calendar refreshed by the Worker | Contribution calendar read at build time; the site builds again every day |
| Page views and pets counted for all visitors | No page views; each visitor sees their own pets |
| Project drawings (isometric machines) and Duolingo streak | Removed: they showed the original author's projects and account |

## Make it yours

1. Create a repository named `<your-username>.github.io`. Push this code to its `main` branch.
2. Edit `src/lib/site.ts`: your GitHub username, name, email, about text, projects and skills.
   The city and the live weather are optional. Without them the page shows no place.
3. In the repository, open **Settings > Pages**. Set **Source** to **GitHub Actions**.
4. Push to `main`. The workflow `.github/workflows/deploy.yml` checks, builds and publishes the site.
   Your site is at `https://<your-username>.github.io`.

A repository with another name also works. The site is then at `https://<your-username>.github.io/<repo>`.
Change `repo` in `src/lib/site.ts` to match.

If the contribution calendar stays empty, add a secret named `CONTRIBUTIONS_TOKEN` in
**Settings > Secrets and variables > Actions**. A fine-grained token with no permissions is enough.
With your own token, private contributions count too.

In a public repository, GitHub turns off a scheduled workflow after 60 days without activity. The calendar then stops
updating until you push again or run the workflow by hand on the **Actions** tab.

## Run it locally

You need Node.js 24 and pnpm (`corepack enable` picks the version that the project pins).

```sh
pnpm install
pnpm dev        # http://localhost:4321
```

To see your contribution calendar locally, copy `.env.example` to `.env` and set `GITHUB_TOKEN`.

Before you push, run `pnpm check && pnpm test`.

## License

The code is under the [MIT License](LICENSE). Keep the `LICENSE` file and its copyright line when you copy the code.
The Paper Mono font is under the [SIL Open Font License](src/assets/fonts/PaperMono-OFL.txt).
The original author's avatar, personal content and third-party logos are not part of the license and are not in
this edition.
