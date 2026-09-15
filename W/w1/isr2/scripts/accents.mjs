/**
 * accents.mjs — which accent colour a section's kind gets.
 *
 * The theme carries a five-hue spectrum that stays inside the bluish-green
 * identity: cyan and spring green are the base (headings, links, numbers), and
 * violet, amber and rose are the accents that separate one kind of section from
 * another. Each kind maps to exactly one hue, and every generator reads the
 * mapping from here so a "Gap Blueprint" chip is the same colour whether it was
 * written by build-docs, build-report or the hand-authored home page.
 *
 *   cyan    the master report                    — the base of the palette
 *   spring  the ten gap blueprints               — the largest body of work
 *   violet  research cost intelligence           — analysis rather than findings
 *   amber   the reference ledger                 — the source of the sources
 *   rose    the site build report                — the machine that built it
 *
 * The hue is applied as `.acc-<name>` on an element, which sets `--acc-*` for
 * its descendants; `theme.css` is the only place that knows the actual colours.
 */

/** @typedef {'cyan' | 'spring' | 'violet' | 'amber' | 'rose'} Accent */

/** @type {Record<string, Accent>} */
const BY_KIND = {
	'Master Report': 'cyan',
	'Gap Blueprint': 'spring',
	'Cost Intelligence': 'violet',
	'References': 'amber',
	'Additional Citations': 'amber',
	'Source Registry': 'amber',
	'Engineering & Cost': 'rose',
	Orientation: 'violet',
};

/** @type {Accent[]} */
export const ACCENTS = ['cyan', 'spring', 'violet', 'amber', 'rose'];

/**
 * @param {string} [kind]
 * @returns {Accent}
 */
export function accentFor(kind) {
	return BY_KIND[kind] ?? 'cyan';
}

/**
 * The class to put on a chip or card: `acc-cyan`, `acc-spring`, …
 * @param {string} [kind]
 */
export function accentClass(kind) {
	return `acc-${accentFor(kind)}`;
}
