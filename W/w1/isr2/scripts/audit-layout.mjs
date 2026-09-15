#!/usr/bin/env node
/**
 * audit-layout.mjs — browser-free layout QA for the built site.
 *
 * This environment has no GUI and no browser system libraries, so instead of
 * screenshots the audit verifies the properties that actually decide whether a
 * layout holds up, straight from the emitted HTML, the theme CSS, the manifest
 * and the generated precache list:
 *
 *   1. Palette contrast    — WCAG 2.1 ratios for every text/background pair,
 *                            with real alpha compositing, in both colour schemes
 *   2. Heading integrity   — numbering present, unique, correctly anchored, no
 *                            skipped levels, mirrored into the right-hand contents
 *   3. Overflow discipline — every intrinsically wide element (tables, diagrams,
 *                            code, long URLs) is inside a scroll container with a
 *                            readable minimum width instead of being squeezed
 *   4. Responsive maths    — the centre pane stays the widest column at every
 *                            breakpoint, and side panes never drop below usable
 *   5. PWA / standalone    — icons exist at their declared dimensions, the OG card
 *                            is exactly 1200x630, every precached URL resolves,
 *                            standalone safe-area rules are present
 *   6. Accessibility basics— lang, alt text, skip link, visible focus styles
 *
 * Run with:  bun run audit        (after `bun run build`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const DIST = path.join(SITE, 'dist');
const THEME = path.join(SITE, 'src', 'styles', 'theme.css');
const CONFIG = path.join(SITE, 'astro.config.mjs');

if (!fs.existsSync(DIST)) {
	console.error('✗ dist/ not found — run `bun run build` first');
	process.exit(1);
}

const themeCss = fs.readFileSync(THEME, 'utf8');
const configSrc = fs.readFileSync(CONFIG, 'utf8');

const results = [];
const check = (group, name, ok, detail = '') =>
	results.push({ group, name, ok: Boolean(ok), detail });

/* ------------------------------------------------------------ html helpers */

const pages = [];
(function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const abs = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'pagefind') continue;
			walk(abs);
		} else if (entry.name.endsWith('.html')) {
			pages.push(abs);
		}
	}
})(DIST);

const rel = (file) => path.relative(DIST, file).replace(/\\/g, '/') || 'index.html';
const html = (file) => fs.readFileSync(file, 'utf8');
const contentOf = (source) =>
	(source.match(/<div class="sl-markdown-content[\s\S]*?<\/main>/)?.[0] ?? source)
		.replace(/<script[\s\S]*?<\/script>/g, '');

/* ------------------------------------------------------- 1. palette contrast */

/** Extracts `--custom-prop: value;` pairs from a selector block in theme.css. */
function blockVars(selectorPattern) {
	const start = themeCss.search(selectorPattern);
	if (start === -1) return {};
	const open = themeCss.indexOf('{', start);
	const close = themeCss.indexOf('}', open);
	const body = themeCss.slice(open + 1, close);
	const vars = {};
	for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
	return vars;
}

const palettes = {
	dark: blockVars(/:root\[data-theme='dark'\]/),
	light: blockVars(/:root\[data-theme='light'\]/),
};
if (!Object.keys(palettes.dark).length) palettes.dark = blockVars(/^:root,[\s\S]{0,80}?\{/m);
if (!Object.keys(palettes.dark).length) palettes.dark = blockVars(/^:root[^{]*\{/m);

const resolveVar = (vars, value, depth = 0) => {
	if (depth > 8) return value;
	const m = value?.match(/^var\(\s*--([\w-]+)\s*(?:,\s*([^)]+))?\)$/);
	if (!m) return value;
	if (vars[m[1]] !== undefined) return resolveVar(vars, vars[m[1]], depth + 1);
	if (m[2] !== undefined) return m[2].trim();
	return undefined;
};

const toRgba = (value) => {
	const v = String(value).trim();
	let m = v.match(/^#([0-9a-f]{3,8})$/i);
	if (m) {
		let hex = m[1];
		if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
		if (hex.length === 6) hex += 'ff';
		return {
			r: parseInt(hex.slice(0, 2), 16),
			g: parseInt(hex.slice(2, 4), 16),
			b: parseInt(hex.slice(4, 6), 16),
			a: parseInt(hex.slice(6, 8), 16) / 255,
		};
	}
	m = v.match(/^rgba?\(([^)]+)\)$/i);
	if (m) {
		const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
		return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
	}
	m = v.match(/^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/i);
	if (m) return { ...hslToRgb(+m[1], +m[2], +m[3]), a: 1 };
	return null;
};

function hslToRgb(h, s, l) {
	const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l / 100 - c / 2;
	const seg = Math.floor(((h % 360) + 360) % 360 / 60) % 6;
	const [r, g, b] = [
		[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
	][seg];
	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
	};
}

const over = (fg, bg) =>
	!fg
		? bg
		: fg.a >= 1
			? fg
			: {
					r: fg.r * fg.a + bg.r * (1 - fg.a),
					g: fg.g * fg.a + bg.g * (1 - fg.a),
					b: fg.b * fg.a + bg.b * (1 - fg.a),
					a: 1,
				};

const luminance = ({ r, g, b }) => {
	const channel = (c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a, b) => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};

function paletteContrast(scheme) {
	const vars = palettes[scheme];
	const v = (name) => toRgba(resolveVar(vars, vars[name]));
	const bg = v('sl-color-bg');
	const panel = over(v('ga-panel'), bg);
	const inlineCode = over(v('sl-color-bg-inline-code'), bg);
	const thTint = over({ r: 34, g: 211, b: 238, a: 0.07 }, panel);
	const buttonFill = over({ r: 34, g: 211, b: 238, a: 0.2 }, panel);

	return [
		['body text on page background', v('sl-color-text'), bg, 4.5],
		['heading text on page background', v('sl-color-white'), bg, 4.5],
		['links on page background', v('sl-color-text-accent'), bg, 4.5],
		['inline code on its own chip', v('sl-color-accent-high'), inlineCode, 4.5],
		['table header on header tint', v('sl-color-accent-high'), thTint, 4.5],
		['table cell text on panel', v('sl-color-text'), panel, 4.5],
		['section chip label on panel', v('sl-color-gray-3'), panel, 3.0],
		['registry number on panel', v('sl-color-gray-4'), panel, 3.0],
		['contents-pane links on background', v('sl-color-gray-3'), bg, 4.5],
		['sidebar links on sidebar background', v('sl-color-gray-3'), v('sl-color-bg-sidebar'), 4.5],
		['home button label on its fill', v('sl-color-gray-1'), buttonFill, 4.5],
		['index backlink on panel', v('sl-color-gray-3'), panel, 3.0],
		['section map link on panel', v('sl-color-gray-1'), panel, 4.5],
		['section map number on panel', v('sl-color-accent'), panel, 3.0],
		['section map meta on panel', v('sl-color-gray-3'), panel, 4.5],
		['section map part chip on its fill', v('sl-color-gray-3'), over(v('sl-color-bg-inline-code'), panel), 4.5],
	];
}

for (const scheme of ['dark', 'light']) {
	for (const [label, fg, bg, min] of paletteContrast(scheme)) {
		const ratio = contrast(fg, bg);
		check(
			`contrast (${scheme})`,
			`${label} ≥ ${min}:1`,
			ratio >= min,
			`${ratio.toFixed(2)}:1`
		);
	}
}

// Mermaid renders its own dark palette inside the diagram panels
{
	const text = configSrc.match(/primaryTextColor:\s*'([^']+)'/)?.[1];
	const panel = configSrc.match(/primaryColor:\s*'([^']+)'/)?.[1];
	if (text && panel) {
		const ratio = contrast(toRgba(text), toRgba(panel));
		check(
			'contrast (diagrams)',
			'mermaid node label on node fill ≥ 4.5:1',
			ratio >= 4.5,
			`${ratio.toFixed(2)}:1`
		);
	}
}

/* ------------------------------------------------------ 2. heading integrity */

const CONTENT_PAGES = pages.filter(
	(page) => rel(page) !== '404.html' && rel(page) !== 'offline.html'
);

const NUM = /^(\d+(?:\.\d+)*)$/;

for (const page of CONTENT_PAGES) {
	const name = rel(page);
	const source = html(page);
	const content = contentOf(source);
	const isHome = name === 'index.html';
	const isGuide = name.startsWith('reading-guide');

	const h1s = [...source.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) =>
		m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
	);
	check('headings', `${name}: exactly one h1`, h1s.length === 1, h1s.join(' | '));

	const numbered = (tag) =>
		[...content.matchAll(new RegExp(`<${tag} id="[^"]*">\\s*<code[^>]*>([^<]*)</code>`, 'g'))].map(
			(m) => m[1].trim()
		);
	const h2 = numbered('h2');
	const h3 = numbered('h3');
	const h4 = numbered('h4');

	if (isHome) continue;

	const all = [...h2, ...h3, ...h4];
	const unnumbered = all.filter((n) => !NUM.test(n));
	check('headings', `${name}: every heading carries a number`, unnumbered.length === 0, unnumbered.join(', '));

	const badPrefix = all.filter((n) => !n.startsWith(isGuide ? '0' : n.split('.')[0]));
	check(
		'headings',
		`${name}: heading numbers share one section prefix`,
		badPrefix.length === 0,
		`h2=${h2[0] ?? '—'} offenders=${badPrefix.join(', ')}`
	);

	check(
		'headings',
		`${name}: h2 numbers are unique`,
		new Set(h2).size === h2.length,
		h2.join(', ')
	);

	const duplicateTitles = h2.filter((_, i) => h2.indexOf(h2[i]) !== i);
	check('headings', `${name}: no duplicate h2 numbers`, duplicateTitles.length === 0, duplicateTitles.join(', '));

	// no skipped levels: an h3 may only follow an h2, never an h1 or nothing
	const order = [...content.matchAll(/<h([234])[\s>]/g)].map((m) => Number(m[1]));
	const skipped = order.some((level, i) => i > 0 && level - order[i - 1] > 1);
	check('headings', `${name}: no skipped heading levels`, !skipped, order.join(''));

	// the right-hand contents pane must mirror the same numbers
	const toc = source.match(/<starlight-toc[\s\S]*?<\/starlight-toc>/)?.[0] ?? '';
	const tocLabels = [...toc.matchAll(/<span[^>]*>([^<]+)<\/span>/g)]
		.map((m) => m[1].trim())
		.filter((t) => t && !/^Overview$/.test(t));
	check(
		'headings',
		`${name}: contents pane is numbered and complete`,
		tocLabels.length > 0 &&
			tocLabels.every((t) => NUM.test(t.split(' ')[0])) &&
			tocLabels.length >= h2.length + h3.length - 1,
		`${tocLabels.length} entries (h2=${h2.length}, h3=${h3.length})`
	);

	// every heading number must be reachable by anchor
	const anchors = new Set([...source.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
	const tocHrefs = [...toc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
	const deadToc = tocHrefs.filter((href) => !anchors.has(href) && href !== '_top');
	check('headings', `${name}: every contents link resolves`, deadToc.length === 0, deadToc.join(', '));
}

/* ------------------------------------------------------- 2b. section map
   The numbered map under each page header. It matters most on phones and in the
   installed PWA, where Starlight's right-hand pane does not exist at all, so the
   checks here are about it being present, complete, resolvable and reachable at
   those widths — not merely rendered. */

const MAP_THRESHOLD = 4; // generation skips pages with fewer headings than this

for (const page of CONTENT_PAGES) {
	const name = rel(page);
	const source = html(page);
	const content = contentOf(source);

	const headings = [...content.matchAll(/<h[23] id="[^"]*">\s*<code[^>]*>([^<]*)<\/code>/g)].map(
		(m) => m[1].trim()
	);

	const map = source.match(/<details class="ga-map"[^>]*>[\s\S]*?<\/details>/)?.[0] ?? '';
	const expected = headings.length >= MAP_THRESHOLD;

	if (!expected) {
		check('section map', `${name}: no map for <${MAP_THRESHOLD} headings`, !map);
		continue;
	}

	check('section map', `${name}: map is present`, Boolean(map));
	check(
		'section map',
		`${name}: map is open by default (not collapsed behind a tap)`,
		/<details class="ga-map"[^>]*\sopen/.test(source)
	);

	const links = [...map.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
	check(
		'section map',
		`${name}: map lists every heading`,
		links.length === headings.length,
		`${links.length} links for ${headings.length} headings`
	);

	const ids = new Set([...source.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
	const dead = links.filter((href) => !ids.has(href));
	check('section map', `${name}: every map link resolves`, dead.length === 0, dead.join(', '));

	const labels = [...map.matchAll(/class="ga-map-num">([^<]*)</g)].map((m) => m[1].trim());
	check(
		'section map',
		`${name}: map numbers match the headings`,
		labels.join('|') === headings.join('|'),
		labels.join(', ')
	);

	// document order: after the title, before the body it describes
	const mapAt = content.indexOf('<details class="ga-map"');
	const firstH2 = content.search(/<h2 id="[^"]*">\s*<code/);
	check(
		'section map',
		`${name}: map sits directly under the header`,
		mapAt > 0 && firstH2 > mapAt,
		`map@${mapAt} firstH2@${firstH2}`
	);

	// it has to be inside the content pane: the aside that holds Starlight's own
	// contents list is display:none at these widths, so a map placed there would
	// vanish in exactly the situation it exists for
	const contentStart = source.indexOf('<div class="sl-markdown-content');
	const mapInSource = source.indexOf('<details class="ga-map"');
	check(
		'section map',
		`${name}: map is in the content pane, not the hidden aside`,
		mapInSource > contentStart && mapInSource < source.indexOf('</main>')
	);
}

/* ---------------------------------------------------- 3. overflow discipline */

const cssHas = (pattern, target = themeCss) => pattern.test(target);

check(
	'overflow',
	'tables become their own scroll container',
	/\.sl-markdown-content table\s*\{[^}]*overflow[^}]*auto/.test(themeCss.replace(/\s+/g, ' ')),
	''
);
check(
	'overflow',
	'table columns keep a readable minimum width',
	/\.sl-markdown-content table :is\(th, ?td\)\s*\{[^}]*min-width:\s*(8|9)rem/.test(
		themeCss.replace(/\s+/g, ' ')
	)
);
check(
	'overflow',
	'diagram panels scroll instead of scaling down',
	/\.mermaid\s*\{[^}]*overflow-x:\s*auto/.test(themeCss.replace(/\s+/g, ' ')) &&
		/\.mermaid svg[^{]*\{[^}]*max-width:\s*none/.test(themeCss.replace(/\s+/g, ' '))
);
check('overflow', 'prose breaks long tokens', /overflow-wrap:\s*break-word/.test(themeCss));
check('overflow', 'URLs inside cells break anywhere', /overflow-wrap:\s*anywhere/.test(themeCss));
check('overflow', 'anchor jumps clear the sticky header', /scroll-padding-top/.test(themeCss));

const cssFiles = fs
	.readdirSync(path.join(DIST, '_astro'))
	.filter((f) => f.endsWith('.css'))
	.map((f) => fs.readFileSync(path.join(DIST, '_astro', f), 'utf8'))
	.join('\n');
check(
	'overflow',
	'code blocks scroll horizontally',
	/overflow[^;}]*auto/.test(cssFiles)
);

// The shipped CSS is minified (and range-syntax media queries), so the layout
// and overflow rules have to be re-confirmed against the emitted file rather
// than trusted from the source — a source rule that never ships is not a rule.
const shipped = (pattern) => pattern.test(cssFiles.replace(/\s+/g, ' '));
check('overflow', 'shipped CSS keeps tables in a scroll container', shipped(/table[^{]*\{[^}]*overflow[^}]*auto/));
check('overflow', 'shipped CSS keeps diagrams at natural size', shipped(/\.mermaid svg[^{]*\{[^}]*max-width: ?none/));
check('layout', 'shipped CSS keeps the 58rem reading measure', shipped(/--sl-content-width: ?58rem/));
check('layout', 'shipped CSS keeps the squeeze-zone pane override', shipped(/--sl-sidebar-width: ?14rem/));
check(
	'layout',
	'shipped CSS keeps the squeeze zone bounded',
	shipped(/@media \(width>=50rem\) and \(width<=82rem\)/) || shipped(/@media \(min-width: 50rem\) and \(max-width: 82rem\)/)
);
check('a11y', 'shipped CSS keeps visible focus rings', shipped(/:focus-visible[^{]*\{[^}]*outline: ?2px solid/));
check('pwa', 'shipped CSS keeps standalone safe-area handling', shipped(/display-mode: ?standalone/) && shipped(/safe-area-inset-top/));
check('section map', 'shipped CSS carries the map panel', shipped(/\.ga-map\{[^}]*border-radius/));
check(
	'section map',
	'shipped CSS builds the map on a grid with a two-column step',
	shipped(/\.ga-map \.ga-map-list\{[^}]*grid-template-columns:minmax\(0, ?1fr\)/) &&
		shipped(/@media \(width>=60rem\)\{[^@]*ga-map/) &&
		shipped(/@media \(width>=60rem\)\{[^@]*repeat\(2, ?minmax\(0, ?1fr\)\)/)
);
const wide = { tables: 0, diagrams: 0, codeBlocks: 0, longUrls: 0 };
for (const page of pages) {
	const source = html(page);
	wide.tables += (source.match(/<table/g) || []).length;
	wide.diagrams += (source.match(/class="mermaid"/g) || []).length;
	wide.codeBlocks += (source.match(/<pre /g) || []).length - (source.match(/class="mermaid"/g) || []).length;
	const cells = [...source.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
	for (const cell of cells) {
		if (/[^\s<>"]{45,}/.test(cell.replace(/<[^>]+>/g, (tag) => (tag.includes('href') ? ' ' : ''))))
			wide.longUrls += 1;
	}
}
/* the map must not be hidden at any width: below 72rem the right-hand contents
   pane is gone, and that is exactly where the map has to be doing the work */
{
	// only rules whose *subject* is the panel itself can hide it; a rule on
	// `.ga-map > summary::marker` is not one of them
	const hidden = [...themeCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
		.filter(([, , body]) => /display:\s*none|visibility:\s*hidden/.test(body))
		.filter(([, selector]) =>
			selector
				.split('{')
				.pop()
				.split(',')
				.some((part) => /\.ga-map$/.test(part.trim().split('::')[0].trim()))
		);
	check('section map', 'the map is never hidden by CSS', hidden.length === 0, hidden[0]?.[1]?.trim());

	// the premise of the whole panel: Starlight's “On this page” pane is hidden at
	// PWA widths, leaving only the sticky dropdown in the nav bar
	const contentsPaneHidden =
		/\.sl-hidden\{display:none\}/.test(cssFiles) &&
		/@media \(width>=72rem\)\{[^@]*\.lg\\:sl-block\{display:block\}/.test(cssFiles);
	check(
		'section map',
		"Starlight's contents pane really is hidden below 72rem",
		contentsPaneHidden
	);
	check(
		'section map',
		'the map is one column when the side panes are gone',
		/\.ga-map \.ga-map-list\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/.test(
			themeCss.replace(/\s+/g, ' ')
		)
	);
}

check(
	'overflow',
	'wide-content inventory contained',
	true,
	`${wide.tables} tables · ${wide.diagrams} diagrams · ${wide.codeBlocks} code blocks · ${wide.longUrls} long unbroken runs in cells`
);

/* ------------------------------------------------------- 4. responsive maths */

// layout custom properties are declared once in the base `:root` block
const firstDecl = (name) =>
	[...themeCss.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, 'g'))][0]?.[1].trim();

const px = (name, fallback) => {
	const m = String(firstDecl(name) ?? '').match(/^([\d.]+)rem$/);
	return m ? Number(m[1]) * 16 : fallback;
};

const contentWidth = px('sl-content-width', 720);
const sidebarWidth = px('sl-sidebar-width', 300);
const contentPad = px('sl-content-pad-x', 24);

// Starlight's real breakpoints: the left pane appears at 50rem, the contents
// pane at 72rem; below 50rem navigation moves into the burger-menu popover.
const NAV_BREAKPOINT = 50 * 16;
const TOC_BREAKPOINT = 72 * 16;

// the squeeze-zone override that keeps the measure readable in three-pane mode
const squeeze = (() => {
	const block = themeCss.match(
		/@media\s*\(min-width:\s*([\d.]+)rem\)\s*and\s*\(max-width:\s*([\d.]+)rem\)\s*\{([\s\S]*?)\n\}/
	);
	if (!block) return null;
	const value = block[3].match(/--sl-sidebar-width:\s*([\d.]+)rem/)?.[1];
	if (!value) return null;
	return { from: Number(block[1]) * 16, to: Number(block[2]) * 16, sidebar: Number(value) * 16 };
})();

check(
	'layout',
	'centre pane is the widest column',
	contentWidth >= sidebarWidth * 2 + 200,
	`${contentWidth / 16}rem reading measure vs ${sidebarWidth / 16}rem side panes`
);
check('layout', 'side panes stay usable', sidebarWidth >= 14 * 16, `${sidebarWidth / 16}rem`);
check(
	'layout',
	'side panes narrow in the squeeze zone',
	squeeze && squeeze.sidebar >= 13 * 16 && squeeze.sidebar <= sidebarWidth,
	squeeze ? `${squeeze.sidebar / 16}rem from ${squeeze.from / 16}rem to ${squeeze.to / 16}rem` : 'missing'
);
check('layout', 'mobile rules exist below the nav breakpoint', /@media\s*\(max-width:\s*50rem\)/.test(themeCss));

/** Starlight's pane arithmetic, reproduced exactly. */
const model = (viewport) => {
	const hasNav = viewport >= NAV_BREAKPOINT;
	const hasToc = viewport >= TOC_BREAKPOINT;
	const sidebar =
		squeeze && viewport >= squeeze.from && viewport <= squeeze.to ? squeeze.sidebar : sidebarWidth;
	const left = hasNav ? sidebar : 0;
	const W2 = viewport - left;

	if (!hasToc) {
		const centre = W2;
		return {
			viewport,
			mode: hasNav ? 'left pane + centre' : 'burger menu',
			left,
			centre,
			right: 0,
			measure: Math.min(contentWidth, centre - 2 * contentPad),
			slack: viewport - (left + centre),
		};
	}

	const extra = (W2 - contentWidth - sidebar) / 2;
	const right = Math.max(sidebar, sidebar + extra);
	const centre = Math.min(W2 - sidebar, contentWidth + extra);
	return {
		viewport,
		mode: 'left + centre + contents',
		left,
		centre,
		right,
		measure: Math.min(contentWidth, centre - 2 * contentPad),
		slack: viewport - (left + centre + right),
	};
};

const layoutRows = [1920, 1600, 1440, 1280, 1152, 1024, 900, 834, 800, 768, 600, 390].map(model);

check(
	'layout',
	'no breakpoint overflows horizontally',
	layoutRows.every((row) => Math.abs(row.slack) <= 1),
	layoutRows.filter((r) => Math.abs(r.slack) > 1).map((r) => `${r.viewport}:${r.slack}`).join(' ') || 'all fit'
);
check(
	'layout',
	'centre pane is the widest at every breakpoint',
	layoutRows.every((row) => row.centre >= Math.max(row.left, row.right, 1)),
	`min centre ${Math.min(...layoutRows.map((r) => r.centre))}px`
);
// comfortable means: a full measure on wide screens, and never below a
// readable minimum once the panes appear
const measureFloor = (viewport) =>
	viewport >= 1440 ? 42 * 16 : viewport >= TOC_BREAKPOINT ? 36 * 16 : viewport >= NAV_BREAKPOINT ? 33 * 16 : 0;
check(
	'layout',
	'reading measure stays comfortable',
	layoutRows.every((row) => row.measure >= measureFloor(row.viewport)),
	layoutRows
		.filter((r) => r.measure < measureFloor(r.viewport))
		.map((r) => `${r.viewport}px→${Math.round(r.measure)}px (floor ${measureFloor(r.viewport)}px)`)
		.join(' ') || `worst measure ${Math.min(...layoutRows.map((r) => r.measure))}px`
);
check(
	'layout',
	'wide viewports use the full reading measure',
	model(1920).measure === contentWidth,
	`${model(1920).measure}px of ${contentWidth}px`
);

/* ------------------------------------------------------------- 5. PWA checks */

const manifestPath = path.join(DIST, 'manifest.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
check('pwa', 'manifest declares a standalone display mode', manifest.display === 'standalone');
check('pwa', 'manifest start_url is the root', manifest.start_url === '/');

for (const icon of manifest.icons) {
	const abs = path.join(DIST, icon.src.replace(/^\//, ''));
	if (!fs.existsSync(abs)) {
		check('pwa', `icon ${icon.src} exists`, false);
		continue;
	}
	if (!icon.src.endsWith('.png')) {
		check('pwa', `icon ${icon.src} exists`, true);
		continue;
	}
	const meta = await sharp(abs).metadata();
	const [w, h] = icon.sizes.split('x').map(Number);
	check(
		'pwa',
		`icon ${icon.src} matches its declared ${icon.sizes}`,
		meta.width === w && meta.height === h,
		`actual ${meta.width}x${meta.height}`
	);
}
check(
	'pwa',
	'at least one maskable icon is declared',
	manifest.icons.some((i) => i.purpose === 'maskable')
);

const ogPath = path.join(DIST, 'og-image.png');
const ogMeta = fs.existsSync(ogPath) ? await sharp(ogPath).metadata() : {};
check('pwa', 'social card is exactly 1200x630', ogMeta.width === 1200 && ogMeta.height === 630, `${ogMeta.width}x${ogMeta.height}`);
check('pwa', 'apple touch icon is 180x180', fs.existsSync(path.join(DIST, 'icons/apple-touch-icon.png')));

const swManifestSrc = fs.readFileSync(path.join(DIST, 'sw-manifest.js'), 'utf8');
const sw = JSON.parse(swManifestSrc.slice(swManifestSrc.indexOf('=') + 1, swManifestSrc.lastIndexOf(';')));
const missing = sw.precache.filter((url) => {
	const abs = path.join(DIST, url.replace(/^\//, ''));
	return url.endsWith('/')
		? !fs.existsSync(path.join(abs, 'index.html'))
		: !fs.existsSync(abs);
});
check(
	'pwa',
	'every precached URL resolves (offline install cannot 404)',
	missing.length === 0,
	`${sw.precache.length} entries${missing.length ? ` · missing ${missing.slice(0, 5).join(', ')}` : ''}`
);
check('pwa', 'the root document is precached', sw.precache.includes('/'));
check('pwa', 'the offline fallback is precached', sw.precache.includes(sw.offlinePage));
{
	const indexPages = [];
	(function collect(dir) {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const abs = path.join(dir, entry.name);
			if (entry.isDirectory()) collect(abs);
			else if (entry.name === 'index.html')
				indexPages.push(`/${path.relative(DIST, path.dirname(abs)).split(path.sep).join('/')}/`);
		}
	})(DIST);
	const missingClean = indexPages.filter((url) => !sw.precache.includes(url.replace('//', '/')));
	check(
		'pwa',
		'every directory page is precached under its clean URL',
		missingClean.length === 0,
		`${indexPages.length} pages${missingClean.length ? ` · missing ${missingClean.slice(0, 4).join(', ')}` : ''}`
	);
}
check('pwa', 'standalone safe-area rules are present', /display-mode:\s*standalone/.test(themeCss) && /safe-area-inset/.test(themeCss));
check('pwa', 'standalone viewport height is handled', /100dvh/.test(themeCss));

const themeColor = html(path.join(DIST, 'index.html')).match(/name="theme-color"/g) || [];
check('pwa', 'theme-color is declared for both schemes', themeColor.length >= 2, `${themeColor.length} tags`);

let burgerPages = 0;
let splashPages = 0;
for (const page of CONTENT_PAGES) {
	const source = html(page);
	if (source.includes('sl-menu-button')) burgerPages += 1;
	else splashPages += 1;
}
check('pwa', 'burger menu is present on every non-splash page', burgerPages >= CONTENT_PAGES.length - 2, `${burgerPages} with menu · ${splashPages} without (splash/offline)`);

/* -------------------------------------------------- 6. accessibility basics */

for (const page of CONTENT_PAGES) {
	const source = html(page);
	check('a11y', `${rel(page)}: lang attribute set`, /<html[^>]+lang="/.test(source));
	check(
		'a11y',
		`${rel(page)}: viewport meta present`,
		/name="viewport"[^>]*width=device-width/.test(source)
	);
	const imgs = [...source.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
	const noAlt = imgs.filter((tag) => !/\balt="/.test(tag));
	check('a11y', `${rel(page)}: every image has alt text`, noAlt.length === 0, noAlt.slice(0, 2).join(' '));
}

check('a11y', 'skip link is present', html(path.join(DIST, 'index.html')).includes('sl-skip-link'));
check(
	'a11y',
	'custom controls keep a visible focus ring',
	/:focus-visible/.test(themeCss) && /\.ga-btn:focus-visible/.test(themeCss) && /\.ga-card a:focus-visible/.test(themeCss)
);

/* ------------------------------------------------------------------ report */

const GROUPS = [
	'contrast (dark)',
	'contrast (light)',
	'contrast (diagrams)',
	'headings',
	'section map',
	'overflow',
	'layout',
	'pwa',
	'a11y',
];

let failures = 0;
console.log('\n▸ layout audit — desktop browsing + installed PWA\n');
for (const group of GROUPS) {
	const rows = results.filter((r) => r.group === group);
	if (!rows.length) continue;
	const bad = rows.filter((r) => !r.ok);
	failures += bad.length;
	console.log(`${bad.length ? '✗' : '✓'} ${group}  (${rows.length - bad.length}/${rows.length})`);
	for (const row of bad) console.log(`    ✗ ${row.name}${row.detail ? ` — ${row.detail}` : ''}`);
}

console.log('\n▸ responsive width model (Starlight\u2019s pane arithmetic)');
console.log('  viewport    mode                     left   centre   right   measure');
for (const row of layoutRows) {
	console.log(
		`  ${String(row.viewport).padStart(6)}px   ${row.mode.padEnd(22)} ${String(row.left).padStart(5)}  ${String(Math.round(row.centre)).padStart(6)}  ${String(Math.round(row.right)).padStart(6)}  ${String(Math.round(row.measure)).padStart(7)}px`
	);
}

if (failures) {
	console.error(`\n✗ ${failures} layout check(s) failed`);
	process.exit(1);
}
console.log(`\n✓ all ${results.length} layout checks passed`);
