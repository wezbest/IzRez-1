/**
 * source-key.mjs — how this build decides that two links are the same source.
 *
 * The content pipeline and the title fetcher must agree exactly: one writes the
 * cache, the other reads it, and a single trailing slash of disagreement would
 * leave a reference without its title.
 */

/**
 * Collapse the same source cited twice (trailing slash, protocol, www, #).
 * @param {string} raw
 */
export function normUrl(raw) {
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

/**
 * Titles that carry no information: bot walls, error pages, generic document
 * shells. A source labelled `Just a moment...` or `Home` is no more identifiable
 * than an unlabelled one, so these are rejected in favour of the domain.
 */
export const GENERIC_TITLE =
	/^(home|homepage|home page|welcome|untitled|untitled document|document|documento|pdf|pdf download|index of \/|index|default|new tab|page|page not found|not found|404|404 error|\d{3} (forbidden|error|ok)|error|forbidden|access denied|access restricted|unauthorized|request rejected|attention required!?|just a moment\.*\.*\.*|are you a robot\??|verify you are human|checking your browser|one moment, please|please wait|redirecting|loading|log ?in|sign ?in|sign in to continue|subscribe|subscribe now|javascript is disabled|please enable javascript|enable javascript to view|content not available|blocked|sorry, you have been blocked|cloudflare|client challenge|module not found|unknown|no title|news|blog|article|articles|newsroom|media|media release|press|press release|press releases|press release archive|read more|learn more|see more|more|click here|continue reading|resources|publications|insights|library|archive|archives|announcements|newsletter)$/i;

/**
 * Titles that are really a label: `Pakistan (SECP):` is a navigational heading,
 * not the name of a document, and the trailing colon is the tell. The build
 * trims this punctuation before it validates, so the useful part survives.
 */
export const TRAILING_LABEL_PUNCTUATION = /[\s:;,·|\-–—]+$/;

/**
 * Is this string worth printing as the name of a source?
 * @param {string} title
 */
export function isUsableTitle(title) {
	const text = String(title ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(TRAILING_LABEL_PUNCTUATION, '');
	if (text.length < 10 || text.length > 220) return false;
	if (!/[A-Za-z]{3}/.test(text)) return false;
	if (GENERIC_TITLE.test(text)) return false;
	if (text.split(/\s+/).length < 2) return false;
	// mostly punctuation or a navigation string like `Skip to content | Menu`
	if ((text.match(/[A-Za-z]{2,}/g) ?? []).length < 2) return false;
	if (/^[\W\d]+$/.test(text)) return false;
	return true;
}

/**
 * Last-resort label: the readable part of the URL path.
 * `…/press-releases/new-protections-confirmed-buy-now-pay-later-borrowers`
 * becomes `New protections confirmed buy now pay later borrowers`.
 * @param {string} raw
 */
export function titleFromUrl(raw) {
	const segments = String(raw)
		.replace(/[?#].*$/, '')
		.split('/')
		.filter(Boolean)
		.map((segment) => {
			try {
				return decodeURIComponent(segment);
			} catch {
				return segment;
			}
		})
		.filter((segment) => !/^(https?:|www\.)/i.test(segment))
		.pop();

	if (!segments) return '';
	const slug = segments.replace(/\.(pdf|html?|aspx?|php|jsp)$/i, '');
	if (slug.length < 10) return '';
	// a bare id or a download endpoint tells us nothing
	if (!/[A-Za-z]{4}/.test(slug)) return '';
	if (/^(download|article|abstract|file|pdf|attachment|view|detail)/i.test(slug)) return '';
	if (/-\d{4,}$/.test(slug) && slug.split(/[-_]/).length < 4) return '';

	const words = slug
		.replace(/[-_+]+/g, ' ')
		// a leading record id (researchgate's `393602359 A Proposed…`) is not part
		// of the title
		.replace(/^\d{4,}\s+/, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (words.length < 12) return '';
	return words.charAt(0).toUpperCase() + words.slice(1);
}

/** @param {string} raw */
export function hostOf(raw) {
	try {
		return new URL(String(raw).trim()).hostname.replace(/^www\./, '');
	} catch {
		return String(raw)
			.replace(/^https?:\/\//i, '')
			.split('/')[0];
	}
}
