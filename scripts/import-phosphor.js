/**
 * Imports Phosphor regular-weight icons from `@phosphor-icons/core` into `icons/`.
 *
 * Additive only: an icon is written ONLY when `icons/<name>.svg` does not already
 * exist, so hand-tuned AutoGuru icons (e.g. fill-weight `star`/`star-half`, brand
 * icons, bespoke automotive icons) are never overwritten.
 *
 * Phosphor regular SVGs already ship as `viewBox="0 0 256 256" fill="currentColor"`,
 * which is exactly the shape `scripts/build.js` expects, so no normalisation is
 * needed — we copy them verbatim.
 *
 * Run manually / in CI:  node scripts/import-phosphor.js
 */
const { readdirSync } = require('fs');
const { join, basename } = require('path');

const { pascalCase, paramCase } = require('change-case');
const { copyFile } = require('fs-extra');
const globby = require('globby');
const { dim, green, yellow, red } = require('kleur');

const ROOT = join(__dirname, '..');
const ICONS_DIR = join(ROOT, 'icons');
const PHOSPHOR_REGULAR = join(
	ROOT,
	'node_modules/@phosphor-icons/core/assets/regular',
);

(async () => {
	// Existing icon basenames (without extension), compared verbatim so quirky
	// names like `Learner.svg` and `mobile_mechanic.svg` are matched exactly.
	const existing = new Set(
		readdirSync(ICONS_DIR)
			.filter((f) => f.endsWith('.svg'))
			.map((f) => basename(f, '.svg')),
	);

	const svgPaths = await globby('*.svg', {
		absolute: true,
		cwd: PHOSPHOR_REGULAR,
	});

	let added = 0;
	let skippedExisting = 0;
	const skippedNaming = [];

	for (const svgPath of svgPaths) {
		const name = basename(svgPath, '.svg');

		// Guard against the `change-case` single-letter-segment collapse
		// (e.g. `a-b` -> `AB` -> `ab`). No Phosphor 2.1 name triggers this,
		// but skip + log rather than silently mis-name the component.
		if (paramCase(pascalCase(name)) !== name) {
			skippedNaming.push(name);
			continue;
		}

		if (existing.has(name)) {
			skippedExisting += 1;
			continue;
		}

		await copyFile(svgPath, join(ICONS_DIR, `${name}.svg`));
		added += 1;
	}

	console.log(
		`${green('✅')} ${dim('Added:')} ${added} new Phosphor icon(s)`,
	);
	console.log(
		`${yellow('•')} ${dim('Skipped (already present):')} ${skippedExisting}`,
	);
	if (skippedNaming.length > 0) {
		console.log(
			`${red('⚠️')} ${dim('Skipped (name round-trip failed):')} ${skippedNaming.join(', ')}`,
		);
	}
	console.log(
		`${dim('Total icons in icons/ now:')} ${readdirSync(ICONS_DIR).filter((f) => f.endsWith('.svg')).length}`,
	);
})();
