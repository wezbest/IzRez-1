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
