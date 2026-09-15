#!/usr/bin/env node
/**
 * fetch-source-titles.mjs
 * ---------------------------------------------------------------------------
 * The corpus registry lists sources as `[domain] url` — 1,764 rows with no
 * title at all — and the few titles inferable from citation context are often
 * just a fragment of the sentence that cited them (`(excessive uncertainty)
 * and`). A reference a reader cannot identify is not a reference, so this
 * script fetches each source's real name, once, and caches it.
 *
 * The cache — `src/data/source-titles.json` — is what the build reads. `bun run
 * build` never touches the network: it stays fast, works offline and produces
 * identical output everywhere. Re-run this script when the corpus gains sources,
 * or to retry the ones that failed.
 *
 * Where a title comes from, in order:
 *   1. `<meta property="og:title">`, `twitter:title`, `<title>`, `<h1>`
 *   2. PDF metadata — XMP `<dc:title>` at the head, the `/Info` dictionary at
 *      the tail (fetched with two range requests, never the whole file)
 *   3. the readable part of the URL path — journal download links and
 *      JavaScript-rendered pages have no title to read, but
 *      `/press-releases/new-protections-confirmed-buy-now-pay-later-borrowers`
 *      still names the source
 * Anything generic — `Just a moment...`, `404 Not Found`, `Home`, `Log in` — is
 * treated as no title at all, so such a row shows its domain instead of noise.
 *
 * Run with:  bun run titles            (resumable; skips everything cached)
 *            bun run titles --refresh  (re-fetch every row)
 *            bun run titles --limit 50 (fetch at most 50 this run)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	hostOf,
	isUsableTitle,
	normUrl,
	TRAILING_LABEL_PUNCTUATION,
	titleFromUrl,
} from './source-key.mjs';

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
const CONCURRENCY = Number(process.env.TITLE_CONCURRENCY ?? 24);
const TIMEOUT_MS = Number(process.env.TITLE_TIMEOUT_MS ?? 9000);
const MAX_BYTES = 96 * 1024; // enough for <head>
const PDF_BYTES = 128 * 1024; // enough for the head's XMP or the tail's /Info
/** Stop starting new work after this, so a run always finishes. */
const BUDGET_MS = Number(process.env.TITLE_BUDGET_MS ?? 420000);

const UA_BOT =
	'Mozilla/5.0 (compatible; GapAtlas2026/1.0; +https://gap-atlas-2026.pages.dev)';
/** Some sites answer the honest bot with a 403 and a real browser fine. */
const UA_BROWSER =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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
	String(text)
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/\s+/g, ' ')
		.trim();

const TAG = (name) => new RegExp(`<${name}\\b[^>]*>([\\s\\S]{0,600}?)</${name}>`, 'i');
const META = (prop) =>
	new RegExp(
		`<meta\\b[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']{0,400})["'][^>]*>|<meta\\b[^>]*content=["']([^"']{0,400})["'][^>]*(?:property|name)=["']${prop}["'][^>]*>`,
		'i'
	);

/** Strip the site name a page appends to its own title. */
function tidy(candidate, host) {
	let text = decode(candidate).replace(/\s+/g, ' ').trim();
	if (!text) return '';
	const parts = text.split(/\s+[|·»–—]\s+/);
	if (parts.length > 1) {
		const stem = host.split('.')[0].toLowerCase();
		const kept = parts.filter((part) => !part.toLowerCase().includes(stem));
		if (kept.length) text = kept.join(' — ');
	}
	return text
		.replace(/^["'“”\s]+|["'“”\s]+$/g, '')
		.replace(TRAILING_LABEL_PUNCTUATION, '')
		.trim();
}

/** Look for a name in a document head. */
function extractHtmlTitle(html, host) {
	const candidates = [
		['og:title', html.match(META('og:title'))],
		['twitter:title', html.match(META('twitter:title'))],
		['title', html.match(TAG('title'))],
		['h1', html.match(TAG('h1'))],
	];
	for (const [via, match] of candidates) {
		if (!match) continue;
		const title = tidy(match[1] ?? match[2] ?? '', host);
		if (isUsableTitle(title)) return { title, via };
	}
	return null;
}

/** PDF strings are either `(literal)` or `<hex>`, sometimes UTF-16BE. */
function decodePdfText(raw) {
	let bytes;
	if (raw.startsWith('<')) {
		const hex = raw.replace(/[^0-9A-Fa-f]/g, '');
		bytes = Uint8Array.from(hex.match(/../g) ?? [], (pair) => parseInt(pair, 16));
	} else {
		const inner = raw
			.slice(1, -1)
			.replace(/\\([nrtbf()\\])/g, (_, c) => ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' })[c] ?? c);
		bytes = Uint8Array.from(inner, (char) => char.charCodeAt(0) & 0xff);
	}
	if (bytes.length > 1 && bytes[0] === 0xfe && bytes[1] === 0xff)
		return new TextDecoder('utf-16be').decode(bytes.subarray(2)).replace(/\s+/g, ' ').trim();
	return new TextDecoder('latin1')
		.decode(bytes)
		.replace(/[\u0000-\u001f]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** `/Title` from an Info dictionary, or `<dc:title>` from XMP. */
function extractPdfTitle(text) {
	const xmp = text.match(
		/<dc:title>[\s\S]{0,400}?<rdf:li[^>]*>([\s\S]{0,300}?)<\/rdf:li>/i
	);
	if (xmp) {
		const title = decode(xmp[1]);
		if (isUsableTitle(title)) return title;
	}
	for (const match of text.matchAll(
		/\/Title\s*(\((?:\\[\s\S]|[^\\()])*\)|<[0-9A-Fa-f\s]{2,})/g
	)) {
		const title = decodePdfText(match[1]);
		if (isUsableTitle(title)) return title;
	}
	return '';
}

/* -------------------------------------------------------------------- fetch */

/**
 * One request, reading at most `maxBytes` of the body — and stopping as soon as
 * `stopAt` appears, so an HTML page does not have to be downloaded in full.
 */
async function fetchHead(url, { ua = UA_BOT, range = null, maxBytes, stopAt = null, encoding }) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			redirect: 'follow',
			signal: controller.signal,
			headers: {
				'user-agent': ua,
				accept: 'text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.5',
				'accept-language': 'en-US,en;q=0.9',
				...(range ? { range } : {}),
			},
		});
		const type = res.headers.get('content-type') ?? '';
		if (!res.ok) return { status: res.status, type, ok: false };

		const reader = res.body?.getReader();
		if (!reader) return { status: res.status, type, ok: true, text: '' };

		const decoder = new TextDecoder(encoding);
		let text = '';
		let bytes = 0;
		while (bytes < maxBytes) {
			const { done, value } = await reader.read();
			if (done) break;
			bytes += value.byteLength;
			text += decoder.decode(value, { stream: true });
			if (stopAt && text.includes(stopAt)) break;
		}
		reader.cancel().catch(() => {});
		return { status: res.status, type, ok: true, text };
	} catch (error) {
		return {
			status: 0,
			ok: false,
			error: error.name === 'AbortError' ? 'timeout' : String(error.message),
		};
	} finally {
		clearTimeout(timer);
	}
}

/** Title of a PDF: XMP at the head, Info dictionary at the tail. */
async function fetchPdfTitle(url) {
	for (const range of ['bytes=0-131071', 'bytes=-131072']) {
		const part = await fetchHead(url, {
			range,
			maxBytes: PDF_BYTES,
			encoding: 'latin1',
		});
		if (!part.ok) continue;
		const title = extractPdfTitle(part.text);
		if (title) return title;
	}
	// PDFs served as octet-stream still respond to a plain full request
	const raw = await fetchHead(url, { maxBytes: PDF_BYTES * 2, encoding: 'latin1' });
	return raw.ok ? extractPdfTitle(raw.text) : '';
}

async function fetchTitle(url) {
	const host = hostOf(url);
	let attempt = await fetchHead(url, { maxBytes: MAX_BYTES, stopAt: '</head>' });

	if (!attempt.ok && [202, 401, 403, 406, 429, 503].includes(attempt.status))
		attempt = await fetchHead(url, {
			ua: UA_BROWSER,
			maxBytes: MAX_BYTES,
			stopAt: '</head>',
		});

	if (attempt.ok && /html|xml/i.test(attempt.type || '')) {
		const found = extractHtmlTitle(attempt.text, host);
		if (found) return { ...found, status: attempt.status };
	}

	const isPdf = /pdf/i.test(attempt.type || '') || /\.pdf($|\?)/i.test(url);
	if (attempt.ok && (isPdf || !attempt.text?.includes('<html'))) {
		const pdf = await fetchPdfTitle(url);
		if (pdf) return { title: pdf, via: 'pdf', status: attempt.status };
	}

	const slug = titleFromUrl(url);
	if (isUsableTitle(slug)) return { title: slug, via: 'slug', status: attempt.status || 0 };

	return {
		status: attempt.status || 0,
		error: attempt.error ?? (attempt.ok ? 'no title found' : `http ${attempt.status}`),
	};
}

/* --------------------------------------------------------------------- main */

const sources = collectSources();
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
let budget = LIMIT;
const pending = [...sources.entries()].filter(
	([key, source]) =>
		// a cached title that no longer passes the quality rule is re-fetched, not
		// trusted: the cache predates that rule and still holds navigation strings
		(REFRESH || !isUsableTitle(cache[key]?.title)) &&
		!/^(localhost|127\.|10\.|192\.168\.)/i.test(source.host) &&
		budget-- > 0
);

const alreadyTitled = Object.values(cache).filter((entry) => isUsableTitle(entry.title))
	.length;
console.log(
	`▸ ${sources.size} sources · ${alreadyTitled} already titled · ${pending.length} to fetch`
);

let done = 0;
let titled = 0;
let failed = 0;
let index = 0;
const started = Date.now();
const via = new Map();
const reasons = new Map();

async function worker() {
	while (index < pending.length) {
		if (Date.now() - started > BUDGET_MS) return;
		const [key, source] = pending[index++];
		const result = await fetchTitle(source.url);
		done += 1;

		if (result.title) {
			titled += 1;
			via.set(result.via ?? 'meta', (via.get(result.via ?? 'meta') ?? 0) + 1);
		} else {
			failed += 1;
			reasons.set(result.error, (reasons.get(result.error) ?? 0) + 1);
		}

		cache[key] = {
			title: result.title ?? '',
			via: result.via ?? null,
			url: source.url,
			host: source.host,
			status: result.status,
			...(result.error ? { error: result.error } : {}),
			fetchedAt: new Date().toISOString().slice(0, 10),
		};

		if (done % 100 === 0 || index >= pending.length)
			console.log(`    ${done}/${pending.length} · ${titled} titled · ${failed} without a title`);
		if (done % 25 === 0) fs.writeFileSync(CACHE, `${JSON.stringify(cache, null, '\t')}\n`);
	}
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
fs.writeFileSync(CACHE, `${JSON.stringify(cache, null, '\t')}\n`);

const withTitles = Object.values(cache).filter((entry) => isUsableTitle(entry.title))
	.length;
const remaining = [...sources.keys()].filter((key) => !isUsableTitle(cache[key]?.title))
	.length;
console.log(
	`▸ ${withTitles}/${sources.size} sources titled · ${remaining} without${
		via.size
			? ` · titles from ${[...via.entries()]
					.sort((a, b) => b[1] - a[1])
					.map(([kind, count]) => `${kind}×${count}`)
					.join(', ')}`
			: ''
	}`
);
if (reasons.size)
	console.log(
		`  without a title: ${[...reasons.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 6)
			.map(([reason, count]) => `${reason}×${count}`)
			.join(', ')}`
	);
if (remaining) console.log('  re-run `bun run titles` to retry the rest (it skips what is cached)');
