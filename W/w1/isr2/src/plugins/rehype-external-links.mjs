/**
 * rehype-external-links.mjs
 * ---------------------------------------------------------------------------
 * Marks every off-site link in the markdown as opening in a new window.
 *
 * The site is a PWA: a reader who taps a primary source in §13 should not lose
 * the page they were reading, and on an installed PWA there is no back button
 * in the app chrome to return with. `rel="noopener noreferrer"` keeps the new
 * window from reaching back into this document and from leaking the referrer.
 *
 * This handles links authored in markdown. Anchors the generators emit with
 * raw HTML (`scripts/build-docs.mjs`, via its `link()` helper) carry the same
 * attributes already, and `bun run audit` fails if anything off-site is missing
 * them, so the two paths cannot drift apart unnoticed.
 */

const EXTERNAL = /^https?:\/\//i;

/**
 * @param {{ site?: string }} options  Absolute site URL, used to leave links
 *   back into this site alone.
 */
export function rehypeExternalLinks({ site = '' } = {}) {
	const origin = site ? new URL(site).origin : '';

	const walk = (node) => {
		if (node.type === 'element' && node.tagName === 'a') {
			const href = node.properties?.href;
			if (typeof href === 'string' && EXTERNAL.test(href) && !href.startsWith(origin)) {
				node.properties.target = '_blank';
				node.properties.rel = 'noopener noreferrer';
			}
		}
		for (const child of node.children ?? []) walk(child);
	};

	return (tree) => walk(tree);
}
