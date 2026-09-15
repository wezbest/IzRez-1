/**
 * section-map.mjs — the numbered contents panel that sits under every page
 * header.
 *
 * Starlight's right-hand “On this page” pane is hidden below 72rem, which is
 * exactly the width of an installed PWA on a phone. This panel is the contents
 * there: plain HTML, open by default, collapsible by the reader, and valid at
 * every width without JavaScript.
 *
 * Both generators use it — `build-docs.mjs` for the research pages and
 * `build-report.mjs` for section 14 — so the markup lives here rather than in
 * either script.
 */

/** Escape text for an HTML attribute or text node. */
export const attr = (text) =>
	String(text)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

/**
 * Section numbers are authored two ways in this build: `<span class="sn">` on
 * the pages `build-docs.mjs` writes (converted to inline code afterwards, so the
 * number survives into Starlight's own table of contents) and plain inline code
 * on section 14. Both forms are recognised here.
 */
const headingPattern = (hashes) =>
	new RegExp(`^${hashes} (?:<span class="sn">|\`)([\\d.]+)(?:</span>|\`)\\s*(.*)$`);

const H2 = headingPattern('##');
const H3 = headingPattern('###');

/** Anchor id for a numbered heading, e.g. 13.2.1 -> s13-2-1. */
export const numAnchor = (num) => `s${String(num).replace(/\./g, '-')}`;

/** Heading text as a plain label: embedded links and markup are dropped. */
const mapLabel = (raw) =>
	attr(
		raw
			.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/<[^>]+>/g, ' ')
			.replace(/[*_`]/g, '')
			.replace(/\s+/g, ' ')
			.trim()
	);

/** The two halves of every map link: the number, then the heading label. */
const mapLink = (num, title, className = '') =>
	`<a${className ? ` class="${className}"` : ''} href="#${numAnchor(num)}"><span class="ga-map-num">${num}</span><span class="ga-map-ttl">${mapLabel(title)}</span></a>`;

function sectionMapHtml(map) {
	const parts = map.reduce((sum, entry) => sum + entry.subs.length, 0);
	const rows = map
		.map((entry) => {
			const link = mapLink(entry.num, entry.title, 'ga-map-link');
			if (!entry.subs.length)
				return `\t\t<li class="ga-map-item">\n\t\t\t${link}\n\t\t</li>`;
			const subs = entry.subs
				.map((sub) => `\t\t\t\t<li>${mapLink(sub.num, sub.title)}</li>`)
				.join('\n');
			return `\t\t<li class="ga-map-item">\n\t\t\t${link}\n\t\t\t<ul class="ga-map-sub">\n${subs}\n\t\t\t</ul>\n\t\t</li>`;
		})
		.join('\n');

	return [
		'<details class="ga-map" open>',
		'\t<summary class="ga-map-summary">',
		'\t\t<span class="ga-map-kicker">Section map</span>',
		`\t\t<span class="ga-map-meta">${map.length} sections${parts ? ` · ${parts} parts` : ''}</span>`,
		'\t</summary>',
		`\t<ol class="ga-map-list">\n${rows}\n\t</ol>`,
		'</details>',
	].join('\n');
}

/**
 * Inserts the map under the page header and gives every numbered `###` heading
 * its own anchor, so the map never has to reproduce Astro's generated slugs.
 * Applied to every generated page, skipped below four headings — a one- or
 * two-line map is noise rather than navigation.
 */
/**
 * Drops a previously generated map and its anchors, so the map can be rebuilt
 * in place — that is what lets the hand-authored reading guide be kept in sync
 * on every build instead of being edited by hand.
 */
const stripSectionMap = (markdown) =>
	markdown
		.replace(/\n*<details class="ga-map"[\s\S]*?<\/details>\n*/g, '\n')
		.replace(/^<a id="s[\d-]+" aria-hidden="true"><\/a>\n\n/gm, '');

export function addSectionMap(markdown) {
	const map = [];
	const out = [];

	for (const line of stripSectionMap(markdown).split('\n')) {
		const h2 = line.match(H2);
		if (h2) {
			const anchor = `<a id="${numAnchor(h2[1])}" aria-hidden="true"></a>`;
			// sections 1–12 get their anchors from build-docs' own line pass;
			// section 14 and the references pages do not, so add them here.
			if (out.findLast((l) => l.trim())?.trim() !== anchor) out.push(anchor, '');
			map.push({ num: h2[1], title: h2[2], subs: [] });
			out.push(line);
			continue;
		}

		const h3 = line.match(H3);
		if (h3) {
			map.at(-1)?.subs.push({ num: h3[1], title: h3[2] });
			out.push(`<a id="${numAnchor(h3[1])}" aria-hidden="true"></a>`, '', line);
			continue;
		}

		out.push(line);
	}

	if (map.reduce((sum, entry) => sum + 1 + entry.subs.length, 0) < 4)
		return out.join('\n');

	const body = out.join('\n');
	const html = sectionMapHtml(map);
	if (body.includes('<div class="sec-head">'))
		return body.replace(/(<div class="sec-head">[\s\S]*?<\/div>)/, `$1\n\n${html}`);

	const fence = body.match(/^---\n[\s\S]*?\n---\n/);
	return fence
		? `${body.slice(0, fence[0].length)}\n${html}\n${body.slice(fence[0].length)}`
		: `${html}\n\n${body}`;
}
