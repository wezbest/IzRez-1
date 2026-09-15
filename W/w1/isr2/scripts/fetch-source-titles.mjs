#!/usr/bin/env node
/**
 * fetch-source-titles.mjs
 * ---------------------------------------------------------------------------
 * The corpus registry lists sources as `[domain] url` — 1,764 rows with no
 * title at all — and the few titles that could be inferred from citation
 * context are frequently just a fragment of the sentence that cited them
 * (`(excessive uncertainty) and`). A reference a reader cannot identify is not
 * a reference, so this script fetches each source's real page title once and
 * caches it.
 *
 * The cache — `src/data/source-titles.json` — is what the build reads. `bun run
 * build` therefore never touches the network: it stays fast, works offline, and
 * produces identical output on every machine. Re-run this script when the
 * corpus gains sources, or to retry the ones that failed.
 *
 * Run with:  bun run titles            (resumable; skips everything cached)
 *            bun run titles --refresh  (re-fetch every row)
 *            bun run titles --limit 50 (fetch at most 50 this run)
 *
 * Only the first 96 KB of each document is read, redirects are followed, and
 * requests are spaced across a small worker pool out of courtesy to the sites.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normUrl, hostOf } from './source-key.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const REPORTS = path.resolve(SITE, '..', 'reports');
const CACHE = path.join(SITE, 'src', 'data', 'source-titles.json');

const args = process.argv.slice(2);
const REFRESH = args.includes('--refresh');
const LIMIT = (() => {
	const i = args.indexOf('--limit');
	return i === -1 ? Infinity : Number(args[i + 1]);
})();
const CONCURRENCY = Number(process.env.TITLE_CONCURRENCY ?? 16);
const TIMEOUT_MS = Number(process.env.TITLE_TIMEOUT_MS ?? 9000);
const MAX_BYTES = 96 * 1024;
/** Stop starting new work after this, so a run always finishes. */
const BUDGET_MS = Number(process.env.TITLE_BUDGET_MS ?? 420000);

/* ------------------------------------------------------------------ sources */

/** Every URL this build can print: registry rows plus the corpus citations. */
function collectSources() {
	const urls = new Map(); // normUrl -> { url, host }

	const registry = fs.readFileSync(
		path.join(REPORTS, 'master', '800-authoritative-sources-registry.md'),
		'utf8'
	);
	for (const line of registry.split('\n')) {
		const m = line.match(/^(\d+)\.\s+\[([^\]]+)\]\s+(\S+)\s*$/);
		if (!m) continue;
		const url = m[3].replace(/\\+$/, '');
		const key = normUrl(url);
		if (key && !urls.has(key)) urls.set(key, { url, host: m[2].trim() });
	}

	// citations across the corpus, so §13.3 is covered as well
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const abs = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(abs);
			else if (entry.name.endsWith('.md')) {
				const text = fs.readFileSync(abs, 'utf8');
				for (const m of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
					const key = normUrl(m[1]);
					if (key && !urls.has(key)) urls.set(key, { url: m[1], host: hostOf(m[1]) });
				}
				for (const m of text.matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"/g)) {
					const key = normUrl(m[1]);
					if (key && !urls.has(key)) urls.set(key, { url: m[1], host: hostOf(m[1]) });
				}
			}
		}
	};
	walk(REPORTS);

	return urls;
}

/* ---------------------------------------------------------------- extraction */

const decode = (text) =>
	text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/\s+/g, ' ')
		.trim();

const TAG = (name) => new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i');
const META = (prop) =>
	new RegExp(
		`<meta\\b[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta\\b[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["'][^>]*>`,
		'i'
	);

/** Pull the most title-like string out of a document head. */
function extractTitle(html, host) {
	const first = (re) => {
		const m = html.match(re);
		return decode(m?.[1] ?? m?.[2] ?? '');
	};

	const candidates = [
		first(META('og:title')),
		first(META('twitter:title')),
		first(TAG('title')),
		first(TAG('h1')),
	].filter(Boolean);

	for (let candidate of candidates) {
		// `Annual Report 2025 | Bank Negara Malaysia` -> `Annual Report 2025`
		const parts = candidate.split(/\s+[|·»–—-]\s+/);
		if (parts.length > 1) {
			const bare = parts.filter((p) => !p.toLowerCase().includes(host.split('.')[0]));
			if (bare.length) candidate = bare.join(' — ');
		}
		candidate = candidate.replace(/\s+/g, ' ').trim();
		if (candidate.length >= 8 && candidate.length <= 200 && /[a-z]{3}/i.test(candidate))
			return candidate;
	}
	return '';
}

/* -------------------------------------------------------------------- fetch */

async function fetchTitle(url) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			redirect: 'follow',
			signal: controller.signal,
			headers: {
				'user-agent':
					'Mozilla/5.0 (compatible; GapAtlas2026/1.0; +https://gap-atlas-2026.pages.dev)',
				accept: 'text/html,application/xhtml+xml',
				'accept-language': 'en',
			},
		});
		if (!res.ok) return { status: res.status };

		const type = res.headers.get('content-type') ?? '';
		if (!/html/i.test(type)) return { status: res.status, skip: type.split(';')[0] };

		const reader = res.body?.getReader();
		if (!reader) return { status: res.status };
		let html = '';
		const decoder = new TextDecoder('utf-8');
		let read = 0;
		while (read < MAX_BYTES) {
			const { done, value } = await reader.read();
			if (done) break;
			read += value.byteLength;
			html += decoder.decode(value, { stream: true });
			// stop as soon as the head is complete
			if (/<\/head>/i.test(html)) break;
		}
		reader.cancel().catch(() => {});

		return { status: res.status, title: extractTitle(html, hostOf(url)) };
	} catch (error) {
		return { status: 0, error: error.name === 'AbortError' ? 'timeout' : String(error.message) };
	} finally {
		clearTimeout(timer);
	}
}

/* --------------------------------------------------------------------- main */

const sources = collectSources();
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
let budget = LIMIT;
const pending = [...sources.entries()].filter(
	([key, source]) =>
		(REFRESH || !cache[key]?.title) &&
		!/^(localhost|127\.|10\.|192\.168\.)/i.test(source.host) &&
		budget-- > 0
);

console.log(
	`▸ ${sources.size} sources · ${Object.keys(cache).length} cached · ${pending.length} to fetch`
);

let done = 0;
let titled = 0;
let failed = 0;
let index = 0;
const started = Date.now();
const failures = new Map();

async function worker(id) {
	while (index < pending.length) {
		if (Date.now() - started > BUDGET_MS) return;
		const [key, source] = pending[index++];
		const result = await fetchTitle(source.url);
		done += 1;
		if (result.title) {
			titled += 1;
			cache[key] = {
				title: result.title,
				url: source.url,
				host: source.host,
				status: result.status,
				fetchedAt: new Date().toISOString().slice(0, 10),
			};
		} else {
			failed += 1;
			cache[key] = {
				title: '',
				url: source.url,
				host: source.host,
				status: result.status,
				error: result.error ?? result.skip ?? `http ${result.status}`,
				fetchedAt: new Date().toISOString().slice(0, 10),
			};
			failures.set(result.error ?? `http ${result.status}`, (failures.get(result.error ?? `http ${result.status}`) ?? 0) + 1);
		}
		if (done % 100 === 0 || index >= pending.length)
			console.log(`    ${done}/${pending.length} · ${titled} titled · ${failed} without a title`);
		if (done % 25 === 0) {
			fs.writeFileSync(CACHE, `${JSON.stringify(cache, null, '\t')}\n`);
		}
	}
}

await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));
fs.writeFileSync(CACHE, `${JSON.stringify(cache, null, '\t')}\n`);

const remaining = [...sources.keys()].filter((key) => !cache[key]?.title).length;
console.log(
	`▸ cached ${Object.keys(cache).length} sources · ${remaining} still without a title${
		failures.size
			? ` · reasons: ${[...failures.entries()]
					.sort((a, b) => b[1] - a[1])
					.slice(0, 6)
					.map(([reason, count]) => `${reason}×${count}`)
					.join(', ')}`
			: ''
	}`
);
if (remaining) console.log('  re-run `bun run titles` to retry the rest (it skips what is cached)');
