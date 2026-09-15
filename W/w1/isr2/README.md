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
| `bun run titles` | Re-fetch source page titles for §13 (resumable, cache-backed, never part of a build) |
| `bun run check` | Audit the built site: internal links, fragments, Mermaid, and every retired URL over HTTP |
| `bun run check:redirects` | Just the retired-URL check: serves `dist/` and follows each old path |
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
scripts/build-docs.mjs       research corpus → numbered docs + the §13 reference ledger
scripts/build-report.mjs     measures the repo and writes section 14
scripts/section-map.mjs      the numbered contents panel under every page header
scripts/accents.mjs          which accent hue each section kind gets
scripts/source-key.mjs       the one URL normaliser the pipeline and title fetcher share
scripts/fetch-source-titles.mjs  fetches source page titles into a committed cache
scripts/build-assets.mjs     favicon, icons and OG image from the theme palette
src/data/source-titles.json  cached page titles for 1,650 sources
src/plugins/external-links.mjs   opens external links in a new window
scripts/check-links.mjs      internal link + fragment audit over dist/
scripts/check-diagrams.mjs   Mermaid syntax audit over the content tree
scripts/check-redirects.mjs  serves dist/ and follows every retired URL over HTTP
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

## The section map under every header

Immediately under each page header sits a numbered map of that page's own
headings — `1.1`, `1.2`, `1.2.1` … — as links that jump straight to the section.

It exists because Starlight's right-hand “On this page” pane is `display: none`
below 72rem. That is the width of an installed PWA on a phone, so without the map
the only wayfinding left there is the collapsed dropdown in the nav bar. The map
is plain HTML inside the content pane — never in the hidden aside — so it is
present at every width with no JavaScript, and it starts expanded while still
being collapsible by the reader.

Structure: numbered `##` entries as cards (two columns once there is room), each
with its numbered `###` parts as inline chips. Generating it needed no
slug-guessing, because the map links to anchors this build already emits: `#s1-13`
for a `##` heading and `#s1-13-2` for a `###` heading. Pages with fewer than four
headings get no map — a one-line contents list is noise.

`scripts/section-map.mjs` builds it and is shared by both generators, so section
14 gets the same panel as sections 1–12. The reading guide is hand-authored,
but `bun run generate` still rebuilds its map from the headings above it, and
`bun run audit` fails if any map drifts from the headings it points at.

## Section 13 — one ledger, three subsections

| | |
|---|---|
| [13.1](/13-references/) | How the reference system works: vocabulary, coverage, totals |
| [13.2](/13-references/source-registry/) | The authoritative source registry, by institutional category |
| [13.3](/13-references/cited-sources/) | Citations the registry pass never picked up, by citing section |

Every source is listed **exactly once**. The corpus registry holds 1,764 rows for
1,548 URLs — 216 rows repeat a URL that was already listed — and 124 of those
URLs are also cited by the research, so the old build printed those sources
twice: once in a collected citation index and again in the registry. §13 now
reads the registry once into a ledger keyed by normalised URL, and the row that
results carries its first registry number (`#r118`), any other numbers it was
listed under, its institutional category, and every section that cites it. The
102 cited sources the registry never reached live in §13.3 instead of being
duplicated across both.

`scripts/fetch-source-titles.mjs` resolves a name in five descending steps and
caches it in `src/data/source-titles.json`. The build reads the cache, so
building stays offline, fast and deterministic.

1. **The page's own metadata** — `citation_title` and Dublin Core first (journal
   platforms put the article's verbatim name there), then `og:title`,
   `twitter:title`, `<title>`, `<h1>`.
2. **The sibling landing page**, when the URL is a download endpoint:
   `/article/download/975/529` → `/article/view/975`. This is where an Open
   Journal Systems install keeps the metadata that the download itself does not
   carry, and it recovered 53 titles on its own.
3. **PDF metadata** — XMP `<dc:title>` at the head, the `/Info` dictionary at the
   tail, via two range requests (never the whole file).
4. **The readable part of the URL path**, with a leading record id stripped
   (`/publication/393602359_A_Proposed_…` → `A Proposed …`).
5. **Citation context** — last resort, dropped when it does not read like a
   title; the old list contained fragments such as `(excessive uncertainty) and`.

A site that answers the honest bot user-agent with a 403/429/503 gets one retry
as a browser. Anything generic — `Just a moment...`, `Home`, `Overview`,
`Announcements`, `Press Release`, `404 Not Found` — counts as no title at all,
so the row shows its domain instead of noise. The build re-validates every
cached title **as it will be printed** (`DFSA | DFSA` only degrades to the
two-word `DFSA DFSA` once the pipe is stripped for display) and trims a trailing
colon as the mark of a navigational label (`Pakistan (SECP):` →
`Pakistan (SECP)`).

**1,295 of the 1,548 registry rows**, and 102 of the 102 §13.3 citations, now
print a real page title — **1,397 of the 1,650 sources**. Of the 275 that remain
untitled, 163 are download endpoints and bare PDFs with no title anywhere to
read, 46 answer a bot with a 403, 33 close the socket, 13 are dead links, and the
rest time out or have broken TLS. All of them are retried by `bun run titles`,
which is resumable and skips whatever is already cached.

Every external link opens in a new window (`target="_blank"` plus
`rel="noopener noreferrer"`), so tapping a primary source in an installed PWA
does not lose the page being read.

## Content pipeline

`bun run generate` runs three scripts in order:

1. **`build-docs.mjs`** — strips each research document's own table of contents,
   renumbers headings into the site scheme, extracts every citation, folds the
   corpus registry into the deduplicated §13 ledger, and writes the numbered
   pages plus the three reference subsections.
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
the theme CSS, the manifest and the generated precache list — 431 checks:

- **Palette contrast** — WCAG 2.1 ratios with real alpha compositing, for every
text/background pair in both colour schemes, plus the Mermaid node palette.
- **Heading integrity** — every heading carries a number, numbers are unique and
  share one section prefix, no levels are skipped, and the right-hand contents
  pane mirrors the same numbers with no dead fragment.
- **Section map** — present on every page with four or more headings, expanded
  rather than collapsed, listing exactly the same numbers as the headings, with
  every link resolving and the panel placed in the content pane (never the aside
  that is hidden below 72rem), plus a check that Starlight really does hide that
  pane — the premise the panel exists for.
- **Reference ledger** — the three §13 subsections exist, no source URL is listed
  twice anywhere in them, the ledger covers every cited source, no anchor is
  nested inside another anchor (which silently re-points a row), every printed
  title reads like a title (the cache predates the quality rule, so this is what
  stops `Announcements` coming back as the name of a source), the majority of
  rows name their source rather than falling back to a bare domain, and every
  external link in the built site carries `target="_blank"` with `rel="noopener"`.
  Redirect pages are excluded from the layout checks by construction (a meta
  refresh has no headings) but are verified separately: every retired §13 URL
  must point at a page that actually exists in `dist/`.
- **Overflow discipline** — tables, diagrams and code become their own scroll
  containers with a readable minimum column width instead of being squeezed.
- **Responsive maths** — Starlight's pane arithmetic reproduced exactly, showing
  centre/left/right widths and the reading measure from 1920px down to 390px. It
  asserts the centre pane stays widest, the measure stays comfortable at every
  breakpoint (including the 50–82rem squeeze zone, where both side panes narrow to
  14rem), and that the contents pane never grows past its own list: at 1920px the
  centre pane is 1408px opposite a 256px contents pane, where Starlight's default
  would have left ~200px of the pane empty.
- **PWA / standalone** — icons at their declared pixel sizes, a 1200×630 social
  card, every precached URL resolves (a missing entry would break install), and
  safe-area/burger-menu rules exist for installed mode.
- **Shipped CSS** — the layout, overflow, focus and accent rules are re-checked
  against the minified `dist/_astro/*.css`, since a source rule that never ships
  is not a rule.
- **Accents** — every section-kind chip carries a hue, the theme defines an
  `.acc-` class and all three colour roles (`ink`, `text`, `soft`) for each of
  the five hues, and the accent rules survive minification into the shipped
  bundle. A chip whose class does not exist renders as a plain grey pill, which
  is exactly the regression this catches.

## Retired §13 URLs

Section 13 used to be nine pages — a landing page, a collected citation index, a
registry hub and one page per institutional category. Astro's `redirects` cannot
send a wildcard to a fixed destination in a prerendered site, so
`astro.config.mjs` lists the shapes we have reason to believe existed and sends
each to the page that replaced it:

| Retired | Now |
|---|---|
| `/13-references/reference-index/` | `/13-references/` |
| `/13-references/source-registry/<category>/` (7 slugs) | `/13-references/source-registry/` |

Each becomes a small no-JS meta-refresh page carrying a real `<a>` and
`rel=canonical`, so old links, bookmarks and crawlers all land somewhere sane,
the redirects are precached by the service worker, and Pagefind leaves them out
of the search index (18 indexed pages, 8 redirect pages).

`bun run check:redirects` proves it over real HTTP rather than by trusting the
files on disk: it stands up a static server on `dist/`, requests each old path,
reads the destination out of the meta refresh, follows it, and fails if anything
404s, chains through a second redirect, or lands somewhere other than the page
named in the config. Astro emits redirects as a meta refresh rather than an HTTP
3xx, so a plain `curl -L` would never notice a broken one.

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
schemes, the wide-centre / narrow-side layout (`68rem` reading pane, `16rem`
panes either side), glow-numbered headings, and the rules that keep wide tables
and diagrams horizontally scrollable with a readable minimum column width.

From 72rem up it also overrides two Starlight defaults: the contents pane keeps
its own width instead of growing to absorb the space a narrow centre pane leaves
over, and the centre pane takes the remainder with the reading measure centred
inside it. On a 1920px display that turns roughly 200px of empty contents pane
into reading width.

### Accents

The palette is bluish-green at heart — cyan and spring green carry the structure
— with three accent hues beside it (violet, amber, rose). Each **kind of
section** owns one hue, assigned in `scripts/accents.mjs` so every generator
agrees:

| Hue | Section kind |
|---|---|
| cyan | the master report |
| spring green | the ten gap blueprints |
| violet | research cost intelligence |
| amber | the reference ledger |
| rose | the site build report |

The hue is applied as `.acc-<name>`, which sets `--acc-ink` (borders and glow),
`--acc-text` (the contrast-safe label colour) and `--acc-soft` (the wash behind
it). The section chip, the home-page card's top hairline, its number, and the
home-page stat numbers all read those three variables, so a section keeps the
same colour wherever it appears. `theme.css` is the only place that knows the
actual values, and the audit checks all ten label/ink pairs against the panel in
both colour schemes for WCAG contrast.

The rest of the spectrum is used sparingly: the `h2` underline, the `hr`, the
top rule of every table and diagram panel, the primary button and the scrollbar
thumb are accent sweeps, and the stat numbers on the home page cycle through all
five hues.
