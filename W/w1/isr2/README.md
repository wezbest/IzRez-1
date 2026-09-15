# GapAtlas 2026 — Islamic Fintech Gap Intelligence

An Astro + Starlight documentation site that publishes the Islamic fintech gap
research as fourteen numbered sections: the master report, ten startup
blueprints, the pipeline cost intelligence, a fully cross-linked references
section, and a build report covering this site's own engineering cost.

The site is a PWA: installable, offline-capable, with a versioned precache
manifest generated at build time.

## Commands

All commands run from this directory.

| Command | Action |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Generate content and start the dev server on `localhost:4321` |
| `bun run build` | Generate content, then build the static site into `./dist/` |
| `bun run preview` | Preview the production build locally |
| `bun run generate` | Regenerate content, assets and the build report only |
| `bun run check` | Audit the built site: every internal link, fragment and Mermaid diagram |
| `bun run audit` | Browser-free desktop + PWA layout audit over `dist/` (contrast, headings, overflow, pane maths, icons, precache, a11y) |
| `bun run verify` | `check` then `audit` — the full pre-deploy gate |

`dev` and `build` both run the generators first, so the site is always built
from the research corpus rather than from hand-edited copies of it.

## Where everything lives

```
../reports/                  research corpus (source of truth, never edited by the site)
src/content/docs/            generated + authored pages (14 numbered sections)
src/data/                    machine-readable sections, stats and build metrics
src/styles/theme.css         the "deep current" bluish-green reading theme
src/components/Head.astro    social images, PWA tags, service worker registration
src/integrations/pwa.mjs     emits sw-manifest.js after each build
public/                      favicon, PWA icons, OG card, service worker, offline page
scripts/build-docs.mjs       research corpus → numbered docs + references section
scripts/build-assets.mjs     favicon, icons and OG image from the theme palette
scripts/build-report.mjs     measures the repo and writes section 14
scripts/check-links.mjs      internal link + fragment audit over dist/
scripts/check-diagrams.mjs   Mermaid syntax audit over the content tree
scripts/audit-layout.mjs     desktop + installed-PWA layout audit over dist/
```

## How the numbering works

Sections are numbered `1`–`14`. Inside a section, `##` headings are numbered
`S.M` and `###` headings `S.M.K`, for example `1.13` and `14.3.1`. The number is
authored as inline code so that it stays part of the heading text — which means
the same number appears in the centre pane, the right-hand contents list and the
mobile contents sheet, and every one of those links jumps to the right heading.

Each `##` heading also carries a stable, hand-generated anchor
(`<a id="s1-13">` …), which is what the references section links back to. Run
`bun run check` after a build to verify that every one of those links and
fragments still resolves.

## Content pipeline

`bun run generate` runs three scripts in order:

1. **`build-docs.mjs`** — strips each research document's own table of contents,
   renumbers headings into the site scheme, extracts every citation, splits the
   1,764-entry registry by category, and writes the numbered pages plus the
   cross-linked references section.
2. **`build-assets.mjs`** — regenerates the favicon, PWA icons and the 1200×630
   social card from the theme palette. Text in the social card is converted to
   vector outlines with fontkit so it renders identically on machines without
   fonts installed.
3. **`build-report.mjs`** — measures the research corpus, the generated content
   and the hand-authored source, models the billable token flow, prices it
   against the live BenchLM rate cards for the top 10 US and top 10 China
   models, and rewrites section 14.

Editing files in `src/content/docs/` by hand is fine for the pages the pipeline
does not own (`index.mdx`, `reading-guide.md`), but the numbered research pages
are overwritten on every build.

## PWA

`/sw.js` precaches every page, stylesheet, script, font and icon listed in
`/sw-manifest.js` (written by the `pwa()` integration after each build). Cache
names carry a hash of that file list, so a new deploy purges the old cache on
activation. Navigations use stale-while-revalidate against the precache, static
assets are cache-first, and `/offline.html` is the last-resort fallback.

## Layout audit

The environment this was built in has no browser, so `bun run audit` verifies the
properties that decide whether a layout holds up, straight from the emitted HTML,
the theme CSS, the manifest and the generated precache list — 336 checks:

- **Palette contrast** — WCAG 2.1 ratios with real alpha compositing, for every
text/background pair in both colour schemes, plus the Mermaid node palette.
- **Heading integrity** — every heading carries a number, numbers are unique and
  share one section prefix, no levels are skipped, and the right-hand contents
  pane mirrors the same numbers with no dead fragment.
- **Overflow discipline** — tables, diagrams and code become their own scroll
  containers with a readable minimum column width instead of being squeezed.
- **Responsive maths** — Starlight's pane arithmetic reproduced exactly, showing
  centre/left/right widths and the reading measure from 1920px down to 390px. It
  asserts the centre pane stays widest and the measure stays comfortable at every
  breakpoint, including the 50–82rem squeeze zone where both side panes narrow to
  14rem.
- **PWA / standalone** — icons at their declared pixel sizes, a 1200×630 social
  card, every precached URL resolves (a missing entry would break install), and
  safe-area/burger-menu rules exist for installed mode.
- **Shipped CSS** — the layout, overflow and focus rules are re-checked against
  the minified `dist/_astro/*.css`, since a source rule that never ships is not a
  rule.

## Deploying

There is no `vercel.json`; the host is expected to be configured. The site lives
in the `isr2/` subdirectory and the build reads the research corpus from
`../reports`, so **the repository root must be used as the project root**:

| Setting | Value |
|---|---|
| Root Directory | repository root (the directory containing `reports/` and `isr2/`) |
| Install Command | `cd isr2 && bun install` |
| Build Command | `cd isr2 && bun run build` |
| Output Directory | `isr2/dist` |

Setting the Root Directory to `isr2` instead would exclude `../reports` from the
build upload, and the content pipeline would find nothing to convert.

## Theme

`src/styles/theme.css` holds the whole visual language: palette for both colour
schemes, the wide-centre / narrow-side layout (`58rem` reading pane, `16rem`
panes either side), glow-numbered headings, and the rules that keep wide tables
and diagrams horizontally scrollable with a readable minimum column width.
