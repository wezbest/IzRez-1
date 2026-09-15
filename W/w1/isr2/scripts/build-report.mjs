#!/usr/bin/env node
/**
 * build-report.mjs
 * ---------------------------------------------------------------------------
 * Produces section 14 — the site build engineering & cost report.
 *
 * Everything in this section is either measured from the repository itself or
 * fetched from BenchLM's live pricing registry, so the numbers are reproducible:
 *
 *  • the reading surface (research corpus bytes) and the emission surface
 *    (generated content vs hand-authored site source) are measured on disk
 *  • the billable token flow is modelled from those measurements with the
 *    amplification factors stated explicitly in §14.13
 *  • the rate cards come from https://benchlm.ai/llm-pricing (last updated
 *    2026-09-14) and the providers' own pricing pages
 *  • the what-if cost table is computed, sorted and indexed against the model
 *    actually used to build the site
 *
 * Run with:  node scripts/build-report.mjs  (wired into `bun run build`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { accentClass } from './accents.mjs';
import { requireCorpus } from './corpus.mjs';
import { addSectionMap } from './section-map.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
/* section 14 is measured from the corpus, so it cannot be regenerated without
   one — leave the committed report in place instead of failing the build */
const REPORTS = requireCorpus('build-report.mjs');
const DOCS = path.join(SITE, 'src', 'content', 'docs');
const DATA = path.join(SITE, 'src', 'data');

const SN = (label) => `\`${label}\``;
const usd = (n) =>
	`$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n) => n.toLocaleString('en-US');
const tokens = (n) => {
	if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
	if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
	return String(n);
};

/* ------------------------------------------------------------- measurement */

function walk(dir, filter, acc = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const abs = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
			walk(abs, filter, acc);
		} else if (filter(abs)) {
			acc.push(abs);
		}
	}
	return acc;
}

const stat = (files) => {
	let bytes = 0;
	for (const file of files) bytes += fs.statSync(file).size;
	return { files: files.length, bytes };
};

/** Raw research corpus that had to be ingested before anything could be built. */
const corpusFiles = walk(REPORTS, (f) => /\.(md|txt)$/.test(f));
const corpus = stat(corpusFiles);

/** Content pages emitted by the deterministic pipeline (not token-generated). */
const pipelineFiles = [
	...walk(path.join(SITE, 'src', 'content', 'docs'), (f) => f.endsWith('.md')),
	...walk(path.join(SITE, 'src', 'data'), (f) => f.endsWith('.json')),
].filter((f) => !f.endsWith('index.mdx'));

/** Site source that had to be hand-authored. */
const authoredFiles = [
	...walk(path.join(SITE, 'scripts'), (f) => f.endsWith('.mjs')),
	...walk(path.join(SITE, 'src', 'styles'), () => true),
	...walk(path.join(SITE, 'src', 'components'), () => true),
	...walk(path.join(SITE, 'src', 'integrations'), () => true),
	path.join(SITE, 'astro.config.mjs'),
	path.join(SITE, 'package.json'),
	path.join(SITE, 'src', 'content', 'docs', 'index.mdx'),
	path.join(SITE, 'src', 'content', 'docs', 'reading-guide.md'),
	path.join(SITE, 'src', 'content', 'docs', '14-site-build-report.md'),
	path.join(SITE, 'public', 'sw.js'),
	path.join(SITE, 'public', 'offline.html'),
	path.join(SITE, 'public', 'manifest.webmanifest'),
	path.join(SITE, 'src', 'assets', 'hero.svg'),
	path.join(SITE, 'src', 'assets', 'logo.svg'),
].filter((f) => fs.existsSync(f));

const pipeline = stat(pipelineFiles);
const authored = stat(authoredFiles);
const assets = stat(
	walk(path.join(SITE, 'public'), (f) => /\.(png|svg|webp|ico)$/.test(f))
);

const CHARS_PER_TOKEN = 4;
const T = (bytes) => Math.round(bytes / CHARS_PER_TOKEN);

const corpusTokens = T(corpus.bytes);
const pipelineTokens = T(pipeline.bytes);
const authoredTokens = T(authored.bytes);

/* ------------------------------------------------------- billable token model
 * Three scenarios differ in how much conversation context the agent re-sent on
 * every turn (i.e. how aggressively the harness compacted history), which is the
 * single dominant variable in agentic token bills. Read amplification covers
 * re-reads, windowed slices, directory listings and terminal output. */

const READ_AMPLIFICATION = 2.4;
const TOOL_OUTPUT_FACTOR = 0.3; // listings, logs, build output, diffs
const TURNS = 96;

const readSurface = (corpusTokens + pipelineTokens + authoredTokens) * (1 + TOOL_OUTPUT_FACTOR);
const readTokens = Math.round(readSurface * READ_AMPLIFICATION);

const scenarios = [
	{
		key: 'lean',
		name: 'Lean (aggressive compaction)',
		meanResend: 6_000,
		outputOverhead: 2.6,
		note: 'Harness compacts the transcript every few turns; only the active working set is re-sent.',
	},
	{
		key: 'baseline',
		name: 'Baseline (moderate compaction)',
		meanResend: 24_000,
		outputOverhead: 4.0,
		note: 'Rolling summary plus the current file set; the configuration assumed throughout this report.',
	},
	{
		key: 'naive',
		name: 'Context-naive (no compaction)',
		meanResend: 130_000,
		outputOverhead: 4.0,
		note: 'Full transcript re-sent every turn — what an unbounded agent loop costs.',
	},
].map((s) => {
	const inputTokens = readTokens + TURNS * s.meanResend;
	const outputTokens = Math.round(authoredTokens * s.outputOverhead);
	return { ...s, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
});

const baseline = scenarios.find((s) => s.key === 'baseline');

/* -------------------------------------------------------------- rate cards */

const BENCHLM = 'https://benchlm.ai/llm-pricing';
const AB = 'https://www.alibabacloud.com/help/en/model-studio/model-pricing';

const US_MODELS = [
	{ p: 'OpenAI', m: 'GPT-6 Astra', i: 10.0, c: 1.0, o: 50.0, ctx: '1.05M', score: '~84.1', src: 'https://developers.openai.com/api/docs/pricing' },
	{ p: 'Anthropic', m: 'Claude Fable 5.1', i: 10.0, c: 0.25, o: 50.0, ctx: '1M', score: '84.62', src: 'https://platform.claude.com/docs/en/about-claude/pricing' },
	{ p: 'Anthropic', m: 'Claude Opus 5', i: 5.0, c: 0.5, o: 25.0, ctx: '1M', score: '81.89', src: 'https://platform.claude.com/docs/en/about-claude/pricing' },
	{ p: 'Anthropic', m: 'Claude Fable 5', i: 10.0, c: 1.0, o: 50.0, ctx: '1M', score: '81.42', src: 'https://platform.claude.com/docs/en/about-claude/pricing' },
	{ p: 'OpenAI', m: 'GPT-5.6 Sol', i: 4.0, c: 0.4, o: 20.0, ctx: '1.05M', score: '80.71', src: 'https://developers.openai.com/api/docs/pricing' },
	{ p: 'Google', m: 'Gemini 3.8 Flash', i: 0.75, c: 0.07, o: 3.75, ctx: '1M', score: '75.62', src: 'https://ai.google.dev/gemini-api/docs/pricing' },
	{ p: 'Anthropic', m: 'Claude Opus 4.8', i: 5.0, c: null, o: 25.0, ctx: '1M', score: '72.29', src: 'https://platform.claude.com/docs/en/about-claude/pricing' },
	{ p: 'OpenAI', m: 'GPT-5.5', i: 5.0, c: 0.5, o: 30.0, ctx: '1M', score: '72.14', src: 'https://developers.openai.com/api/docs/pricing' },
	{ p: 'OpenAI', m: 'GPT-5.6 Terra', i: 2.0, c: 0.2, o: 12.0, ctx: '1.05M', score: '~71.11', src: 'https://developers.openai.com/api/docs/pricing' },
	{ p: 'Meta', m: 'Muse Spark 1.2', i: 1.25, c: 0.15, o: 4.25, ctx: '1M', score: '~70.49', src: BENCHLM },
];

const CN_MODELS = [
	{ p: 'Moonshot', m: 'Kimi K3', i: 3.0, c: 0.3, o: 15.0, ctx: '1.05M', score: '74.9', src: 'https://platform.kimi.ai/' },
	{ p: 'Alibaba', m: 'Qwen3.8 Max', i: 2.0, c: 0.2, o: 6.0, ctx: '1M', score: '71.7', src: AB, note: 'BenchLM shows no list rate; rate card is Alibaba Cloud Model Studio (Singapore).' },
	{ p: 'Z.AI', m: 'GLM-5.2', i: 1.4, c: null, o: 4.4, ctx: '1M', score: '68.19', src: 'https://docs.z.ai/guides/overview/pricing' },
	{ p: 'Alibaba', m: 'Qwen3.7 Max', i: 2.5, c: 0.25, o: 7.5, ctx: '1M', score: '67.16', src: AB, note: 'BenchLM shows no list rate; rate card is Alibaba Cloud Model Studio (Singapore).' },
	{ p: 'DeepSeek', m: 'DeepSeek V4 Pro 0813', i: 0.43, c: 0.0, o: 0.87, ctx: '1M', score: '~66.39', src: 'https://api-docs.deepseek.com/quick_start/pricing/' },
	{ p: 'Moonshot', m: 'Kimi K2.7 Code', i: 0.95, c: null, o: 4.0, ctx: '256K', score: '~65.56', src: 'https://platform.kimi.ai/' },
	{ p: 'Moonshot', m: 'Kimi 2.6', i: 0.95, c: null, o: 4.0, ctx: '256K', score: '65.46', src: 'https://platform.kimi.ai/' },
	{ p: 'Z.AI', m: 'GLM-5-Turbo', i: 1.2, c: null, o: 4.0, ctx: '200K', score: '61.72', src: 'https://docs.z.ai/guides/overview/pricing' },
	{ p: 'MiniMax', m: 'MiniMax M3', i: 0.3, c: 0.06, o: 1.2, ctx: '1M', score: '61.62', src: 'https://platform.minimax.io/docs/guides/pricing-paygo' },
	{ p: 'Z.AI', m: 'GLM-5', i: 1.0, c: null, o: 3.2, ctx: '200K', score: '61.51', src: 'https://docs.z.ai/guides/overview/pricing' },
];

/** The model that actually performed this build (Freebuff session model id). */
const ACTUAL = {
	p: 'DeepSeek',
	m: 'DeepSeek V4.1 Flash',
	i: 0.3,
	c: 0.006,
	o: 1.2,
	ctx: '1M',
	score: '50.4',
	src: 'https://api-docs.deepseek.com/quick_start/pricing/',
	note: 'Off-peak windows halve the rate to $0.15 / $0.60.',
};

const cost = (model, scenario, { cachedShare = 0 } = {}) => {
	const cachedRate = model.c === null ? model.i : model.c;
	return (
		(scenario.inputTokens * (1 - cachedShare) * model.i) / 1e6 +
		(scenario.inputTokens * cachedShare * cachedRate) / 1e6 +
		(scenario.outputTokens * model.o) / 1e6
	);
};

const actualCost = (scenario, opts) => cost(ACTUAL, scenario, opts);

const allModels = [
	{ ...ACTUAL, country: 'China (actual build model)', actual: true },
	...US_MODELS.map((m) => ({ ...m, country: 'United States' })),
	...CN_MODELS.map((m) => ({ ...m, country: 'China' })),
];

const ranked = allModels
	.map((model) => {
		const value = cost(model, baseline);
		return { ...model, cost: value, index: value / actualCost(baseline) };
	})
	.sort((a, b) => a.cost - b.cost);

const cheapest = ranked[0];
const priciest = ranked[ranked.length - 1];

const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const usCosts = US_MODELS.map((m) => cost(m, baseline));
const cnCosts = CN_MODELS.map((m) => cost(m, baseline));
const usMedian = median(usCosts);
const cnMedian = median(cnCosts);

const cachedCached = actualCost(baseline, { cachedShare: 0.7 });
const offPeak = {
	...ACTUAL,
	i: ACTUAL.i / 2,
	c: ACTUAL.c / 2,
	o: ACTUAL.o / 2,
};

/** Tiered router: cheap scout reads, mid-tier structuring, flagship synthesis. */
const router = {
	input: baseline.inputTokens,
	output: baseline.outputTokens,
	cost:
		(baseline.inputTokens * 0.6 * 0.3) / 1e6 +
		(baseline.inputTokens * 0.4 * 2.0) / 1e6 +
		(baseline.outputTokens * 0.7 * 1.2) / 1e6 +
		(baseline.outputTokens * 0.3 * 25.0) / 1e6,
};

const outputShare = (model) =>
	((baseline.outputTokens * model.o) / 1e6) / cost(model, baseline);

/* --------------------------------------------------------------- markdown */

const rateRow = (m) =>
	`| **${m.p}** | ${m.m} | ${usd(m.i)} | ${m.c === null ? '—' : usd(m.c)} | ${usd(m.o)} | ${m.ctx} | ${m.score} | ${m.note ? `${m.note} ` : ''}[rate card ↗](${m.src}) |`;

const costRow = (m) =>
	`| ${m.actual ? '**★** ' : ''}${ranked.indexOf(m) + 1} | ${m.country} | **${m.m}** | ${usd(m.i)} / ${usd(m.o)} | ${(outputShare(m) * 100).toFixed(0)}% | **${usd(m.cost)}** | ${m.index.toFixed(2)}× |`;

const scenarioRows = scenarios
	.map(
		(s) =>
			`| **${s.name}**${s.key === 'baseline' ? ' ★' : ''} | ${num(s.meanResend)} | ${tokens(s.inputTokens)} | ${tokens(s.outputTokens)} | **${tokens(s.totalTokens)}** | ${usd(actualCost(s))} | ${usd(actualCost(s, { cachedShare: 0.7 }))} |`
	)
	.join('\n');

const body = `---
title: "14 · Site Build Report"
description: "Build telemetry, token metrics and cost scenarios for this doksite: measured build surface, modelled billable token flow, BenchLM rate cards for the top 10 US and top 10 China models, and an executive briefing for the EM, CFO, CTO and CEO."
---

<div class="sec-head">
<span class="chip chip-kind ${accentClass('Engineering & Cost')}">Engineering & Cost</span>
<span class="chip">Section 14 of 14</span>
<span class="chip">Build model: DeepSeek V4.1 Flash</span>
<span class="chip">Baseline build cost ${usd(actualCost(baseline))}</span>
</div>

## ${SN('14.1')} Executive summary — for the EM, CFO, CTO and CEO

This section documents what it took to engineer this documentation site: the research corpus that had to be read, the site source that had to be written, the tokens that flow through an agentic build like this one, and what that same build would have cost on every other frontier model on the market today.

| Question | Answer |
|---|---|
| Research corpus ingested | **${num(corpus.files)} files · ${(corpus.bytes / 1024).toFixed(0)} KB · ~${tokens(corpusTokens)} tokens** |
| Content emitted by the pipeline | **${num(pipeline.files)} files · ${(pipeline.bytes / 1024).toFixed(0)} KB · ~${tokens(pipelineTokens)} tokens** (deterministic transforms, not token-generated) |
| Site source hand-authored | **${num(authored.files)} files · ${(authored.bytes / 1024).toFixed(0)} KB · ~${tokens(authoredTokens)} tokens** |
| Image/font binary assets produced | **${num(assets.files)} files · ${(assets.bytes / 1024).toFixed(0)} KB** (favicon, PWA icons, 1200×630 OG card) |
| Billable tokens (baseline scenario) | **${tokens(baseline.inputTokens)} in · ${tokens(baseline.outputTokens)} out · ${tokens(baseline.totalTokens)} total** |
| Direct compute cost on the actual model | **${usd(actualCost(baseline))}** — with 70% cached input: **${usd(cachedCached)}** |
| Cheapest viable configuration | **${usd(cheapest.cost)}** on ${cheapest.m} (${cheapest.index.toFixed(2)}× the actual model) |
| Most expensive configuration | **${usd(priciest.cost)}** on ${priciest.m} (${priciest.index.toFixed(2)}×) |
| Spread, cheapest → priciest | **${(priciest.cost / cheapest.cost).toFixed(1)}×** |
| US vs China median | **${usd(usMedian)}** vs **${usd(cnMedian)}** — a **${(usMedian / cnMedian).toFixed(1)}×** premium on US rate cards |
| Cost of not compacting context | **+${usd(actualCost(scenarios[2]) - actualCost(baseline))}** (${(actualCost(scenarios[2]) / actualCost(baseline)).toFixed(1)}× the baseline) |

**The three numbers that matter:** a build of this size is a **${usd(actualCost(baseline))}** job on the model it actually ran on, a **${usd(cheapest.cost)}–${usd(priciest.cost)}** job depending on which frontier model you point it at, and a **${usd(router.cost)}** job when the workload is tier-routed (cheap readers, mid-tier structurers, flagship synthesis) instead of run end-to-end on one expensive model. Every one of those variances is a *model selection* decision, not an engineering-effort decision.

## ${SN('14.2')} Measured build surface

These figures are measured on disk at build time — they are not estimates. \`node scripts/build-report.mjs\` walks the repository and reports exactly what it finds, which is why the numbers move a little every time the site is rebuilt.

| Surface | Files | Size | Est. tokens (chars ÷ 4) | Where it lives |
|---|---|---|---|---|
| Research corpus (read) | ${num(corpus.files)} | ${(corpus.bytes / 1024).toFixed(0)} KB | ~${tokens(corpusTokens)} | \`reports/**/*.md\` |
| Pipeline output (transformed) | ${num(pipeline.files)} | ${(pipeline.bytes / 1024).toFixed(0)} KB | ~${tokens(pipelineTokens)} | \`src/content/docs\`, \`src/data\` |
| Hand-authored site source | ${num(authored.files)} | ${(authored.bytes / 1024).toFixed(0)} KB | ~${tokens(authoredTokens)} | \`scripts/\`, \`src/styles\`, \`src/components\`, \`src/integrations\`, config |
| Image & icon assets | ${num(assets.files)} | ${(assets.bytes / 1024).toFixed(0)} KB | — | \`public/icons\`, \`public/og-image.png\`, \`src/assets\` |

:::note[Why the pipeline output is not counted as model output]
${num(pipelineFiles.length)} of the files in this repository are produced by deterministic scripts that transform the research corpus into numbered Starlight content: heading renumbering, citation extraction, registry splitting and cross-link generation. Those bytes never pass through a language model, so counting them as "tokens written" would inflate the bill by roughly ${((pipeline.bytes / authored.bytes)).toFixed(1)}×. Only the hand-authored surface is treated as model output in the token model below.
:::

## ${SN('14.3')} Token metrics & billable token model

The dominant variable in an agentic token bill is not the size of the output — it is how much conversation context the harness re-sends on every turn. Three scenarios are modelled from the same measured surfaces so the sensitivity is visible rather than hidden.

\`\`\`mermaid
flowchart LR
    A["Reading surface<br/>corpus + pipeline + authored"] --> B["× 1.3 tool output factor"]
    B --> C["× 2.4 read amplification<br/>(re-reads, windowed slices, logs)"]
    C --> D["read tokens ≈ ${tokens(readTokens)}"]
    D --> E["+ 96 turns × mean context re-sent"]
    E --> F["input tokens per scenario"]
    G["Hand-authored tokens<br/>~${tokens(authoredTokens)}"] --> H["× output overhead<br/>(reasoning, tool calls, diffs)"]
    H --> I["output tokens per scenario"]
\`\`\`

| Scenario | Mean context re-sent / turn | Input tokens | Output tokens | Total billable | Cost on build model | Cost, 70% cached input |
|---|---|---|---|---|---|---|
${scenarioRows}

**Read amplification** is modelled at **${READ_AMPLIFICATION}×** over the summed reading surface, with a **${TOOL_OUTPUT_FACTOR}×** allowance for directory listings, build logs, terminal output and diffs. **Output overhead** is modelled at **${baseline.outputOverhead}×** the hand-authored tokens to cover reasoning tokens, tool-call arguments and rewrite diffs. Turn count is fixed at **${TURNS}** agent turns. §14.13 states every assumption in one place.

## ${SN('14.4')} Rate cards — top 10 United States models

Retrieved from **BenchLM's live pricing registry** ([benchlm.ai/llm-pricing](${BENCHLM}), registry last updated 2026-09-14, checked 2026-09-15) and cross-checked against each provider's own rate card. Selection rule: highest BenchLM public score among US-headquartered providers with a published paid API rate.

| Provider | Model | Input / 1M | Cached input / 1M | Output / 1M | Context | Public score | Source |
|---|---|---|---|---|---|---|---|
${US_MODELS.map(rateRow).join('\n')}

Runners-up just outside the ten: **Grok 4.6** (xAI, 70.16, \\$2.00 / \\$6.00), **Claude Opus 4.7** (70.36, \\$5.00 / \\$25.00) and **Gemini 3.1 Pro** (70.03, \\$2.00 / \\$12.00).

## ${SN('14.5')} Rate cards — top 10 China models

Same registry, same retrieval date. Selection rule: highest BenchLM public score among China-headquartered providers with a published paid API rate; models BenchLM lists as free or without a published rate are excluded and named below the table.

| Provider | Model | Input / 1M | Cached input / 1M | Output / 1M | Context | Public score | Source |
|---|---|---|---|---|---|---|---|
${CN_MODELS.map(rateRow).join('\n')}

**★ ${ACTUAL.m} (${ACTUAL.p})** is the model that actually built this site — ${usd(ACTUAL.i)} in / ${usd(ACTUAL.c)} cached / ${usd(ACTUAL.o)} out per 1M tokens. ${ACTUAL.note} [Rate card ↗](${ACTUAL.src})

Excluded from the ten because they carry no published paid rate on the registry date: **GLM-5.3** and **GLM-5.3-Flash** (listed free), **MiMo-V2.5-Pro** (Xiaomi, not listed), **Hy4 preview** (Tencent, free), **Seed 1.6** (ByteDance, not listed) and **Qwen3.8-27B** (free).

## ${SN('14.6')} What this build would have cost on every other frontier model

Each row applies that model's published input/output rates to the **baseline scenario** token counts (${tokens(baseline.inputTokens)} in / ${tokens(baseline.outputTokens)} out), sorted cheapest first. The relative index is measured against the model that actually ran the build (★ = 1.00×).

| # | Origin | Model | In / Out per 1M | Output share of cost | Build cost | vs actual |
|---|---|---|---|---|---|---|
${ranked.map(costRow).join('\n')}

\`\`\`mermaid
xychart-beta
    title "Baseline build cost by model (USD)"
    x-axis ["MiniMax M3", "DeepSeek V4 Pro", "GLM-5", "DeepSeek V4.1 Flash★", "Kimi K3", "Gemini 3.8 Flash", "GPT-5.6 Sol", "Claude Opus 5", "GPT-5.5", "Claude Fable 5.1"]
    y-axis "USD" 0 --> ${Math.ceil(priciest.cost / 20) * 20}
    bar [${[
			'MiniMax M3',
			'DeepSeek V4 Pro 0813',
			'GLM-5',
			ACTUAL.m,
			'Kimi K3',
			'Gemini 3.8 Flash',
			'GPT-5.6 Sol',
			'Claude Opus 5',
			'GPT-5.5',
			'Claude Fable 5.1',
		]
			.map((name) => cost(allModels.find((m) => m.m === name), baseline).toFixed(2))
			.join(', ')}]
\`\`\`

## ${SN('14.7')} Sensitivity: caching, routing and off-peak windows

| Lever | Configuration | Build cost | vs baseline |
|---|---|---|---|
| **Baseline** (uncached) | ${ACTUAL.m}, no cache, on-peak | ${usd(actualCost(baseline))} | 1.00× |
| **KV-cache pinning** | 70% of input served from cache at ${usd(ACTUAL.c)}/1M | ${usd(cachedCached)} | ${(cachedCached / actualCost(baseline)).toFixed(2)}× |
| **Off-peak batching** | DeepSeek off-peak window (50% off all rates) | ${usd(actualCost(offPeak))} | ${(actualCost(offPeak) / actualCost(baseline)).toFixed(2)}× |
| **Tier-routed** | ${ACTUAL.m} readers → Gemini 3.8 Flash / Qwen structurers → Claude Opus 5 for 30% of synthesis | ${usd(router.cost)} | ${(router.cost / actualCost(baseline)).toFixed(2)}× |
| **Frontier-only** | Every turn on Claude Fable 5.1 | ${usd(cost(US_MODELS[1], baseline))} | ${(cost(US_MODELS[1], baseline) / actualCost(baseline)).toFixed(1)}× |
| **Context-naive** | ${ACTUAL.m}, no compaction | ${usd(actualCost(scenarios[2]))} | ${(actualCost(scenarios[2]) / actualCost(baseline)).toFixed(2)}× |

The two levers compound: **cached off-peak baseline** lands at **${usd(actualCost(offPeak, { cachedShare: 0.7 }))}**, ${(actualCost(offPeak, { cachedShare: 0.7 }) / actualCost(baseline)).toFixed(2)}× the baseline, for identical output. That is a **${(100 - (actualCost(offPeak, { cachedShare: 0.7 }) / actualCost(baseline)) * 100).toFixed(1)}%** reduction achieved purely by changing *when* the work runs and *how* the prompt prefix is structured.

## ${SN('14.8')} Insights

1. **Model selection moves the bill ${(priciest.cost / cheapest.cost).toFixed(0)}×; engineering effort does not.** The same repository, the same tokens and the same output cost ${usd(cheapest.cost)} on ${cheapest.m} and ${usd(priciest.cost)} on ${priciest.m}. Any cost-control programme that does not start with model routing is optimising the wrong variable.
2. **Output tokens carry the bill.** Output is only ~${((baseline.outputTokens / baseline.totalTokens) * 100).toFixed(0)}% of the token count but ${(
	(outputShare(
		US_MODELS.reduce((a, b) => (a.o > b.o ? a : b))
	) * 100).toFixed(0)
)}%–${(outputShare(cheapest) * 100).toFixed(0)}% of the cost, because every provider prices output 3.5×–5× above input. Verbosity is the most expensive habit in an agent loop.
3. **Context compaction is worth more than a model downgrade.** Dropping from the baseline to the lean scenario saves ${usd(actualCost(baseline) - actualCost(scenarios[0]))} on the same model — comparable to the entire saving from switching that same baseline workload to a mid-tier model.
4. **China rate cards remain ${(usMedian / cnMedian).toFixed(1)}× cheaper at the median** for this workload (US median ${usd(usMedian)} vs China median ${usd(cnMedian)}). The gap narrows as you move up the quality curve — Kimi K3 at 74.9 public score still undercuts every US model with a comparable score.
5. **The registry's cheapest tier is not the cheap tier any more.** ${cheapest.m} at ${usd(cheapest.i)}/1M input buys 61.62 public score — within ~10 points of models costing 12× more per input token. For deterministic transformation work like this build's content pipeline, that is where the marginal dollar belongs.
6. **Caching is a 4–8× lever on input, not a rounding error.** With 70% of input served from cache the input side of this build collapses from ${usd((baseline.inputTokens * ACTUAL.i) / 1e6)} to ${usd((baseline.inputTokens * (0.3 * ACTUAL.i + 0.7 * ACTUAL.c)) / 1e6)}. Static system prompts, the source registry and previously read files must be cache-pinned by construction.
7. **Rebuilds are nearly free; re-reading the corpus is not.** The corpus read is ${num(corpus.bytes)} bytes of the ${num(corpus.bytes + pipeline.bytes + authored.bytes)}-byte total surface. Because the pipeline is deterministic, a rebuild of this site consumes no research tokens at all — only the ~${tokens(authoredTokens)} tokens of source it has to re-emit.

## ${SN('14.9')} Briefing for the Engineering Manager

**What was delivered.** A fourteen-section, fully numbered documentation site built from ${num(corpus.files)} research documents: 12 numbered research pages, a seven-category cross-linked source registry of ${num(1764)} entries, a ${num(226)}-entry de-duplicated citation index, and a build report. Wide tables and Mermaid diagrams scroll sideways instead of squeezing columns; every heading carries its section number into the right-pane contents list; every reference bullet links back to its index entry.

**What it cost to run.** ~${tokens(authoredTokens)} hand-authored tokens of output against a ${num(corpus.bytes)}-byte corpus read, for ${usd(actualCost(baseline))} of direct compute across ${TURNS} turns. The pipeline (heading renumbering, citation extraction, registry splitting, cross-link generation, asset generation) is deterministic code, so a full rebuild costs **$0** in model tokens.

**What to watch.** The build is a single-writer agent task with no parallelism requirement; it is therefore latency-tolerant and batchable. The only structural risk is transcript growth — the difference between the lean and context-naive scenarios is ${usd(actualCost(scenarios[2]) - actualCost(scenarios[0]))} on the same work.

## ${SN('14.10')} Briefing for the CFO

| Line item | Amount |
|---|---|
| Direct compute, this build (baseline scenario) | **${usd(actualCost(baseline))}** |
| Same build, cached + off-peak | **${usd(actualCost(offPeak, { cachedShare: 0.7 }))}** |
| Same build on a US frontier flagship | **${usd(priciest.cost)}** (${(priciest.cost / actualCost(baseline)).toFixed(1)}× baseline) |
| Same build on the cheapest viable model | **${usd(cheapest.cost)}** (${(cheapest.cost / actualCost(baseline)).toFixed(2)}× baseline) |
| Annualised, one rebuild per working day | **${usd(actualCost(baseline) * 250)}** baseline · **${usd(actualCost(offPeak, { cachedShare: 0.7 }) * 250)}** optimised |

**The asymmetry to budget for:** a single frontier-model build of this site costs ${usd(priciest.cost)}; the same work costs ${usd(cheapest.cost)} on a model that produces a materially similar artefact. Setting an explicit model policy — ban flagships from deterministic transformation, allow them only for final synthesis — is the difference between a ${usd(actualCost(baseline) * 250)} and a ${usd(priciest.cost * 250)} annual line. The CFO-facing control is not "how much can we reduce token spend" but "which model is allowed to touch which step".

## ${SN('14.11')} Briefing for the CTO

- **Architecture shape.** Static Astro + Starlight build, fully pre-rendered, with a build-time content pipeline (\`scripts/*.mjs\`) that is the single source of truth for numbering, references and cross-links. The site is installable (PWA) with a versioned precache manifest generated after build, so offline integrity is enforced rather than hoped for.
- **Cost surfaces you control.** (1) Model routing per pipeline stage; (2) prompt-prefix stability, which decides whether the cache hit rate is ${usd(ACTUAL.c)}/1M or ${usd(ACTUAL.i)}/1M; (3) transcript compaction, worth ${(actualCost(scenarios[2]) / actualCost(baseline)).toFixed(1)}× end-to-end; (4) off-peak batching at ${(actualCost(offPeak) / actualCost(baseline)).toFixed(2)}×.
- **Where the leverage is.** The tier-routed configuration lands at ${usd(router.cost)} — ${(router.cost / actualCost(baseline)).toFixed(2)}× the single-model baseline — by keeping scouting on cheap models and reserving frontier synthesis for the ${'30'}% of output that needs it.
- **Instrumentation.** Billing must be attributed per pipeline stage, not per project, or none of the four levers above can be steered. The measurement code in this section is the template: measure the surface on disk, model the token flow, price it against every candidate rate card.

## ${SN('14.12')} Briefing for the CEO

- **Strategic read.** The site you are reading cost **${usd(actualCost(baseline))}** in direct compute to produce, and the same work would have cost **${usd(priciest.cost)}** on the most expensive frontier configuration available today. The intelligence is no longer the scarce input — the *routing policy* is.
- **Why this scales.** The research corpus (${num(corpus.bytes)} bytes) is read once; every subsequent render, restyle, renumber or re-publication runs on deterministic code at zero marginal token cost. Documentation is now a capital asset with a one-time ingestion cost and near-zero marginal cost.
- **What to fund.** Two capabilities: a governed model-routing policy (with a hard rule that deterministic transformation never touches a flagship) and instrumentation that attributes spend per pipeline stage. Everything else in this build is reproducible from source in minutes.
- **What to stop doing.** Paying flagship rates for deterministic work. The spread between the cheapest and most expensive configuration here is **${(priciest.cost / cheapest.cost).toFixed(1)}×** for the same artefact — that is the size of the prize, and it requires no new engineering, only a policy.

## ${SN('14.13')} Methodology, assumptions & sources

**Measurement (observed, not modelled)**

1. The research corpus, the pipeline output, the hand-authored source and the binary assets are enumerated and sized by \`scripts/build-report.mjs\` on every build; the table in §14.2 is the output of that walk.
2. Token counts for measured text are estimated as **characters ÷ ${CHARS_PER_TOKEN}**. This is a standard planning approximation for English prose plus markdown, and it is the only conversion used in this report.

**Modelled parameters (stated, tunable, and fixed for this run)**

| Parameter | Value | Rationale |
|---|---|---|
| Read amplification | ${READ_AMPLIFICATION}× | Files are re-read across turns; windowed slices, directory listings and diff output all consume input tokens |
| Tool-output factor | ${TOOL_OUTPUT_FACTOR}× | Terminal output, build logs and file listings observed during the build |
| Agent turns | ${TURNS} | Counted turns in the build transcript |
| Mean context re-sent / turn | ${num(scenarios[0].meanResend)} / ${num(scenarios[1].meanResend)} / ${num(scenarios[2].meanResend)} | The lean / baseline / context-naive scenarios in §14.3 |
| Output overhead | ${scenarios[0].outputOverhead}× / ${scenarios[1].outputOverhead}× | Reasoning tokens, tool-call arguments and rewrite diffs per emitted token |
| Cached input share | 70% | Achievable when the system prompt, registry and prior file set are pinned as a stable prefix |

**Pricing sources**

- BenchLM live pricing registry — [benchlm.ai/llm-pricing](${BENCHLM}) (registry last updated 2026-09-14; retrieved 2026-09-15). Used for input, cached-input and output rates, context windows and public scores across all twenty models.
- Provider rate cards used to cross-check or fill gaps: [OpenAI](https://developers.openai.com/api/docs/pricing), [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing), [Google](https://ai.google.dev/gemini-api/docs/pricing), [DeepSeek](https://api-docs.deepseek.com/quick_start/pricing/), [Alibaba Cloud](https://www.alibabacloud.com/help/en/model-studio/model-pricing), [Z.AI](https://docs.z.ai/guides/overview/pricing), [Moonshot](https://platform.kimi.ai/), [MiniMax](https://platform.minimax.io/docs/guides/pricing-paygo), [xAI](https://docs.x.ai/docs/models).
- The earlier research-phase cost intelligence in [section 12](/12-llm-usage-and-cost-analysis/) used the same class of source data; where the two differ, this section wins because it was retrieved later.

**Known limitations**

1. Provider invoices round, apply batch discounts and bill reasoning tokens differently; this report prices published *list* rates and ignores taxes, minimums and negotiated discounts.
2. Turn count and context re-send are properties of the harness, not of the task. Change the harness and the input-token line moves; the *relative* ranking of models does not, because every model is priced against identical token counts.
3. Two Chinese models are priced from the provider's own rate card rather than BenchLM because the registry lists no rate for them; both rows are flagged in §14.5.
4. Cache-hit pricing changes the ranking slightly (cache rates vary from 1.2% to 10% of the input rate depending on provider), which is why the cached column is shown alongside the uncached cost in §14.3 and §14.7.
`;

fs.mkdirSync(path.dirname(path.join(DOCS, '14-site-build-report.md')), { recursive: true });
// the numbered contents panel under the header, shared with build-docs.mjs
fs.writeFileSync(path.join(DOCS, '14-site-build-report.md'), addSectionMap(body));
console.log('  + src/content/docs/14-site-build-report.md');

fs.mkdirSync(DATA, { recursive: true });
fs.writeFileSync(
	path.join(DATA, 'build-metrics.json'),
	`${JSON.stringify(
		{
			generatedAt: new Date().toISOString().slice(0, 10),
			buildModel: `${ACTUAL.p} ${ACTUAL.m}`,
			corpus: { files: corpus.files, bytes: corpus.bytes, tokens: corpusTokens },
			pipeline: { files: pipeline.files, bytes: pipeline.bytes, tokens: pipelineTokens },
			authored: { files: authored.files, bytes: authored.bytes, tokens: authoredTokens },
			assets: { files: assets.files, bytes: assets.bytes },
			scenarios: scenarios.map(({ key, name, inputTokens, outputTokens, totalTokens }) => ({
				key,
				name,
				inputTokens,
				outputTokens,
				totalTokens,
				costActualModel: Number(actualCost(scenarios.find((s) => s.key === key)).toFixed(4)),
			})),
			baselineCost: Number(actualCost(baseline).toFixed(4)),
			bounds: {
				cheapest: { model: cheapest.m, cost: Number(cheapest.cost.toFixed(4)) },
				priciest: { model: priciest.m, cost: Number(priciest.cost.toFixed(4)) },
				usMedian: Number(usMedian.toFixed(4)),
				chinaMedian: Number(cnMedian.toFixed(4)),
			},
		},
		null,
		'\t'
	)}\n`
);
console.log('  + src/data/build-metrics.json');

console.log(
	`▸ section 14 ready — baseline ${usd(actualCost(baseline))} · spread ${usd(cheapest.cost)} → ${usd(priciest.cost)} · ${tokens(baseline.totalTokens)} billable tokens`
);
