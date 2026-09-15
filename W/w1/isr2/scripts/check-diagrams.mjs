#!/usr/bin/env node
/**
 * check-diagrams.mjs — validates every Mermaid diagram in the content tree.
 *
 * Mermaid renders client-side, so a syntax error would only surface in the
 * browser as an error box inside the diagram panel. This script parses each
 * diagram with the same Mermaid build the site ships (under jsdom, so no
 * browser is required) and fails the run when one does not parse.
 *
 * Run with:  node scripts/check-diagrams.mjs   (wired into `bun run check`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const DOCS = path.join(SITE, 'src', 'content', 'docs');

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
	pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', {
	value: dom.window.navigator,
	configurable: true,
});

const mermaid = (await import('mermaid')).default;
mermaid.initialize({
	startOnLoad: false,
	theme: 'dark',
	securityLevel: 'loose',
	flowchart: { htmlLabels: true },
});

const files = [];
(function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const abs = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(abs);
		else if (/\.mdx?$/.test(entry.name)) files.push(abs);
	}
})(DOCS);

let total = 0;
const failures = [];
const reports = [];

for (const file of files) {
	const lines = fs.readFileSync(file, 'utf8').split('\n');
	let inFence = false;
	let start = 0;
	let buffer = [];

	lines.forEach((line, i) => {
		if (!inFence && /^\s*```mermaid\s*$/.test(line)) {
			inFence = true;
			start = i + 1;
			buffer = [];
			return;
		}
		if (inFence && /^\s*```\s*$/.test(line)) {
			inFence = false;
			total++;
			const source = buffer.join('\n');
			const kind = source.trim().split(/\s+/)[0];
			reports.push(
				mermaid.parse(source).catch((error) => {
					failures.push({
						file: path.relative(SITE, file),
						line: start,
						kind,
						message: String(error?.message || error)
							.split('\n')
							.slice(0, 3)
							.join(' ')
							.slice(0, 240),
					});
				})
			);
			return;
		}
		if (inFence) buffer.push(line);
	});
}

await Promise.all(reports);

console.log(`▸ parsed ${total} Mermaid diagrams across ${files.length} content files`);

if (failures.length) {
	console.error(`\n✗ ${failures.length} diagram(s) failed to parse:`);
	for (const f of failures) {
		console.error(`  - ${f.file}:${f.line} [${f.kind}] ${f.message}`);
	}
	process.exit(1);
}

console.log('✓ every Mermaid diagram parses');
