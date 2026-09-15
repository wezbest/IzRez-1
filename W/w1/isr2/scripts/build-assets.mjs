#!/usr/bin/env node
/**
 * build-assets.mjs
 * ---------------------------------------------------------------------------
 * Generates every brand asset the site ships, straight from the theme palette
 * so the icons can never drift away from the UI:
 *
 *   public/favicon.svg                  scalable mark (browser tab)
 *   public/icons/icon.svg               scalable app icon
 *   public/icons/icon-192.png            PWA icon
 *   public/icons/icon-512.png            PWA icon
 *   public/icons/maskable-192.png        PWA maskable icon (safe-zone padded)
 *   public/icons/maskable-512.png        PWA maskable icon
 *   public/icons/apple-touch-icon.png    iOS home screen (180x180, opaque)
 *   public/icons/favicon-32.png          legacy PNG favicon
 *   public/icons/favicon-16.png          legacy PNG favicon
 *   public/og-image.png                  1200x630 social share card
 *
 * The container has no system fonts, so text in the share card is converted to
 * vector outlines with fontkit (Orbitron, shipped by @fontsource) before sharp
 * rasterises it. Shapes only for the icons.
 *
 * Run with:  node scripts/build-assets.mjs   (wired into `bun run build`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const PUBLIC = path.join(SITE, 'public');
const ICONS = path.join(PUBLIC, 'icons');
const FONTS = path.join(SITE, 'node_modules', '@fontsource', 'orbitron', 'files');

const C = {
	bg: '#04121a',
	bgSoft: '#061e27',
	ink: '#ddf6f1',
	dim: '#86b3ae',
	cyan: '#22d3ee',
	teal: '#2dd4bf',
	mint: '#8ff9df',
};

/* ------------------------------------------------------------- primitives */

/** Rounded-square app icon background with the theme glow. */
function iconBackdrop(size, { radius = size * 0.22 } = {}) {
	return `
	<rect width="${size}" height="${size}" rx="${radius}" fill="#04121a"/>
	<rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
	<rect x="${size * 0.012}" y="${size * 0.012}" width="${size * 0.976}" height="${size * 0.976}"
		rx="${radius * 0.94}" fill="none" stroke="${C.teal}" stroke-opacity="0.45" stroke-width="${size * 0.006}"/>`;
}

/** The GapAtlas mark: a broken ring around a faceted gap with an atlas node. */
function mark(size, { scale = 1, cx = size / 2, cy = size / 2 } = {}) {
	const r = size * 0.33 * scale;
	const s = (v) => (v * size).toFixed(2);
	return `
	<g transform="translate(${s(cx / size)} ${s(cy / size)}) scale(${size})">
		<circle cx="0" cy="0" r="${(0.415 * scale).toFixed(4)}" fill="url(#halo)"/>
		<path d="M0 ${(-0.33 * scale).toFixed(4)}A${(0.33 * scale).toFixed(4)} ${(0.33 * scale).toFixed(4)} 0 1 0 ${(0.286 * scale).toFixed(4)} ${(0.166 * scale).toFixed(4)}"
			fill="none" stroke="url(#ring)" stroke-width="${(0.075 * scale).toFixed(4)}" stroke-linecap="round"/>
		<path d="M0 ${(-0.185 * scale).toFixed(4)}L${(0.165 * scale).toFixed(4)} 0L0 ${(0.185 * scale).toFixed(4)}L${(-0.165 * scale).toFixed(4)} 0Z"
			fill="none" stroke="${C.teal}" stroke-opacity="0.85" stroke-width="${(0.033 * scale).toFixed(4)}" stroke-linejoin="round"/>
		<circle cx="0" cy="0" r="${(0.072 * scale).toFixed(4)}" fill="${C.mint}"/>
		<circle cx="${(0.33 * scale).toFixed(4)}" cy="${(0.235 * scale).toFixed(4)}" r="${(0.045 * scale).toFixed(4)}" fill="${C.cyan}"/>
		<circle cx="${(-0.35 * scale).toFixed(4)}" cy="${(0.16 * scale).toFixed(4)}" r="${(0.034 * scale).toFixed(4)}" fill="${C.teal}"/>
	</g>`;
}

const defs = (id = '') => `
	<defs>
		<linearGradient id="ring${id}" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="${C.mint}"/>
			<stop offset="0.55" stop-color="${C.cyan}"/>
			<stop offset="1" stop-color="#0e7490"/>
		</linearGradient>
		<radialGradient id="halo${id}" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="${C.cyan}" stop-opacity="0.38"/>
			<stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#0a2f38"/>
			<stop offset="0.5" stop-color="#05171f"/>
			<stop offset="1" stop-color="#07222c"/>
		</linearGradient>
	</defs>`;

/* ------------------------------------------------------------------ icons */

function iconSvg(size, { maskable = false } = {}) {
	const pad = maskable ? size * 0.2 : size * 0.06;
	const inner = size - pad * 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
	${defs('i')}
	${maskable ? `<rect width="${size}" height="${size}" fill="${C.bg}"/>` : iconBackdrop(size)}
	<g transform="translate(${pad} ${pad})">${mark(inner, { scale: maskable ? 0.92 : 1, cx: inner / 2, cy: inner / 2 })}</g>
</svg>`;
}

/* --------------------------------------------------------------- wordmark */

const fonts = {
	bold: fontkit.openSync(path.join(FONTS, 'orbitron-latin-700-normal.woff')),
	medium: fontkit.openSync(path.join(FONTS, 'orbitron-latin-500-normal.woff')),
};

/** Convert a string into positioned glyph outlines (y-axis flipped for SVG). */
function textToPaths({ font, text, size, x, y, fill, letterSpacing = 0 }) {
	const scale = size / font.unitsPerEm;
	const ls = letterSpacing / scale;
	const run = font.layout(text);
	let cursor = 0;
	const parts = [];
	run.glyphs.forEach((glyph, i) => {
		const position = run.positions[i] || {};
		const d = glyph.path.toSVG();
		if (d) {
			parts.push(
				`<path transform="translate(${(x + (cursor + (position.xOffset || 0)) * scale).toFixed(2)} ${(y - (position.yOffset || 0) * scale).toFixed(2)}) scale(${scale.toFixed(6)} ${(-scale).toFixed(6)})" d="${d}"/>`
			);
		}
		cursor += (position.xAdvance || glyph.advanceWidth || 0) + ls;
	});
	return `<g fill="${fill}">${parts.join('')}</g>`;
}

const textWidth = ({ font, text, size, letterSpacing = 0 }) => {
	const scale = size / font.unitsPerEm;
	const ls = letterSpacing / scale;
	const run = font.layout(text);
	return run.glyphs.reduce(
		(acc, glyph, i) =>
			acc + ((run.positions[i]?.xAdvance ?? glyph.advanceWidth ?? 0) + ls) * scale,
		0
	);
};

/* ------------------------------------------------------------- share card */

function ogSvg() {
	const W = 1200;
	const H = 630;
	const pad = 72;

	const title = textToPaths({
		font: fonts.bold,
		text: 'GapAtlas 2026',
		size: 92,
		x: pad,
		y: 214,
		fill: C.mint,
		letterSpacing: 3,
	});
	const eyebrow = textToPaths({
		font: fonts.medium,
		text: 'ISLAMIC FINTECH GAP INTELLIGENCE',
		size: 26,
		x: pad,
		y: 150,
		fill: C.teal,
		letterSpacing: 7,
	});
	const sub1 = textToPaths({
		font: fonts.medium,
		text: '10 monetizable gaps · 10 startup blueprints',
		size: 32,
		x: pad,
		y: 292,
		fill: C.ink,
		letterSpacing: 1,
	});
	const sub2 = textToPaths({
		font: fonts.medium,
		text: '1,764 authoritative sources · 226 cited · full build telemetry',
		size: 26,
		x: pad,
		y: 340,
		fill: C.dim,
		letterSpacing: 1,
	});

	const chips = [
		{ label: '14 SECTIONS' },
		{ label: '10 GAP BLUEPRINTS' },
		{ label: 'PWA + OFFLINE' },
	];
	let chipX = pad;
	const chipSvg = chips
		.map((chip) => {
			const label = textToPaths({
				font: fonts.medium,
				text: chip.label,
				size: 20,
				x: chipX + 22,
				y: 528,
				fill: C.teal,
				letterSpacing: 2.4,
			});
			const w = textWidth({
				font: fonts.medium,
				text: chip.label,
				size: 20,
				letterSpacing: 2.4,
			});
			const box = `<rect x="${chipX}" y="492" width="${(w + 44).toFixed(1)}" height="50" rx="25" fill="none" stroke="${C.teal}" stroke-opacity="0.42"/>`;
			chipX += w + 62;
			return box + label;
		})
		.join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	${defs('og')}
	<rect width="${W}" height="${H}" fill="${C.bg}"/>
	<rect width="${W}" height="${H}" fill="url(#bgog)"/>
	<g opacity="0.16" stroke="${C.teal}" stroke-width="1">
		${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 100} 0V${H}"/>`).join('')}
		${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${i * 100}h${W}"/>`).join('')}
	</g>
	<circle cx="1000" cy="300" r="340" fill="url(#haloog)"/>
	<g transform="translate(1000 305)">
		${mark(400, { scale: 1, cx: 0, cy: 0 })}
	</g>
	<path d="M${pad} 386h${W - pad * 2}" stroke="${C.teal}" stroke-opacity="0.22"/>
	${eyebrow}
	${title}
	${sub1}
	${sub2}
	${chipSvg}
	<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${C.cyan}" stroke-opacity="0.28" stroke-width="2"/>
</svg>`;
}

/* ------------------------------------------------------------------- main */

console.log('▸ generating icons, favicon and social image');

fs.mkdirSync(ICONS, { recursive: true });

const write = (file, data) => {
	fs.writeFileSync(file, data);
	console.log(`  + ${path.relative(SITE, file)}`);
};

write(path.join(PUBLIC, 'favicon.svg'), iconSvg(64).replace('width="64" height="64"', 'width="64" height="64"'));
write(path.join(ICONS, 'icon.svg'), iconSvg(512));

const pngTargets = [
	['icons/icon-192.png', iconSvg(192), 192],
	['icons/icon-512.png', iconSvg(512), 512],
	['icons/maskable-192.png', iconSvg(192, { maskable: true }), 192],
	['icons/maskable-512.png', iconSvg(512, { maskable: true }), 512],
	['icons/apple-touch-icon.png', iconSvg(180, { maskable: true }), 180],
	['icons/favicon-32.png', iconSvg(32), 32],
	['icons/favicon-16.png', iconSvg(16), 16],
];

for (const [rel, svg, size] of pngTargets) {
	const out = path.join(PUBLIC, rel);
	// `density` only controls raster quality; resize pins the exact pixel size
	const png = await sharp(Buffer.from(svg), { density: 512 })
		.resize(size, size, { fit: 'cover' })
		.png({ compressionLevel: 9 })
		.toBuffer();
	write(out, png);
}

const ogPng = await sharp(Buffer.from(ogSvg()), { density: 288 })
	.resize(1200, 630, { fit: 'cover' })
	.png({ compressionLevel: 9 })
	.toBuffer();
write(path.join(PUBLIC, 'og-image.png'), ogPng);

console.log('▸ assets ready');
