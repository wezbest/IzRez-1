// @ts-check
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import { pwa } from './src/integrations/pwa.mjs';
import { satteri } from '@astrojs/markdown-satteri';
import { externalLinks } from './src/plugins/external-links.mjs';

/** Canonical site URL — used for canonical/OG tags and to tell our own links apart. */
const SITE_URL = 'https://gap-atlas-2026.pages.dev';

/* Sidebar data is generated from the research corpus by scripts/build-docs.mjs.
   Fall back to empty arrays so the config still loads on a cold clone. */
const readJson = (rel, fallback) => {
	try {
		return JSON.parse(
			fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
		);
	} catch {
		return fallback;
	}
};

const sections = readJson('./src/data/sections.json', []);
const stats = readJson('./src/data/site-stats.json', {
	registryCategories: [],
});

const gapSections = sections.filter((s) => s.kind === 'Gap Blueprint');

const mermaidPalette = {
	fontFamily: "'Space Grotesk Variable', ui-sans-serif, system-ui, sans-serif",
	fontSize: '15px',
	primaryColor: '#08262e',
	primaryTextColor: '#d8fff7',
	primaryBorderColor: '#22d3ee',
	lineColor: '#2dd4bf',
	secondaryColor: '#0b1b2e',
	tertiaryColor: '#08202a',
	background: '#04121a',
	mainBkg: '#08262e',
	nodeBorder: '#22d3ee',
	clusterBkg: '#061a24',
	clusterBorder: '#14b8a6',
	titleColor: '#7df9d5',
	edgeLabelBackground: '#04141c',
	textColor: '#d8fff7',
	noteBkgColor: '#0b2f33',
	noteTextColor: '#d8fff7',
	noteBorderColor: '#22d3ee',
	actorBkg: '#08262e',
	actorBorder: '#22d3ee',
	actorTextColor: '#d8fff7',
	signalColor: '#7df9d5',
	signalTextColor: '#d8fff7',
	labelBoxBkgColor: '#08262e',
	labelBoxBorderColor: '#22d3ee',
	labelTextColor: '#d8fff7',
	loopTextColor: '#d8fff7',
	activationBkgColor: '#0b3b42',
	sectionBkgColor: '#062029',
	altSectionBkgColor: '#08262e',
	sectionBkgColor2: '#04141c',
	taskBkgColor: '#0b3b42',
	taskTextColor: '#d8fff7',
	taskTextDarkColor: '#04121a',
	taskBorderColor: '#22d3ee',
	doneTaskBkgColor: '#134e4a',
	doneTaskBorderColor: '#2dd4bf',
	activeTaskBkgColor: '#155e63',
	gridColor: '#1f4a52',
};

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	trailingSlash: 'always',
	markdown: {
		// the default processor, plus a hast visitor that opens every external
		// reference in a new window
		processor: satteri({
			hastPlugins: [externalLinks({ site: SITE_URL })],
		}),
	},
	integrations: [
		// must be registered before Starlight so it hooks the markdown pipeline
		mermaid({
			theme: 'dark',
			autoTheme: false,
			enableLog: false,
			mermaidConfig: {
				themeVariables: mermaidPalette,
				// natural-size diagrams: wide ones scroll sideways in their panel
				// instead of being scaled down until the labels stop being readable
				flowchart: { curve: 'basis', htmlLabels: true, useMaxWidth: false },
				sequence: { useMaxWidth: false },
				gantt: { useMaxWidth: false },
				class: { useMaxWidth: false },
				state: { useMaxWidth: false },
				er: { useMaxWidth: false },
				journey: { useMaxWidth: false },
				pie: { useMaxWidth: false },
				quadrantChart: { useMaxWidth: false },
				timeline: { useMaxWidth: false },
				mindmap: { useMaxWidth: false },
				gitGraph: { useMaxWidth: false },
				requirement: { useMaxWidth: false },
				c4: { useMaxWidth: false },
			},
		}),
		starlight({
			title: 'GapAtlas 2026',
			description:
				'Islamic Fintech Gap Analysis & Startup Blueprint Intelligence — 10 monetizable gaps, 1,764 authoritative sources, full build and cost telemetry.',
			logo: {
				src: './src/assets/logo.svg',
				alt: 'GapAtlas 2026',
			},
			favicon: '/favicon.svg',
			credits: false,
			pagination: true,
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			customCss: [
				'@fontsource/orbitron/500.css',
				'@fontsource/orbitron/700.css',
				'@fontsource-variable/space-grotesk/index.css',
				'@fontsource-variable/jetbrains-mono/index.css',
				'./src/styles/theme.css',
			],
			components: {
				Head: './src/components/Head.astro',
			},
			head: [
				{ tag: 'meta', attrs: { name: 'generator', content: 'Astro + Starlight' } },
			],
			sidebar: [
				{
					label: 'Start here',
					items: [
						{ label: 'Home', link: '/' },
						{ label: 'Reading guide & site map', link: '/reading-guide/' },
					],
				},
				{
					label: '01 · Foundation',
					badge: { text: 'brief', variant: 'note' },
					items: [
						{ label: '1 · Master Report', slug: '01-master-report' },
					],
				},
				{
					label: '02–11 · Gap Blueprints',
					badge: { text: `${gapSections.length} ventures`, variant: 'success' },
					items: gapSections.map((s) => ({
						label: `${s.n} · ${s.name ?? s.title}`,
						slug: s.slug,
						badge: { text: s.ref, variant: 'default' },
					})),
				},
				{
					label: '12 · Cost Intelligence',
					items: [{ slug: '12-llm-usage-and-cost-analysis' }],
				},
			{
				label: '13 · References',
				badge: {
					text: `${stats.totalSources?.toLocaleString('en-US') ?? stats.registryEntries} sources`,
					variant: 'note',
				},
				items: [
					{ label: '13.1 · How the reference system works', slug: '13-references' },
					{
						label: '13.2 · Authoritative Source Registry',
						slug: '13-references/source-registry',
						badge: {
							text: `${stats.registryUnique ?? stats.registryEntries} unique`,
							variant: 'default',
						},
					},
					{
						label: '13.3 · Sources cited outside the registry',
						slug: '13-references/cited-sources',
						badge: { text: `${stats.citedOnlySources ?? 0}`, variant: 'default' },
					},
				],
			},
				{
					label: '14 · Site Build Report',
					badge: { text: 'new', variant: 'tip' },
					items: [{ slug: '14-site-build-report' }],
				},
			],
		}),
		pwa(),
	],
});
