#!/usr/bin/env node
/**
 * check-links.mjs — audits the built site.
 *
 * Walks every HTML file in `dist/` and verifies that
 *   • every internal href/src resolves to a file that the build emitted, and
 *   • every `#fragment` (same-page or cross-page) resolves to a real `id`
 *     in the target document.
 *
 * External links are listed but not fetched (offline-safe). Exits non-zero when
 * anything is broken, so it can gate a deploy.
 *
 * Run with:  node scripts/check-links.mjs   (wired into `bun run check`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '..', 'dist');

if (!fs.existsSync(DIST)) {
	console.error('✗ dist/ not found — run `bun run build` first');
	process.exit(1);
}

const htmlFiles = [];
(function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const abs = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'pagefind') continue;
			walk(abs);
		} else if (entry.name.endsWith('.html')) {
			htmlFiles.push(abs);
		}
	}
})(DIST);

const idsByFile = new Map();
const readIds = (file) => {
	if (!idsByFile.has(file)) {
		const html = fs.readFileSync(file, 'utf8');
		idsByFile.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
	}
	return idsByFile.get(file);
};

const exists = (p) => fs.existsSync(p);

/** Resolve an href to a file inside dist (or null when it is external). */
function resolveTarget(href, fromFile) {
	if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(href)) return null;
	const url = new URL(href, `https://local.test/${path.relative(DIST, fromFile)}`);
	let pathname = decodeURIComponent(url.pathname);
	if (!pathname.startsWith('/')) pathname = `/${pathname}`;
	const rel = pathname.replace(/^\//, '');
	const candidates = [];
	candidates.push(path.join(DIST, rel));
	if (!path.extname(rel)) {
		candidates.push(path.join(DIST, rel, 'index.html'));
		candidates.push(path.join(DIST, `${rel}.html`));
	}
	if (rel.endsWith('/')) candidates.push(path.join(DIST, rel, 'index.html'));
	for (const candidate of candidates) {
		if (exists(candidate) && fs.statSync(candidate).isFile()) return candidate;
	}
	return { missing: candidates[0], hash: url.hash };
}

let links = 0;
let external = 0;
const failures = [];

for (const file of htmlFiles) {
	const html = fs.readFileSync(file, 'utf8');
	const attrs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);

	for (const href of attrs) {
		if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(href)) {
			external++;
			continue;
		}
		links++;
		const target = resolveTarget(href, file);
		if (target === null) continue;
		if (typeof target === 'object' && target.missing) {
			failures.push(`${path.relative(DIST, file)} → missing ${href}`);
			continue;
		}
		const fragment = href.includes('#') ? href.slice(href.indexOf('#') + 1) : '';
		if (!fragment) continue;
		if (!readIds(target).has(fragment)) {
			failures.push(
				`${path.relative(DIST, file)} → ${href} (no #${fragment} in ${path.relative(DIST, target)})`
			);
		}
	}
}

const uniqueFailures = [...new Set(failures)];

console.log(
	`▸ checked ${htmlFiles.length} pages · ${links} internal links · ${external} external links`
);

if (uniqueFailures.length) {
	console.error(`\n✗ ${uniqueFailures.length} broken link(s):`);
	for (const failure of uniqueFailures.slice(0, 40)) console.error(`  - ${failure}`);
	if (uniqueFailures.length > 40)
		console.error(`  … and ${uniqueFailures.length - 40} more`);
	process.exit(1);
}

console.log('✓ every internal link and fragment resolves');
