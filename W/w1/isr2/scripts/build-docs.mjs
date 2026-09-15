#!/usr/bin/env node
/**
 * build-docs.mjs
 * ---------------------------------------------------------------------------
 * Converts the research corpus in ../reports into the numbered Starlight
 * content tree in src/content/docs, and builds the cross-linked "References"
 * section (13) out of every citation in that corpus plus the 850+ entry
 * authoritative source registry.
 *
 *   reports/master/00-master-report.md              -> 01-master-report
 *   reports/gap-blueprints/0X-gap-0X-*.md           -> 02..11-gap-XX-*
 *   reports/llm-cost-analysis/11-*.md               -> 12-llm-usage-and-cost-analysis
 *   (citations + registry)                          -> 13-references/*
 *
 * Section 14 (site build engineering report) is produced by build-report.mjs.
 *
 * Run with:  node scripts/build-docs.mjs   (wired into `bun run build`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPORTS = path.resolve(SITE, '..', 'reports');
const DOCS = path.join(SITE, 'src', 'content', 'docs');
const DATA = path.join(SITE, 'src', 'data');

const REF_INDEX_URL = '/13-references/reference-index/';
const REGISTRY_URL = '/13-references/source-registry/';

/* ------------------------------------------------------------------ utils */

const read = (p) => fs.readFileSync(p, 'utf8');

/**
 * Section numbers are authored as `<span class="sn">` but emitted as inline
 * code: Astro collects table-of-contents text from mdast text nodes only, so
 * inline code keeps the number both rendered *and* visible in the right pane
 * and mobile ToC, while giving the number its own styled chip.
 */
const snToCode = (text) =>
	text.replace(/<span class="sn">([^<]+)<\/span>/g, '`$1`');

function writeFile(absPath, contents) {
	fs.mkdirSync(path.dirname(absPath), { recursive: true });
	fs.writeFileSync(absPath, snToCode(contents));
	console.log(`  + ${path.relative(SITE, absPath)}`);
}

const yaml = (v) => JSON.stringify(v);

/** Collapse the same source cited twice (trailing slash, protocol, www, #). */
function normUrl(raw) {
	return String(raw)
		.trim()
		.replace(/\\+$/, '')
		.replace(/&amp;/g, '&')
		.replace(/#.*$/, '')
		.replace(/^https?:\/\//i, '')
		.replace(/^www\./i, '')
		.replace(/\/+$/, '')
		.replace(/[.,;]+$/, '')
		.toLowerCase();
}

function hostOf(raw) {
	try {
		return new URL(String(raw).trim()).hostname.replace(/^www\./, '');
	} catch {
		return String(raw)
			.replace(/^https?:\/\//i, '')
			.split('/')[0];
	}
}

function shortHash(input) {
	let h = 5381;
	for (let i = 0; i < input.length; i++)
		h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
	return h.toString(36).padStart(6, '0').slice(-6);
}

const refAnchor = (url) => `ref-${shortHash(normUrl(url))}`;

/** Remove inline markdown so a string can be used as link text / YAML value. */
function clean(text, max = 220) {
	const out = String(text)
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[*_`~|]/g, '')
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (out.length <= max) return out;
	return `${out.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

const attr = (text) =>
	String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Link that is immune to parentheses / pipes / pipes inside URLs. */
const link = (text, href) => `<a href="${attr(href)}">${attr(text)}</a>`;

/** Section anchor label, e.g. s1-16 -> 1.16 */
const anchorLabel = (anchor) => anchor.replace(/^s(\d+)-(\d+)$/, '$1.$2');

function firstParagraph(lines) {
	for (const line of lines) {
		const t = line.trim();
		if (!t) continue;
		if (/^(#|>|\||-|\*|\d+\.|```|:::|---|<a |<div)/.test(t)) continue;
		return clean(t);
	}
	return '';
}

/**
 * Extracts markdown links from a single line, honouring balanced parentheses
 * inside destinations (e.g. .../islamic-fintech-(gift)-report-2025-26).
 */
function linksInLine(line) {
	const found = [];
	let i = 0;
	while ((i = line.indexOf('](', i)) !== -1) {
		const start = i + 2;
		if (line[start] !== 'h' || !/^https?:\/\//i.test(line.slice(start, start + 8))) {
			i += 2;
			continue;
		}
		let depth = 1;
		let j = start;
		while (j < line.length && depth > 0) {
			const ch = line[j];
			if (ch === '(') depth++;
			else if (ch === ')') depth--;
			if (depth === 0) break;
			j++;
		}
		const url = line.slice(start, j);
		// text = nearest [ ... ] before the "]("
		let textAt = i;
		let t = i;
		while (t >= 0 && line[t] !== '[') t--;
		textAt = t;
		const text = textAt >= 0 ? line.slice(textAt + 1, i) : '';
		found.push({ url, text });
		i = j + 1;
	}
	return found;
}

/* ---------------------------------------------------------------- sections */

const gapFiles = fs
	.readdirSync(path.join(REPORTS, 'gap-blueprints'))
	.filter((f) => f.endsWith('.md'))
	.sort();

const gaps = gapFiles.map((file, i) => {
	const raw = read(path.join(REPORTS, 'gap-blueprints', file));
	const h1 = (raw.match(/^#\s+(.*)$/m) || [, ''])[1];
	const m = h1.match(/^Gap\s+(\d+)\s+—\s+([^:]+):\s*(.*)$/);
	const name = m ? m[2].trim() : file.replace(/\.md$/, '');
	const rest = m ? m[3].trim() : '';
	const num = m ? Number(m[1]) : i + 1;
	return {
		file: path.join('gap-blueprints', file),
		n: num + 1,
		slug: `${String(num + 1).padStart(2, '0')}-gap-${String(num).padStart(2, '0')}-${name.toLowerCase()}`,
		kind: 'Gap Blueprint',
		title: `Gap ${String(num).padStart(2, '0')} — ${name}`,
		headline: rest,
		name,
	};
});

const SECTIONS = [
	{
		file: 'master/00-master-report.md',
		n: 1,
		slug: '01-master-report',
		kind: 'Master Report',
		title: 'Master Report',
		headline: 'Islamic Fintech Gap Analysis & Startup Blueprint (2026 Edition)',
		summary:
			'How the top 10 monetizable gaps in Islamic fintech were derived from 1,764 authoritative sources: discovery methodology, the disqualified-gap log, per-gap decision rationale, ecosystem and regulatory benchmarks, funding channels, portfolio construction, and a full self-audit.',
	},
	...gaps.map((g) => ({
		...g,
		summary: `Institutional-grade blueprint for ${g.name} — ${g.headline}. Feasibility, unit economics, moats, competitor mapping, zero-cost MVP architecture, go-to-market, risk register and gating scores.`,
	})),
	{
		file: 'llm-cost-analysis/11-llm-usage-and-cost-analysis.md',
		n: 12,
		slug: '12-llm-usage-and-cost-analysis',
		kind: 'Cost Intelligence',
		title: 'LLM Usage & Cost Intelligence',
		headline: 'Research Pipeline Telemetry, Rate Cards & CFO Briefing',
		summary:
			'Execution telemetry for the research pipeline (34 subagents, 4.65M billable tokens, $6.58 direct compute), top-10 US and top-10 China frontier rate cards, cross-border arbitrage benchmarks and an enterprise scaling financial model.',
	},
	{
		file: null,
		n: 13,
		slug: '13-references',
		kind: 'References',
		title: 'References',
		headline: 'Collected Citations & Authoritative Source Registry',
		summary:
			'Every source cited anywhere in the research, collected into one de-duplicated, cross-linked index, together with the 850+ entry Authoritative Source Registry split across its seven institutional categories.',
	},
	{
		file: null,
		n: 14,
		slug: '14-site-build-report',
		kind: 'Engineering & Cost',
		title: 'Site Build Report',
		headline: 'Build Telemetry, Token Metrics & Executive Cost Briefing',
		summary:
			'What it cost to engineer this documentation site: the measured build surface, a modelled token flow, live BenchLM rate cards for the top 10 US and top 10 China models, sorted what-if cost scenarios and an executive briefing for the EM, CFO, CTO and CEO.',
	},
];

/* ------------------------------------------------------------------ parser */

const LINK_REWRITES = [
	[/\]\(800-authoritative-sources-registry\.md\)/g, `](${REGISTRY_URL})`],
	[/\]\(\.\.\/master\/800-authoritative-sources-registry\.md\)/g, `](${REGISTRY_URL})`],
];

function processDoc({ raw, section }) {
	const lines = raw.split('\n');
	const out = [];
	let m = 0;
	let k = 0;
	let inToc = false;
	let inRefs = false;
	let refBlock = [];

	for (let line of lines) {
		const h1m = line.match(/^#\s+(.*)$/);
		if (h1m) continue; // page title comes from frontmatter

		if (/^##\s+Table of Contents\s*$/i.test(line)) {
			inToc = true;
			continue;
		}

		const h2m = line.match(/^##\s+(?:(\d+)\.\s*)?(.*)$/);
		if (inToc) {
			if (!h2m) continue;
			inToc = false;
		}

		if (h2m) {
			m = h2m[1] ? Number(h2m[1]) : m + 1;
			k = 0;
			inRefs = /^(master\s+)?references$/i.test(clean(h2m[2], 80));
			refBlock = [];
			out.push(`<a id="s${section.n}-${m}" aria-hidden="true"></a>`);
			out.push('');
			out.push(`## <span class="sn">${section.n}.${m}</span> ${h2m[2].trim()}`);
			continue;
		}

		const h3m = line.match(/^###\s+(.*)$/);
		if (h3m) {
			k += 1;
			out.push(`### <span class="sn">${section.n}.${m}.${k}</span> ${h3m[1].trim()}`);
			continue;
		}

		for (const [re, to] of LINK_REWRITES) line = line.replace(re, to);
		if (inRefs) refBlock.push(line);
		out.push(line);
	}

	return { body: out.join('\n'), refBlock: refBlock.join('\n') };
}

/* ------------------------------------------------------------- citations */

const citations = new Map(); // normUrl -> entry
const registryByUrl = new Map(); // normUrl -> { category, entry, cited[] }

/** Field labels / rubric headings in this corpus that make useless titles. */
const BOILERPLATE =
	/^(how arrived at|decision rationale|precise formulation|narrative hook|signals?|key signals?|key insight|monetization|monetization clarity( score)?|monetization score|regulatory friction score|evidence( base)?|rationale|notes?|score|valuation|target valuation benchmark|salvage valuation benchmark|market size|gap definition|why it exists|root cause|primary geography|examples?|implication|takeaway|sources?|mitigation|etymology|brand positioning|operational trap|cash flow break-even|ltv \/ cac ratio|key pitch deck proof points|strategic acquirers|payback period|architecture|malaysia|indonesia|pakistan|united arab emirates|united kingdom|united states|saudi arabia|bahrain|signal|thesis)\s*:?\s*$/i;

const isJunkTitle = (t) =>
	!t ||
	BOILERPLATE.test(t) ||
	/^(19|20)\d\d$/.test(t) ||
	/^https?:/i.test(t) ||
	/^[\d\s\W]+$/.test(t);

/**
 * Best available human label for a source, in order of trust:
 * italicised document title > bold lead-in > link text > domain.
 */
function titleCandidate({ line, text }) {
	// only trust an italicised document title when the line cites one source
	const linkCount = linksInLine(line).length;
	const italics =
		linkCount === 1
			? (line.match(/(?<!\*)\*([^*\n]{8,160})\*(?!\*)/g) || [])
					.map((raw) => clean(raw))
					.filter((t) => !isJunkTitle(t) && t.length > 12)
					.sort((a, b) => b.length - a.length)
			: [];
	if (italics[0]) return { text: italics[0], score: 4 };

	for (const raw of line.match(/\*\*(.+?)\*\*/g) || []) {
		const t = clean(raw);
		if (!isJunkTitle(t) && t.length > 3) return { text: t, score: 3 };
	}

	const t = clean(text);
	if (!isJunkTitle(t) && t.length > 3) return { text: t, score: 2 };
	return null;
}

function trackCitation({ url, text, doc, line, anchor }) {
	const key = normUrl(url);
	if (!key) return;
	let entry = citations.get(key);
	if (!entry) {
		entry = {
			key,
			url,
			title: '',
			titleScore: 0,
			years: new Set(),
			host: hostOf(url),
			citedIn: [],
			order: citations.size,
		};
		citations.set(key, entry);
	}
	const candidate = titleCandidate({ line, text });
	if (candidate && candidate.score > entry.titleScore) {
		entry.title = candidate.text;
		entry.titleScore = candidate.score;
	}
	if (/^(19|20)\d\d$/.test(text.trim())) entry.years.add(text.trim());
	if (!entry.citedIn.some((c) => c.anchor === anchor && c.slug === doc.slug))
		entry.citedIn.push({ slug: doc.slug, n: doc.n, title: doc.title, anchor });
}

function collectCitations(body, doc) {
	let anchor = null;
	for (const line of body.split('\n')) {
		const a = line.match(/^<a id="(s\d+-\d+)"/);
		if (a) {
			anchor = a[1];
			continue;
		}
		if (!anchor) continue;
		for (const { url, text } of linksInLine(line)) {
			trackCitation({ url, text, doc, line, anchor });
		}
	}
}

/* ------------------------------------------------------------------- build */

console.log('▸ building numbered docs from the research corpus');

fs.rmSync(path.join(DOCS, 'guides'), { recursive: true, force: true });
fs.rmSync(path.join(DOCS, 'reference'), { recursive: true, force: true });
fs.rmSync(path.join(DOCS, '13-references'), { recursive: true, force: true });

const manifest = [];

for (const section of SECTIONS) {
	if (!section.file) continue;
	const raw = read(path.join(REPORTS, section.file));
	const { body, refBlock } = processDoc({ raw, section });
	const words = body.split(/\s+/).filter(Boolean).length;

	// every reference bullet gets a back-link into the collected index
	const annotatedRefs = refBlock
		.split('\n')
		.map((line) => {
			if (!line.trim().startsWith('-')) return line;
			const first = linksInLine(line)[0];
			if (!first) return line;
			return `${line} <a class="xref" href="${REF_INDEX_URL}#${refAnchor(first.url)}" title="Open this source in the collected reference index">index&nbsp;↗</a>`;
		})
		.join('\n');

	const fullBody = refBlock ? body.replace(refBlock, () => annotatedRefs) : body;
	const citeCount = new Set(
		linksInLine(raw.replace(/\n/g, ' ')).map((l) => normUrl(l.url))
	).size;

	const front = [
		'---',
		`title: ${yaml(`${section.n} · ${section.title}`)}`,
		`description: ${yaml(clampText(firstParagraph(fullBody.split('\n')) || section.summary))}`,
		'---',
		'',
		'<div class="sec-head">',
		`<span class="chip chip-kind">${section.kind}</span>`,
		`<span class="chip">Section ${section.n} of 14</span>`,
		`<span class="chip">${words.toLocaleString('en-US')} words</span>`,
		`<span class="chip">${citeCount} cited sources</span>`,
		'</div>',
		'',
	].join('\n');

	writeFile(path.join(DOCS, `${section.slug}.md`), `${front}\n${fullBody}\n`);

	const doc = { ...section, words, citeCount };
	manifest.push(doc);
	collectCitations(fullBody, doc);
}

function clampText(text, max = 175) {
	if (text.length <= max) return text;
	return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

/* ------------------------------------------------------- registry parsing */

const CATEGORIES = [];
{
	const lines = read(
		path.join(REPORTS, 'master', '800-authoritative-sources-registry.md')
	).split('\n');
	let current = null;
	for (const line of lines) {
		const h = line.match(/^##\s+(.*)$/);
		if (h) {
			if (/^Table of Contents/i.test(h[1])) continue;
			const title = clean(h[1]);
			current = {
				title,
				short: title.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim(),
				entries: [],
				slug: title
					.toLowerCase()
					.replace(/\(.*?\)/g, '')
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-|-$/g, '')
					.slice(0, 64),
			};
			CATEGORIES.push(current);
			continue;
		}
		if (!current) continue;
		const m = line.match(/^(\d+)\.\s+\[([^\]]+)\]\s+(\S+)\s*$/);
		if (!m) continue;
		current.entries.push({
			n: Number(m[1]),
			domain: m[2].trim(),
			url: m[3].replace(/\\+$/, ''),
		});
	}
}

for (const cat of CATEGORIES) {
	for (const entry of cat.entries) {
		const key = normUrl(entry.url);
		if (!key || registryByUrl.has(key)) continue;
		registryByUrl.set(key, { category: cat, entry, cited: [] });
	}
}
for (const [key, value] of registryByUrl) {
	const cite = citations.get(key);
	if (cite) value.cited = cite.citedIn;
}

const totalRegistry = CATEGORIES.reduce((s, c) => s + c.entries.length, 0);
const totalDomains = new Set(
	CATEGORIES.flatMap((c) => c.entries.map((e) => e.domain))
).size;
const crosslinked = [...registryByUrl.values()].filter((v) => v.cited.length).length;

const citedInLabel = (list) =>
	list
		.map((c) => link(`§${anchorLabel(c.anchor)}`, `/${c.slug}/#${c.anchor}`))
		.join(' ');

/* ------------------------------------------- 13 · references landing page */

console.log('▸ building the references section');

const catRows = CATEGORIES.map(
	(c, i) =>
		`| **13.2.${i + 1}** | ${link(c.title, `/13-references/source-registry/${c.slug}/`)} | ${c.entries.length} | ${new Set(c.entries.map((e) => e.domain)).size} | ${c.entries.filter((e) => registryByUrl.get(normUrl(e.url))?.cited.length).length} |`
).join('\n');

writeFile(
	path.join(DOCS, '13-references', 'index.md'),
	`---
title: "13 · References"
description: "Every source cited in this research, collected into one cross-linked index and mapped onto the 850+ entry Authoritative Source Registry."
---

<div class="sec-head">
<span class="chip chip-kind">References</span>
<span class="chip">Section 13 of 14</span>
<span class="chip">${citations.size.toLocaleString('en-US')} unique cited sources</span>
<span class="chip">${totalRegistry.toLocaleString('en-US')} registry entries</span>
</div>

## <span class="sn">13.1</span> How this reference system works

Every empirical claim in this doksite is traceable to a live-retrieved primary source. To keep that traceability usable rather than decorative, all citations were lifted out of the twelve research documents and re-assembled here as three linked layers:

1. **The collected reference index (§13.1)** — every unique source cited anywhere in the corpus, de-duplicated by normalised URL, with the years and the section that cites it.
2. **The authoritative source registry (§13.2)** — the ${totalRegistry} primary sources discovered during the source-expansion phase, preserved in their original numbering and grouped into seven institutional categories.
3. **Bidirectional cross-links** — ${crosslinked} of the registry entries resolve to a section that actually cites them, and every reference bullet inside sections 1–12 links back into the index.

\`\`\`mermaid
graph LR
    A["Research sections<br/>1 to 12"] -->|cites| B["Citations deduplicated<br/>by normalised URL"]
    B --> C["13.1 Collected<br/>Reference Index"]
    A -->|"index backlink on<br/>every reference bullet"| C
    C -->|"registry match"| D["13.2 Authoritative<br/>Source Registry"]
    D -->|"cited in section"| A
    C -->|external link| E["Primary source<br/>on the open web"]
\`\`\`

### <span class="sn">13.1.1</span> Citation vocabulary used across the site

| Marker | Meaning |
|---|---|
| ${'`[2025]`'} / ${'`[2026]`'} | Inline citation carrying the publication year, linked to the primary source |
| ${'`index ↗`'} | Sits under every reference bullet and jumps to that source in §13.1 |
| ${'`cited in §1.16`'} | Sits on an index entry and jumps back to the citing section |
| ${'`registry ↗`'} | Shown when a cited URL also exists as an entry in §13.2 |

### <span class="sn">13.1.2</span> Section coverage

| Section | Document | Unique cited sources |
|---|---|---|
${manifest
	.map(
		(d) =>
			`| ${d.n} | ${link(`${d.title}${d.name ? '' : ` — ${d.headline}`}`, `/${d.slug}/`)} | ${d.citeCount} |`
	)
	.join('\n')}

## <span class="sn">13.2</span> Reference collections

| Ref | Collection | Entries | Domains | Cross-linked |
|---|---|---|---|---|
${catRows}
| | **All collections** | **${totalRegistry}** | **${totalDomains}** | **${crosslinked}** |

:::tip[Cross-linking works in both directions]
Every reference bullet in sections 1–12 carries an \`index ↗\` link into §13.1. Every entry in §13.1 links back to the section that cites it (\`cited in §…\`) and, where the same URL exists in the registry, straight into the matching §13.2 category page.
:::
`
);

/* ------------------------------------- 13.1 collected reference index page */

{
	const perDoc = new Map(manifest.map((d) => [d.slug, []]));
	for (const cite of citations.values()) {
		const primary = cite.citedIn[0];
		if (primary) perDoc.get(primary.slug)?.push(cite);
	}

	const blocks = manifest.map((doc) => {
		const list = (perDoc.get(doc.slug) || []).sort(
			(a, b) => a.host.localeCompare(b.host) || a.order - b.order
		);
		if (!list.length) return '';
		const items = list
			.map((cite) => {
				const reg = registryByUrl.get(cite.key);
				const years = [...cite.years].sort().join(', ');
				const bits = [
					`<a id="${refAnchor(cite.url)}" aria-hidden="true"></a>${link(cite.title || cite.host, cite.url)}`,
					years ? `\`${years}\`` : '',
					`\`${cite.host}\``,
					reg
						? link('registry ↗', `${REGISTRY_URL}${reg.category.slug}/#r${reg.entry.n}`)
						: '',
					cite.citedIn.length ? `cited in ${citedInLabel(cite.citedIn)}` : '',
				].filter(Boolean);
				return `- ${bits.join(' · ')}`;
			})
			.join('\n');
		return `### <span class="sn">13.1.${doc.n}</span> ${link(`${doc.n} · ${doc.title}`, `/${doc.slug}/`)}${doc.name ? ` — ${doc.name}` : ` — ${doc.headline}`}\n\n${items}`;
	});

	writeFile(
		path.join(DOCS, '13-references', 'reference-index.md'),
		`---
title: "13.1 · Collected Reference Index"
description: "${citations.size} unique sources cited across the Islamic fintech research corpus, de-duplicated and cross-linked back to the citing section and to the authoritative source registry."
---

<div class="sec-head">
<span class="chip chip-kind">Reference Index</span>
<span class="chip">${citations.size.toLocaleString('en-US')} unique sources</span>
<span class="chip">${totalRegistry.toLocaleString('en-US')} registry entries</span>
</div>

## <span class="sn">13.1.0</span> What this index contains

This index collects **every** external source cited by sections 1–12 — inline citations, benchmark anchors and the per-document \`Master References\` lists — into a single de-duplicated ledger. Entries are grouped by the section that cites them first and sorted by domain inside each group.

| | |
|---|---|
| Unique sources | **${citations.size.toLocaleString('en-US')}** |
| Registry entries in §13.2 | **${totalRegistry.toLocaleString('en-US')}** |
| Registry entries with a citing section | **${crosslinked.toLocaleString('en-US')}** |
| Sections indexed | **${manifest.length}** |

Each entry reads \`title · year · domain · registry ↗ · cited in §N.M\`. The \`§N.M\` link jumps straight to the citing section in the centre reading pane.

${blocks.filter(Boolean).join('\n\n')}
`
	);
}

/* -------------------------------------- 13.2 registry hub + category pages */

{
	const rows = CATEGORIES.map((c, i) => {
		const cited = c.entries.filter(
			(e) => registryByUrl.get(normUrl(e.url))?.cited.length
		).length;
		return `| **13.2.${i + 1}** | ${link(c.title, `/13-references/source-registry/${c.slug}/`)} | ${c.entries.length} | ${new Set(c.entries.map((e) => e.domain)).size} | ${cited} |`;
	}).join('\n');

	writeFile(
		path.join(DOCS, '13-references', 'source-registry', 'index.md'),
		`---
title: "13.2 · Authoritative Source Registry"
description: "The ${totalRegistry} primary sources discovered during the research source-expansion phase, grouped into seven institutional categories and cross-linked to the sections that cite them."
---

<div class="sec-head">
<span class="chip chip-kind">Source Registry</span>
<span class="chip">${totalRegistry.toLocaleString('en-US')} entries</span>
<span class="chip">7 categories</span>
</div>

## <span class="sn">13.2.0</span> Registry overview

The registry is the raw discovery ledger behind the research: every central-bank page, peer-reviewed article, rating-agency note, fintech filing and vendor rate card retrieved live during the 2025–2026 source-expansion pass. It is preserved here in full but split by institutional category, so that no single page has to carry the entire ledger.

| Ref | Category | Entries | Domains | Cited by a section |
|---|---|---|---|---|
${rows}
| | **All categories** | **${totalRegistry}** | **${totalDomains}** | **${crosslinked}** |

:::note[Reading the registry]
Entries keep their original registry number (\`#r1234\`) so they can be linked from anywhere on the site. Where an entry resolves to a URL that a research section cites, the entry shows a \`cited in §…\` link straight into that section.
:::

${link('→ Jump to the collected reference index (§13.1)', REF_INDEX_URL)}
`
	);

	CATEGORIES.forEach((cat, i) => {
		const items = cat.entries
			.map((e) => {
				const value = registryByUrl.get(normUrl(e.url));
				const cited = value?.cited || [];
				const back = cited.length ? ` · cited in ${citedInLabel(cited)}` : '';
				return `- <a id="r${e.n}" aria-hidden="true"></a><span class="reg-num">r${e.n}</span> ${link(`[${e.domain}]`, e.url)}${back}`;
			})
			.join('\n');

		writeFile(
			path.join(
				DOCS,
				'13-references',
				'source-registry',
				`${String(i + 1).padStart(2, '0')}-${cat.slug}.md`
			),
			`---
title: "13.2.${i + 1} · ${cat.title}"
description: "Authoritative source registry, category ${i + 1} of 7 — ${cat.entries.length} entries across ${new Set(cat.entries.map((e) => e.domain)).size} domains."
---

<div class="sec-head">
<span class="chip chip-kind">Registry 13.2.${i + 1}</span>
<span class="chip">${cat.entries.length} entries</span>
<span class="chip">${new Set(cat.entries.map((e) => e.domain)).size} domains</span>
</div>

${link('← Back to the registry overview', REGISTRY_URL)}

## <span class="sn">13.2.${i + 1}.0</span> ${cat.title}

Entries are preserved in their original registry order and numbering. Registry numbers are stable and directly linkable, e.g. \`#r${cat.entries[0]?.n ?? 1}\`.

${items}
`
		);
	});
}

/* --------------------------------------------------------------- metadata */

const stats = {
	generatedAt: new Date().toISOString().slice(0, 10),
	sections: SECTIONS.length,
	researchSections: manifest.length,
	uniqueCitations: citations.size,
	registryEntries: totalRegistry,
	registryDomains: totalDomains,
	registryCrosslinked: crosslinked,
	totalWords: manifest.reduce((s, d) => s + d.words, 0),
	registryCategories: CATEGORIES.map((c, i) => ({
		ref: `13.2.${i + 1}`,
		title: c.title,
		short: c.short,
		slug: `13-references/source-registry/${c.slug}`,
		count: c.entries.length,
	})),
};
writeFile(path.join(DATA, 'site-stats.json'), `${JSON.stringify(stats, null, '\t')}\n`);

writeFile(
	path.join(DATA, 'sections.json'),
	`${JSON.stringify(
		SECTIONS.map((s) => ({
			n: s.n,
			ref: String(s.n).padStart(2, '0'),
			slug: s.slug,
			kind: s.kind,
			title: s.title,
			headline: s.headline,
			name: s.name || null,
			summary: s.summary,
		})),
		null,
		'\t'
	)}\n`
);

console.log(
	`▸ done — ${manifest.length} research pages · ${citations.size} unique citations · ${totalRegistry} registry entries (${crosslinked} cross-linked)`
);
