---
title: "Reading guide & site map"
description: "How this doksite is organised: reading order, the numbering scheme, how citations and cross-links behave, and how to install it as an offline app."
---

<div class="sec-head">
<span class="chip chip-kind">Orientation</span>
<span class="chip">Before section 1</span>
<span class="chip">14 numbered sections</span>
</div>

<details class="ga-map" open>
	<summary class="ga-map-summary">
		<span class="ga-map-kicker">Section map</span>
		<span class="ga-map-meta">7 sections</span>
	</summary>
	<ol class="ga-map-list">
		<li class="ga-map-item">
			<a class="ga-map-link" href="#s0-1"><span class="ga-map-num">0.1</span><span class="ga-map-ttl">What this doksite is</span></a>
		</li>
		<li class="ga-map-item">
			<a class="ga-map-link" href="#s0-2"><span class="ga-map-num">0.2</span><span class="ga-map-ttl">The fourteen sections</span></a>
		</li>
		<li class="ga-map-item">
			<a class="ga-map-link" href="#s0-3"><span class="ga-map-num">0.3</span><span class="ga-map-ttl">Suggested reading order</span></a>
		</li>
		<li class="ga-map-item">
			<a class="ga-map-link" href="#s0-4"><span class="ga-map-num">0.4</span><span class="ga-map-ttl">How citations and cross-links work</span></a>
		</li>
		<li class="ga-map-item">
			<a class="ga-map-link" href="#s0-5"><span class="ga-map-num">0.5</span><span class="ga-map-ttl">How the site itself is built</span></a>
		</li>
		<li class="ga-map-item">
			<a class="ga-map-link" href="#s0-6"><span class="ga-map-num">0.6</span><span class="ga-map-ttl">Install it as an app (PWA)</span></a>
		</li>
		<li class="ga-map-item">
			<a class="ga-map-link" href="#s0-7"><span class="ga-map-num">0.7</span><span class="ga-map-ttl">Regenerating this site</span></a>
		</li>
	</ol>
</details>
<a id="s0-1" aria-hidden="true"></a>

## `0.1` What this doksite is

GapAtlas 2026 is the published form of a multi-agent research engagement: an exhaustive gap analysis of Islamic fintech, converted into ten institutional-grade startup blueprints, and then into this documentation site. Everything you read here is derived from a single research corpus in `reports/` — nothing was re-written for the web except numbering, structure and cross-links.

Headings are numbered with a `0.` prefix on this page because it is orientation material that sits *before* section 1. Every other page uses its own section number.

<a id="s0-2" aria-hidden="true"></a>

## `0.2` The fourteen sections

| Section | Page | What it answers |
|---|---|---|
| **1** | [Master Report](/01-master-report/) | How were the ten gaps derived, what was rejected and why, and what does the portfolio look like? |
| **2** | [Gap 01 — JuzSukuk](/02-gap-01-juzsukuk/) | Fractional tokenised retail sukuk: lowering the $200,000 institutional ticket to $1,000 |
| **3** | [Gap 02 — SanadFlow](/03-gap-02-sanadflow/) | Automated-murabaha SME supply-chain finance anchored on large buyers |
| **4** | [Gap 03 — HalalPort](/04-gap-03-halalport/) | Multi-standard halal brokerage with embedded purification |
| **5** | [Gap 04 — AmanPayung](/05-gap-04-amanpayung/) | Parametric micro-takaful with instant climate payouts |
| **6** | [Gap 05 — WaqfTrace](/06-gap-05-waqftrace/) | Non-custodial zakat and waqf audit plus CWLS tracking |
| **7** | [Gap 06 — AdlScore](/07-gap-06-adlscore/) | Sharia P2P lending and AI alternative credit scoring on partner rails |
| **8** | [Gap 07 — SiratRemit](/08-gap-07-siratremit/) | Shariah-screened stablecoin remittance across GCC → South Asia |
| **9** | [Gap 08 — FiqhStack](/09-gap-08-fiqhstack/) | AI Shariah governance engine and screening API for licensed institutions |
| **10** | [Gap 09 — QistHalal](/10-gap-09-qisthalal/) | Halal BNPL and diaspora auto *ijara* leasing |
| **11** | [Gap 10 — TayyibLedger](/11-gap-10-tayyibledger/) | Green halal sukuk and an ESG MRV ledger for manufacturing SMEs |
| **12** | [LLM Usage & Cost Intelligence](/12-llm-usage-and-cost-analysis/) | What the research pipeline consumed, and what frontier models cost |
| **13** | [References](/13-references/) | Every cited source, plus the 1,764-entry authoritative source registry |
| **14** | [Site Build Report](/14-site-build-report/) | What it cost to build this site, on every candidate model |

<a id="s0-3" aria-hidden="true"></a>

## `0.3` Suggested reading order

1. **Decision-makers:** section 1 (§1.1–1.4), then section 14 (§14.1 and §14.10–14.12).
2. **Founders and operators:** section 1 in full, then the blueprint for your venture (sections 2–11) — §1.13 (VC memo) and §1.14 (self-audit) are the honest parts.
3. **Analysts and due diligence:** sections 2–11 in order, then section 13 to check any claim against its primary source.
4. **Engineers:** section 8 (FiqhStack) for the B2B infrastructure play, section 12 for pipeline telemetry, section 14 for build and cost engineering.

<a id="s0-4" aria-hidden="true"></a>

## `0.4` How citations and cross-links work

Every empirical claim carries an inline, year-tagged citation that links to the primary source — for example a sukuk market figure appears as a `[2025]` link into S&P Global Ratings. Three navigation aids sit on top of those links:

- **`index ↗`** under each reference bullet in sections 1–12 jumps to that source in the [collected reference index](/13-references/reference-index/).
- **`cited in §1.16`** on an index entry jumps back to the section that cites it.
- **`registry ↗`** appears when the same URL also exists as an entry in the [authoritative source registry](/13-references/source-registry/).

Section-level section anchors are stable and human-readable: `/01-master-report/#s1-13` is §1.13.

<a id="s0-5" aria-hidden="true"></a>

## `0.5` How the site itself is built

- **Numbered headings everywhere.** The centre pane, the right-pane contents list and the mobile contents sheet all show the same number, because the number is part of the heading text rather than decoration.
- **Reading-first layout.** The centre reading pane is the widest column (`58rem`); the left navigation and right contents panes are deliberately narrow (`16rem`) but never cramped.
- **Nothing scrunches.** Tables keep a readable minimum column width and scroll sideways when they overflow; Mermaid diagrams render at natural size inside a horizontally scrollable panel instead of being scaled down until the labels stop being legible.
- **Everything is offline-capable.** The site installs as an app and precaches every page, stylesheet, script, font and icon at install time.

<a id="s0-6" aria-hidden="true"></a>

## `0.6` Install it as an app (PWA)

| Platform | How |
|---|---|
| **Desktop Chrome / Edge** | Install icon in the address bar, or menu → *Install GapAtlas 2026* |
| **Android** | Browser menu → *Add to Home screen* / *Install app* |
| **iOS / iPadOS Safari** | Share → *Add to Home Screen* |

Once installed the site runs in a standalone window with a burger menu for navigation, cached search, and every previously precached page available with no network. Fonts are bundled locally, so there are no third-party requests at all.

<a id="s0-7" aria-hidden="true"></a>

## `0.7` Regenerating this site

The site is reproducible from the research corpus:

```sh
bun install
bun run build     # regenerates content, assets and the build report, then builds
bun run dev       # same, plus a dev server
```

`scripts/build-docs.mjs` converts the research documents into numbered Starlight pages and rebuilds the references section from every citation it finds; `scripts/build-assets.mjs` regenerates the favicon, PWA icons and social card from the theme palette; `scripts/build-report.mjs` measures the repository and rewrites section 14. No research text is hand-copied into the site.
