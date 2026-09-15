/**
 * external-links.mjs
 * ---------------------------------------------------------------------------
 * A Sätteri hast plugin that marks every off-site link as opening in a new
 * window.
 *
 * The site is a PWA: a reader who taps a primary source in §13 should not lose
 * the page they were reading, and an installed PWA has no back button in its
 * own chrome to return with. `rel="noopener noreferrer"` keeps the new window
 * from reaching back into this document and from leaking the referrer.
 *
 * This covers links authored in markdown. Anchors the generators emit as raw
 * HTML (`scripts/build-docs.mjs`, through its `link()` helper) carry the same
 * attributes already, and `bun run audit` fails if any off-site link in the
 * built site is missing them — so the two paths cannot drift apart unnoticed.
 */

import { defineHastPlugin } from 'satteri';

const EXTERNAL = /^https?:\/\//i;

/**
 * @param {{ site?: string }} options Absolute site URL, so links back into this
 *   site are left alone.
 */
export function externalLinks({ site = '' } = {}) {
	const origin = site ? new URL(site).origin : '';

	return defineHastPlugin({
		name: 'external-links',
		element: {
			filter: ['a'],
			visit(node, ctx) {
				const href = node.properties?.href;
				if (typeof href !== 'string') return;
				if (!EXTERNAL.test(href) || href.startsWith(origin)) return;
				ctx.setProperty(node, 'target', '_blank');
				ctx.setProperty(node, 'rel', 'noopener noreferrer');
			},
		},
	});
}
