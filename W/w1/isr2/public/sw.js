/* GapAtlas 2026 service worker
 * ---------------------------------------------------------------------------
 * Installable-PWA behaviour for a fully static Starlight documentation site:
 *
 *   • install  — precache every HTML page, stylesheet, script, font and icon
 *                listed in /sw-manifest.js (generated at build time)
 *   • navigate — stale-while-revalidate: instant offline navigation for any
 *                page, refreshed in the background when online
 *   • assets   — cache-first (build output is content-hashed, so this is safe)
 *   • fallback — /offline.html when neither the network nor the cache can help
 *
 * The cache name carries the manifest version hash, so a new deploy purges the
 * previous cache in `activate` and users never mix builds.
 */
/* eslint-env serviceworker */
/* global self, caches, fetch, Response */

importScripts('/sw-manifest.js');

const MANIFEST = self.__GAP_ATLAS_MANIFEST || {
	version: 'dev',
	offlinePage: '/offline.html',
	precache: [],
};
const CACHE_NAME = `gap-atlas-${MANIFEST.version}`;
const ASSET_CACHE = `${CACHE_NAME}-runtime`;
const OFFLINE_URL = MANIFEST.offlinePage || '/offline.html';
const NEVER_CACHE = [/\/sw\.js$/, /\/sw-manifest\.js$/, /\/pagefind\/.*\.pf_/];

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			await Promise.allSettled(
				MANIFEST.precache.map((url) =>
					cache.add(new Request(url, { cache: 'reload' })).catch(() => {})
				)
			);
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(
				keys
					.filter((key) => !key.startsWith(CACHE_NAME))
					.map((key) => caches.delete(key))
			);
			await self.clients.claim();
		})()
	);
});

self.addEventListener('message', (event) => {
	if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/** Cache a response only when it is a real, complete, same-origin 200. */
function isCacheable(request, response) {
	return (
		response &&
		response.status === 200 &&
		response.type === 'basic' &&
		!request.headers.has('range')
	);
}

async function navigationResponse(request) {
	const cache = await caches.open(CACHE_NAME);
	const url = new URL(request.url);
	const directoryUrl = url.pathname.endsWith('/')
		? url.pathname
		: `${url.pathname}/`;

	// instant offline answer from the precache
	const cached =
		(await cache.match(request, { ignoreSearch: true })) ||
		(await cache.match(directoryUrl)) ||
		(await cache.match(`${directoryUrl}index.html`));

	const network = fetch(request)
		.then(async (response) => {
			if (isCacheable(request, response)) {
				await cache.put(directoryUrl, response.clone());
			}
			return response;
		})
		.catch(() => undefined);

	if (cached) return cached;

	const fresh = await network;
	if (fresh) return fresh;

	const offline = await cache.match(OFFLINE_URL);
	return (
		offline ||
		new Response('<h1>Offline</h1><p>This page is not cached yet.</p>', {
			status: 503,
			headers: { 'Content-Type': 'text/html; charset=utf-8' },
		})
	);
}

async function assetResponse(request) {
	const runtime = await caches.open(ASSET_CACHE);
	const cached = await runtime.match(request);
	if (cached) return cached;

	try {
		const response = await fetch(request);
		if (isCacheable(request, response)) {
			await runtime.put(request, response.clone());
		}
		return response;
	} catch (error) {
		const fallback = await caches.match(request);
		if (fallback) return fallback;
		throw error;
	}
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return; // never intercept third parties
	if (NEVER_CACHE.some((re) => re.test(url.pathname))) return;

	if (request.mode === 'navigate') {
		event.respondWith(navigationResponse(request));
		return;
	}

	if (
		url.pathname.startsWith('/_astro/') ||
		url.pathname.startsWith('/pagefind/') ||
		url.pathname.startsWith('/icons/') ||
		url.pathname.startsWith('/assets/') ||
		/\.(css|js|mjs|woff2?|ttf|otf|svg|png|webp|avif|jpe?g|ico|webmanifest|json)$/.test(
			url.pathname
		)
	) {
		event.respondWith(assetResponse(request));
	}
});
