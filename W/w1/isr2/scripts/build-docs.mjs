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
import { addSectionMap } from './section-map.mjs';
import { hostOf, normUrl } from './source-key.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPORTS = path.resolve(SITE, '..', 'reports');
const DOCS = path.join(SITE, 'src', 'content', 'docs');
const DATA = path.join(SITE, 'src', 'data');

/* Section 13 is one section with three subsections: 13.1 how the system works,
   13.2 the source registry by institutional category, and 13.3 the citations
   that fall outside the registry. Every source is listed exactly once across the
   three. */
const REFERENCES_URL = '/13-references/';
const REGISTRY_URL = '/13-references/source-registry/';
const CITED_URL = '/13-references/cited-sources/';

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
	const page = absPath.endsWith('.md') ? addSectionMap(contents) : contents;
	fs.writeFileSync(absPath, snToCode(page));
	console.log(`  + ${path.relative(SITE, absPath)}`);
}

const yaml = (v) => JSON.stringify(v);

/* numAnchor / mapLabel / addSectionMap live in section-map.mjs because section
   14 is written by build-report.mjs and needs the very same panel. */

/* normUrl / hostOf live in source-key.mjs: the title fetcher has to key sources
   exactly the way this pipeline does, or a reference loses its title. */

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

/**
 * Link that is immune to parentheses / pipes inside URLs. Off-site links are
 * marked up to open in a new window — the site is a PWA, and a reader tapping a
 * primary source should not lose the page they were reading. `rel="noopener
 * noreferrer"` keeps the new window from reaching back into this document.
 */
const link = (text, href) =>
	`<a href="${attr(href)}"${/^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${attr(text)}</a>`;

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

/* ------------------------------------------------- the source ledger (§13)
   One row per unique source. The corpus registry repeats a URL 214 times —
   sometimes as a second entry, sometimes filed under a second institutional
   category — and 124 of its URLs are also cited by the research. Reading it once
   into a ledger keyed by normalised URL, and keeping every number, category and
   citing section on that single row, is what lets §13 list each source exactly
   once instead of three times. */

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

const rows = []; // unique sources, in first-appearance order
const rowByKey = new Map(); // normUrl -> row

for (const cat of CATEGORIES) {
	for (const entry of cat.entries) {
		const key = normUrl(entry.url);
		if (!key) continue;
		let row = rowByKey.get(key);
		if (!row) {
			row = {
				key,
				url: entry.url,
				domain: entry.domain,
				n: entry.n, // the number this source is linked to forever
				cats: [],
				aliases: [], // other registry numbers for the same URL
				cited: [],
				title: '',
				years: new Set(),
			};
			rowByKey.set(key, row);
			rows.push(row);
		} else if (!row.aliases.includes(entry.n)) {
			row.aliases.push(entry.n);
		}
		if (!row.cats.includes(cat)) row.cats.push(cat);
	}
}

const registryNumbers = CATEGORIES.reduce((sum, cat) => sum + cat.entries.length, 0);

/** Every row is listed under the first category it was filed under. */
const entriesOf = (cat) => rows.filter((row) => row.cats[0] === cat);

/** …and merely cross-referenced from the other categories it also belongs to. */
const crossRefsOf = (cat) =>
	rows.filter((row) => row.cats.includes(cat) && row.cats[0] !== cat);

/**
 * Where a source is listed, for the `index ↗` link under every reference
 * bullet: a registry row, or §13.3 when the corpus cites something the registry
 * never picked up.
 */
const sourceHref = (url) => {
	const row = rowByKey.get(normUrl(url));
	return row ? `${REGISTRY_URL}#r${row.n}` : `${CITED_URL}#${refAnchor(url)}`;
};

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
			return `${line} <a class="xref" href="${sourceHref(first.url)}" title="Open this source's row in the reference ledger">index&nbsp;↗</a>`;
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

/* The reading guide is hand-authored — only its section map is generated, so the
   map keeps working when someone edits the headings above it. */
for (const file of ['reading-guide.md']) {
	const abs = path.join(DOCS, file);
	if (fs.existsSync(abs)) writeFile(abs, read(abs));
}

function clampText(text, max = 175) {
	if (text.length <= max) return text;
	return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

/* ------------------------------------------- 13 · attach citations to rows */

for (const row of rows) {
	const cite = citations.get(row.key);
	if (!cite) continue;
	row.cited = cite.citedIn;
	row.title = cite.title;
	row.years = cite.years;
}

const registryUnique = rows.length;
const registryCited = rows.filter((row) => row.cited.length).length;
const registryDomains = new Set(rows.map((row) => row.domain)).size;
const registryRepeats = registryNumbers - registryUnique;
const multiCategory = rows.filter((row) => row.cats.length > 1).length;

/* Copy that stays true whatever the corpus registry happens to contain. */
const repeatNote = `${registryRepeats.toLocaleString('en-US')} of its ${registryNumbers.toLocaleString('en-US')} registry rows repeated a URL that was already listed`;
const multiNote = multiCategory
	? `, and filed ${multiCategory} sources under more than one category`
	: '';

/** Cited by the research but absent from the registry — §13.3's whole content. */
const citedOnly = [...citations.values()]
	.filter((cite) => !rowByKey.has(cite.key))
	.sort((a, b) => a.host.localeCompare(b.host) || a.order - b.order);

const totalSources = registryUnique + citedOnly.length;

const citedInLabel = (list) =>
	list
		.map((c) => link(`§${anchorLabel(c.anchor)}`, `/${c.slug}/#${c.anchor}`))
		.join(' ');

/* ----------------------------------- 13.1 · how the reference system works */

console.log('▸ building the references section');

writeFile(
	path.join(DOCS, '13-references', 'index.md'),
	`---
title: "13 · References"
description: "Every source behind this research — ${totalSources.toLocaleString('en-US')} unique primary sources, listed once each in one cross-linked ledger of registry sources and the citations the registry never picked up."
---

<div class="sec-head">
<span class="chip chip-kind">References</span>
<span class="chip">Section 13 of 14</span>
<span class="chip">${totalSources.toLocaleString('en-US')} unique sources</span>
<span class="chip">${citations.size.toLocaleString('en-US')} cited by the research</span>
</div>

## <span class="sn">13.1</span> How this reference system works

Every empirical claim in this doksite resolves to a live-retrieved primary source. Section 13 is a single ledger of ${totalSources.toLocaleString('en-US')} unique sources, each listed **exactly once**, split into three subsections:

1. **§13.2 The authoritative source registry** — the ${registryUnique.toLocaleString('en-US')} sources retrieved during the source-expansion pass, grouped into ${CATEGORIES.length} institutional categories. In the corpus registry ${repeatNote}${multiNote}; each URL is one row here, keeping its first registry number and naming every other number and every section that cites it.
2. **§13.3 Sources cited outside the registry** — the ${citedOnly.length.toLocaleString('en-US')} sources the research cites that the registry pass never reached, grouped by the section that cites them first. Registry sources are not repeated here.
3. **Cross-links in both directions** — ${registryCited.toLocaleString('en-US')} registry sources carry a \`cited in §…\` link back to the section that uses them, and every reference bullet in sections 1–12 carries an \`index ↗\` link that jumps to that source's one row.

\`\`\`mermaid
graph LR
    A["Research sections<br/>1 to 12"] -->|cites| B["One ledger of unique<br/>sources, keyed by URL"]
    A -->|"index ↗ under every<br/>reference bullet"| B
    B --> C["13.2 Authoritative<br/>Source Registry"]
    B --> D["13.3 Sources cited<br/>outside the registry"]
    C -->|"cited in §N.M"| A
    C --> E["Primary source<br/>on the open web"]
    D --> E
\`\`\`

### <span class="sn">13.1.1</span> Citation vocabulary used across the site

| Marker | Meaning |
|---|---|
| ${'`[2025]`'} / ${'`[2026]`'} | Inline citation carrying the publication year, linked to the primary source |
| ${'`index ↗`'} | Under every reference bullet in sections 1–12; jumps to that source's single row in §13.2 or §13.3 |
| ${'`cited in §1.16`'} | On a source row; jumps back to the section that cites it |
| ${'`r118`'} | A registry number: stable, and directly linkable as \`#r118\` |

### <span class="sn">13.1.2</span> What is in this section

| Subsection | Contents | Sources |
|---|---|---|
| ${link('13.2 Authoritative Source Registry', REGISTRY_URL)} | Every source retrieved during the source-expansion pass, by institutional category | **${registryUnique.toLocaleString('en-US')}** |
| ${link('13.3 Sources cited outside the registry', CITED_URL)} | Citations the registry pass never picked up, by the section that cites them first | **${citedOnly.length.toLocaleString('en-US')}** |
| | **Total unique sources** | **${totalSources.toLocaleString('en-US')}** |

Registry numbers preserved from the corpus: **${registryNumbers.toLocaleString('en-US')}**, covering **${registryUnique.toLocaleString('en-US')}** URLs. Every external link in this section opens in a new window, so the page you are reading stays where it is.

### <span class="sn">13.1.3</span> Section coverage

| Section | Document | Unique cited sources |
|---|---|---|
${manifest
	.map(
		(d) =>
			`| ${d.n} | ${link(`${d.title}${d.name ? '' : ` — ${d.headline}`}`, `/${d.slug}/`)} | ${d.citeCount} |`
	)
	.join('\n')}
| | **Sections 1–12** | **${citations.size.toLocaleString('en-US')}** |

:::tip[Why one ledger instead of two lists]
The collected citation index and the registry used to overlap: ${registryCited.toLocaleString('en-US')} sources appeared in both, and the registry repeated ${registryRepeats.toLocaleString('en-US')} further URLs. Each source is now a single row carrying its registry number, its institutional category and every section that cites it.
:::
`
);

/* ----------------------------- 13.3 · sources cited outside the registry */

{
	const perDoc = new Map(manifest.map((d) => [d.slug, []]));
	for (const cite of citedOnly) {
		const primary = cite.citedIn[0];
		if (primary) perDoc.get(primary.slug)?.push(cite);
	}

	let blockCount = 0;
	const blocks = manifest
		.map((doc) => {
			const list = (perDoc.get(doc.slug) || []).sort(
				(a, b) => a.host.localeCompare(b.host) || a.order - b.order
			);
			if (!list.length) return '';
			blockCount += 1;
			const items = list
				.map((cite) => {
					const years = [...cite.years].sort().join(', ');
					const bits = [
						`<a id="${refAnchor(cite.url)}" aria-hidden="true"></a>${link(cite.title || cite.host, cite.url)}`,
						years ? `\`${years}\`` : '',
						`\`${cite.host}\``,
						cite.citedIn.length ? `cited in ${citedInLabel(cite.citedIn)}` : '',
					].filter(Boolean);
					return `- ${bits.join(' · ')}`;
				})
				.join('\n');
			return `### <span class="sn">13.3.${blockCount}</span> ${link(`${doc.n} · ${doc.title}`, `/${doc.slug}/`)}${doc.name ? ` — ${doc.name}` : ` — ${doc.headline}`}\n\n${items}`;
		})
		.filter(Boolean)
		.join('\n\n');

	writeFile(
		path.join(DOCS, '13-references', 'cited-sources.md'),
		`---
title: "13.3 · Sources Cited Outside the Registry"
description: "The ${citedOnly.length} sources cited by the Islamic fintech research that the source-expansion pass never picked up, grouped by the section that cites them first."
---

<div class="sec-head">
<span class="chip chip-kind">Additional Citations</span>
<span class="chip">Section 13.3</span>
<span class="chip">${citedOnly.length.toLocaleString('en-US')} unique sources</span>
</div>

## <span class="sn">13.3</span> Sources cited outside the registry

The source-expansion pass behind ${link('§13.2', REGISTRY_URL)} swept ${registryUnique.toLocaleString('en-US')} primary sources. The research also cites another ${citedOnly.length} that the sweep never reached — a datapoint in a footnote, a benchmark table, a vendor page — and every one of them is listed here once, grouped by the section that cites them first and sorted by domain, so no citation in sections 1–12 is a dead end. A source that *is* in the registry is not repeated here: its row, with its registry number and category, is in §13.2.

${blocks}
`
	);
}

/* ------------------------------------------- 13.2 · the registry, one page */

{
	const catStats = CATEGORIES.map((cat, i) => {
		const mine = entriesOf(cat);
		return {
			cat,
			i,
			ref: `13.2.${i + 1}`,
			mine,
			cross: crossRefsOf(cat),
			cited: mine.filter((row) => row.cited.length).length,
		};
	});

	const indexRows = catStats
		.map(
			({ cat, i, ref, mine, cited }) =>
				`| **${ref}** | ${link(cat.title, `#s13-2-${i + 1}`)} | ${mine.length} | ${new Set(mine.map((row) => row.domain)).size} | ${cited} |`
		)
		.join('\n');

	const sections = catStats
		.map(({ cat, i, ref, mine, cross, cited }) => {
			const items = mine
				.map((row) => {
					const bits = [
						`<a id="r${row.n}" aria-hidden="true"></a><span class="reg-num">r${row.n}</span> ${link(`[${row.domain}]`, row.url)}`,
						row.title ? `<em>${attr(clampText(clean(row.title), 150))}</em>` : '',
						row.years.size ? `\`${[...row.years].sort().join(', ')}\`` : '',
						row.cited.length ? `cited in ${citedInLabel(row.cited)}` : '',
						row.cats.length > 1
							? `also filed under ${row.cats
									.slice(1)
									.map((c) => link(c.short, `#s13-2-${CATEGORIES.indexOf(c) + 1}`))
									.join(', ')}`
							: '',
						row.aliases.length
							? `also numbered ${row.aliases.map((n) => `r${n}`).join(', ')}`
							: '',
					].filter(Boolean);
					return `- ${bits.join(' · ')}`;
				})
				.join('\n');

			const block = [
				`### <span class="sn">${ref}</span> ${cat.title}`,
				'',
				`${mine.length.toLocaleString('en-US')} unique sources across ${new Set(mine.map((row) => row.domain)).size} domains${cited ? `, ${cited} of them cited by the research` : ''}. Registry numbers are stable and directly linkable — e.g. \`#r${mine[0]?.n ?? 1}\`.`,
				'',
				items || '_No sources are filed under this category._',
			];

			if (cross.length)
				block.push(
					'',
					`Also filed under this category but listed once, under the category it appeared in first: ${cross
						.map((row) => link(`r${row.n}`, `#r${row.n}`))
						.join(' · ')}.`
				);

			return block.join('\n');
		})
		.join('\n\n');

	writeFile(
		path.join(DOCS, '13-references', 'source-registry.md'),
		`---
title: "13.2 · Authoritative Source Registry"
description: "The ${registryUnique.toLocaleString('en-US')} unique sources retrieved during the research source-expansion pass, grouped into ${CATEGORIES.length} institutional categories and cross-linked to every section that cites them."
---

<div class="sec-head">
<span class="chip chip-kind">Source Registry</span>
<span class="chip">Section 13.2</span>
<span class="chip">${registryUnique.toLocaleString('en-US')} unique sources</span>
<span class="chip">${registryNumbers.toLocaleString('en-US')} registry numbers</span>
</div>

## <span class="sn">13.2</span> The authoritative source registry

This is the discovery ledger behind the research: every central-bank page, peer-reviewed article, rating-agency note, fintech filing and vendor rate card retrieved live during the 2025–2026 source-expansion pass. ${registryUnique.toLocaleString('en-US')} unique sources, grouped into ${CATEGORIES.length} institutional categories.

In the corpus registry ${repeatNote}${multiNote}. Each URL is one row here — it keeps its first registry number and names every other number and every section that cites it. Rows stay in their original registry order.

| Ref | Category | Sources | Domains | Cited |
|---|---|---|---|---|
${indexRows}
| | **All categories** | **${registryUnique.toLocaleString('en-US')}** | **${registryDomains.toLocaleString('en-US')}** | **${registryCited.toLocaleString('en-US')}** |

:::note[Reading the registry]
Registry numbers are stable and linkable from anywhere on the site — \`#r1234\` resolves as long as that URL still has a row. \`cited in §1.16\` jumps from a source back into the section that uses it, and every external link opens in a new window.
:::

${sections}
`
	);
}

/* --------------------------------------------------------------- metadata */

const stats = {
	generatedAt: new Date().toISOString().slice(0, 10),
	sections: SECTIONS.length,
	researchSections: manifest.length,
	uniqueCitations: citations.size,
	registryEntries: registryNumbers,
	registryUnique: registryUnique,
	registryRepeats: registryRepeats,
	registryCited: registryCited,
	registryMultiCategory: multiCategory,
	registryDomains: registryDomains,
	citedOnlySources: citedOnly.length,
	totalSources: totalSources,
	registryCategories: CATEGORIES.map((cat, i) => ({
		ref: `13.2.${i + 1}`,
		title: cat.title,
		short: cat.short,
		slug: '13-references/source-registry',
		anchor: `s13-2-${i + 1}`,
		count: entriesOf(cat).length,
		cited: entriesOf(cat).filter((row) => row.cited.length).length,
	})),
	totalWords: manifest.reduce((s, d) => s + d.words, 0),
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
	`▸ done — ${manifest.length} research pages · ${totalSources} unique sources (${registryUnique} registry + ${citedOnly.length} cited-only) · ${registryNumbers} registry numbers → ${registryUnique} rows`
);
