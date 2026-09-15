/**
 * corpus.mjs — where the research corpus is, and what to do when it isn't there.
 *
 * The site is generated from the research in `reports/`, which lives *beside*
 * this project rather than inside it. That is fine on a developer machine and
 * fine on a host configured with the repository root as the project root, but a
 * host that is given `isr2/` as its root directory never receives `reports/` at
 * all — and the generators used to die with a bare
 *
 *     Error: ENOENT: no such file or directory, scandir '.../reports/gap-blueprints'
 *
 * which says nothing about why or what to do. Now they say so, and they also
 * have somewhere to go: the generated pages and data are committed, so a build
 * with no corpus can use them instead of failing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SITE = path.resolve(HERE, '..');

/**
 * Every place the corpus might be, in priority order. `REPORTS_DIR` wins, so a
 * host that keeps the corpus somewhere unusual can point at it directly:
 *
 *     REPORTS_DIR=/opt/research bun run build
 *
 * The rest cover the layouts that actually occur: the sibling directory (local,
 * and monorepo roots), a copy inside the project, and one level further up for
 * a deploy that nested this project one directory deeper.
 */
function candidates() {
	return [
		process.env.REPORTS_DIR,
		path.resolve(SITE, '..', 'reports'),
		path.resolve(SITE, 'reports'),
		path.resolve(SITE, '..', '..', 'reports'),
	].filter(Boolean);
}

/** A directory is the corpus only if it has the two trees the generators read. */
const looksLikeCorpus = (dir) =>
	Boolean(dir) &&
	fs.existsSync(path.join(dir, 'master')) &&
	fs.existsSync(path.join(dir, 'gap-blueprints'));

/** The corpus directory, or null when this build cannot see one. */
export function findCorpus() {
	return candidates().find(looksLikeCorpus) ?? null;
}

/** Where the corpus would be if it existed — for error messages. */
export function expectedCorpusPath() {
	return process.env.REPORTS_DIR ?? path.resolve(SITE, '..', 'reports');
}

const HEADER = [
	'',
	'  The site content is generated from the research corpus, which lives beside',
	'  this project (../reports) and is therefore not part of a deployment that is',
	'  rooted at this directory.',
	'',
].join('\n');

const ROOT_SETTINGS = [
	'    Point the host at the repository root. Everything then regenerates on',
	'    deploy, and the corpus stays the single source of truth. On Vercel:',
	'',
	'      Root Directory     the directory containing `reports/` and `isr2/`',
	'      Install Command    cd isr2 && bun install',
	'      Build Command      cd isr2 && bun run build',
	'      Output Directory   isr2/dist',
	'',
	'    Or point the build at the corpus explicitly:  REPORTS_DIR=/path/to/reports',
	'',
].join('\n');

/** In a build that *requires* the corpus, skipping is not one of the options. */
const ADVICE_STRICT = HEADER + ROOT_SETTINGS;

const ADVICE_TOLERANT = [
	HEADER,
	'  Two ways forward — pick one:',
	'',
	ROOT_SETTINGS,
	'    Keep this directory as the root. The generated pages under',
	'    src/content/docs and src/data are committed, so the build proceeds from',
	'    them and only the regeneration step is skipped — which is what it is doing',
	'    now. Content then changes when those files are committed.',
	'',
].join('\n');

/**
 * Call at the top of any generator that reads the corpus.
 *
 * Returns the corpus directory when there is one. When there isn't, it either
 * stops the build with an actionable message (`REQUIRE_CORPUS=1`, which is what
 * you want locally or in a check pipeline) or prints the same explanation as a
 * warning and exits 0 so the caller can carry on with the committed content.
 *
 * @param {string} script  the calling script's filename, for messages
 * @returns {string}
 */
export function requireCorpus(script) {
	const found = findCorpus();
	if (found) return found;

	if (process.env.REQUIRE_CORPUS === '1') {
		console.error(`\n✗ ${script}: no research corpus found.`);
		console.error(`  Looked in: ${candidates().join(', ')}`);
		console.error(ADVICE_STRICT);
		process.exit(1);
	}

	console.warn(`\n⚠ ${script}: no research corpus found (looked in ${candidates().join(', ')}).`);
	console.warn('  Skipping regeneration — the committed pages and data will be used as-is.');
	console.warn(ADVICE_TOLERANT);
	process.exit(0);
}
