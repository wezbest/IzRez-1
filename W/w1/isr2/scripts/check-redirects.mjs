#!/usr/bin/env node
/**
 * check-redirects.mjs
 * ---------------------------------------------------------------------------
 * Serves `dist/` and follows every retired-URL redirect over real HTTP.
 *
 * The audit already proves that each redirect's target file exists on disk, but
 * that is not the same claim as "the URL a reader has bookmarked resolves". This
 * check is the difference: it stands up a static server on the build output and,
 * for every redirect page found, requests the old path, reads the destination
 * out of the meta refresh, follows it, and insists it lands on a real page — not
 * on a 404 and not on another redirect (a chain would mean the site now
 * double-hops for every old link).
 *
 * Astro emits redirects for a prerendered site as HTML with a meta refresh, not
 * as an HTTP 3xx, so a plain `curl -L` would never notice a broken one.
 *
 * Run with:  bun run check:redirects   (wired into `bun run check`)
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '..', 'dist');

if (!fs.existsSync(DIST)) {
	console.error('✗ dist/ not found — run `bun run build` first');
	process.exit(1);
}

const isRedirect = (source) =>
	/<meta http-equiv="refresh"/i.test(source) && /<meta name="robots" content="noindex"/i.test(source);

/** Every redirect page in the build, as a URL path. */
function collectRedirects() {
	const found = [];
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const abs = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === 'pagefind') continue;
				walk(abs);
			} else if (entry.name === 'index.html') {
				const source = fs.readFileSync(abs, 'utf8');
				if (!isRedirect(source)) continue;
				const rel = path.relative(DIST, path.dirname(abs)).replace(/\\/g, '/');
				found.push({
					path: rel ? `/${rel}/` : '/',
					target: source.match(/<meta http-equiv="refresh" content="0;url=([^"]+)"/i)?.[1] ?? null,
				});
			}
		}
	};
	walk(DIST);
	return found.sort((a, b) => a.path.localeCompare(b.path));
}

/** Minimal static file server: index.html for directories, 404 otherwise. */
function serve() {
	const server = http.createServer((req, res) => {
		const url = new URL(req.url, 'http://localhost');
		let file = path.join(DIST, decodeURIComponent(url.pathname));
		if (!file.startsWith(DIST)) {
			res.writeHead(403).end();
			return;
		}
		if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
		if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
			res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
			return;
		}
		res.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
		res.end(fs.readFileSync(file));
	});
	return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const server = await serve();
const origin = `http://127.0.0.1:${server.address().port}`;
const redirects = collectRedirects();

if (!redirects.length) {
	console.error('✗ no redirect pages found in dist/ — did the §13 consolidation drop them?');
	server.close();
	process.exit(1);
}

const failures = [];
let hops = 0;

for (const redirect of redirects) {
	let response;
	try {
		response = await fetch(`${origin}${redirect.path}`, { redirect: 'manual' });
	} catch (error) {
		failures.push(`${redirect.path} → request failed (${error.message})`);
		continue;
	}
	if (response.status !== 200) {
		failures.push(`${redirect.path} → HTTP ${response.status}`);
		continue;
	}
	if (!redirect.target) {
		failures.push(`${redirect.path} → no meta-refresh target`);
		continue;
	}

	const target = redirect.target;
	const seen = new Set([redirect.path]);
	let current = target;
	let landed = false;
	for (let i = 0; i < 5 && !landed; i += 1) {
		if (seen.has(current)) {
			failures.push(`${redirect.path} → redirect loop at ${current}`);
			break;
		}
		seen.add(current);
		let hop;
		try {
			hop = await fetch(`${origin}${current}`, { redirect: 'manual' });
		} catch (error) {
			failures.push(`${redirect.path} → ${current} request failed (${error.message})`);
			break;
		}
		hops += 1;
		if (hop.status !== 200) {
			failures.push(`${redirect.path} → ${current} HTTP ${hop.status}`);
			break;
		}
		const body = await hop.text();
		if (isRedirect(body)) {
			failures.push(`${redirect.path} → chained through ${current}`);
			break;
		}
		landed = true;
	}

	if (landed && current !== target) {
		failures.push(`${redirect.path} → expected ${target}, landed on ${current}`);
	}
}

server.close();

console.log(
	`▸ followed ${redirects.length} retired §13 URL${redirects.length === 1 ? '' : 's'} over ${hops} HTTP request${hops === 1 ? '' : 's'}`
);
for (const redirect of redirects) console.log(`  ${redirect.path} → ${redirect.target}`);

if (failures.length) {
	console.error(`\n✗ ${failures.length} redirect problem${failures.length === 1 ? '' : 's'}:`);
	for (const failure of failures) console.error(`    ${failure}`);
	process.exit(1);
}

console.log('✓ every retired URL resolves in one hop to a real page');
