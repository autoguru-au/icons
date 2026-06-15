const { join, basename, relative } = require('path');

const { default: svgr } = require('@svgr/core');
const { pascalCase } = require('change-case');
const cheerio = require('cheerio');
const dedent = require('dedent');
const { readFile, writeFile } = require('fs-extra');
const globby = require('globby');
const { dim, yellow, red, green } = require('kleur');
const SVGO = require('svgo');

const ROOT = join(__dirname, '..');

const destinationDir = join(ROOT, 'lib');

// Cap concurrency so fanning SVGO + SVGR over ~1,500 icons doesn't spike
// memory / file handles on CI.
const CONCURRENCY = 24;

const svgo = new SVGO({
	multipass: true,
	plugins: [
		{ minifyStyles: true },
		{ sortAttrs: true },
		{ mergePaths: true },
		{ convertColors: true },
		{ removeViewBox: false },
		{ convertPathData: { noSpaceAfterFlags: false } },
		{
			inlineStyles: {
				onlyMatchedOnce: false,
			},
		},
		{ convertStyleToAttrs: true },
		{
			removeAttrs: {
				attrs: ['baseProfile'],
			},
		},
	],
});

const svgrConfig = {
	svgProps: { fill: 'currentColor', focusable: 'false' },
	replaceAttrValues: { '#000': 'currentColor' },
	expandProps: false,
	dimensions: false,
	template({ template }, opts, { jsx }) {
		const reactTemplate = template.smart({
			plugins: ['react', 'typescript'],
		});

		return reactTemplate.ast`
			import React, { ReactElement, SVGAttributes } from 'react';
			${'\n'}
			const Icon: ReactElement<SVGAttributes<SVGElement>, 'svg'> = ${jsx};
			export default Icon;
		`;
	},
	plugins: ['@svgr/plugin-jsx', '@svgr/plugin-prettier'],
};

// Display order for categories in CATEGORIES.md and the exported metadata.
// AutoGuru-specific groups lead, the Phosphor categories follow alphabetically.
const CATEGORY_ORDER = [
	'AutoGuru',
	'Filled',
	'Arrows',
	'Brands',
	'Commerce',
	'Communication',
	'Design',
	'Development',
	'Education',
	'Games',
	'Health & Wellness',
	'Maps & Travel',
	'Math & Finance',
	'Media',
	'Office & Editing',
	'People',
	'Security & Warnings',
	'System & Devices',
	'Time',
	'Weather & Nature',
	'Uncategorized',
];

// Raw URL base used for icon previews in CATEGORIES.md. Resolves once the branch
// is on the default branch / published.
const RAW_BASE =
	'https://raw.githubusercontent.com/autoguru-au/icons/main/icons';
const PREVIEW_COLUMNS = 6;

function loadCategoryMap() {
	try {
		// eslint-disable-next-line global-require
		const map = { ...require(join(ROOT, 'categories.json')) };
		delete map._comment;
		return map;
	} catch {
		return {};
	}
}

let hasError = false;
(async () => {
	const iconsLibrary = await globby('icons/*.svg', {
		absolute: true,
		cwd: ROOT,
	});

	const library = await mapWithConcurrency(
		iconsLibrary,
		CONCURRENCY,
		async (iconPath) => {
			const raw = await readFile(iconPath, 'utf8');
			const optimizedSvg = (await svgo.optimize(raw)).data;

			const baseName = basename(iconPath, '.svg');
			const iconName = `${pascalCase(baseName)}Icon`;
			const outputFileName = join(destinationDir, `${iconName}.tsx`);

			logForIcon(iconName, 'success', 'Processing');

			try {
				// Validate SVG before import
				const $ = cheerio.load(optimizedSvg);
				$('svg *').each((i, el) => {
					const $el = $(el);

					// Validate color attributes
					['stroke', 'fill'].forEach((attr) => {
						const color = $el.attr(attr);
						const validColors = [
							'currentColor',
							'black',
							'#000',
							'#000000',
							'none',
							'white',
							'#fff',
							'#ffffff',
						];
						if (color && !validColors.includes(color)) {
							throw new Error(
								`${iconName}: Invalid ${attr} colour: ${$.html(
									el,
								)}`,
							);
						}
					});
				});
			} catch (error) {
				logForIcon(iconName, 'error', 'Validation', error.message);
				hasError = true;
			}

			// Process files
			const componentContents = (await svgr(optimizedSvg, svgrConfig, {
				componentName: iconName,
			})).replace(/id="([\dA-Za-z])"/g, (_, id) => `id="${id}-${iconName}"`)
				.replace(/url\(#([\dA-Za-z]+)\)/g, (_, id) => `url(#${id}-${iconName})`);

			// Create files
			await writeFile(outputFileName, componentContents, 'utf8'); // Creates per-component file

			return {
				baseName,
				iconName,
				outputFileName,
				importFrom: relative(ROOT, outputFileName)
					.replace(/\.tsx$/, '')
					.replace(/\\/, '/'),
				optimizedSvg,
			};
		},
	);

	// Resolve a category for every icon from categories.json; anything missing
	// from that map falls back to "Uncategorized".
	const categoryMap = loadCategoryMap();
	const missing = [];

	const grouped = new Map();
	for (const icon of library) {
		const category = categoryMap[icon.baseName] || 'Uncategorized';
		if (!categoryMap[icon.baseName]) missing.push(icon.baseName);
		if (!grouped.has(category)) grouped.set(category, []);
		grouped.get(category).push(icon);
	}
	if (missing.length > 0) {
		console.log(
			`${yellow('⚠️')} ${dim('No category in categories.json for:')} ${missing.join(', ')}`,
		);
	}
	const presentCategories = CATEGORY_ORDER.filter(
		(category) => grouped.has(category) && grouped.get(category).length > 0,
	);
	for (const category of grouped.keys()) {
		if (!presentCategories.includes(category)) presentCategories.push(category);
	}
	presentCategories.forEach((category) =>
		grouped.get(category).sort((a, b) => a.iconName.localeCompare(b.iconName)),
	);

	// Generated category metadata module (lib/categories.ts).
	await writeFile(
		join(destinationDir, 'categories.ts'),
		buildCategoriesModule(presentCategories, grouped),
		'utf8',
	);

	// Create root index.ts file
	await writeFile(
		join(ROOT, 'index.ts'),
		dedent`
			import { ReactElement, SVGAttributes } from 'react';

			export type IconType = ReactElement<SVGAttributes<SVGElement>, 'svg'>;
		`
			.concat('\n')
			.concat(
				library
					.map(
						(iconConfig) =>
							`export { default  as ${iconConfig.iconName} } from './${iconConfig.importFrom}';`,
					)
					.join('\n'),
			)
			.concat('\n\n')
			.concat(
				"export { iconCategories, categories } from './lib/categories';\n",
			)
			.concat("export type { Category } from './lib/categories';\n"),
		'utf8',
	);

	// Human-facing categorised index.
	await writeFile(
		join(ROOT, 'CATEGORIES.md'),
		buildCategoriesMarkdown(presentCategories, grouped),
		'utf8',
	);

	if (hasError) {
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}
})();

function buildCategoriesModule(presentCategories, grouped) {
	const categoryUnion = presentCategories
		.map((category) => `\t| ${JSON.stringify(category)}`)
		.join('\n');

	const entries = presentCategories
		.map((category) => {
			const names = grouped
				.get(category)
				.map((icon) => `\t\t${JSON.stringify(icon.iconName)},`)
				.join('\n');
			return `\t${JSON.stringify(category)}: [\n${names}\n\t],`;
		})
		.join('\n');

	const orderedList = presentCategories
		.map((category) => `\t${JSON.stringify(category)},`)
		.join('\n');

	return [
		'// This file is generated by scripts/build.js — do not edit by hand.',
		'',
		'export type Category =',
		`${categoryUnion};`,
		'',
		'export const categories: Category[] = [',
		orderedList,
		'];',
		'',
		'export const iconCategories: Record<Category, string[]> = {',
		entries,
		'};',
		'',
	].join('\n');
}

function buildCategoriesMarkdown(presentCategories, grouped) {
	const total = presentCategories.reduce(
		(sum, category) => sum + grouped.get(category).length,
		0,
	);

	const toc = presentCategories
		.map(
			(category) =>
				`- [${category}](#${slugify(category)}) (${
					grouped.get(category).length
				})`,
		)
		.join('\n');

	const sections = presentCategories
		.map((category) => {
			const icons = grouped.get(category);
			const header = `${new Array(PREVIEW_COLUMNS).fill('').join(' | ')}`;
			const divider = new Array(PREVIEW_COLUMNS).fill('---').join(' | ');
			const cells = icons.map(
				(icon) =>
					`<img src="${RAW_BASE}/${icon.baseName}.svg" width="32" height="32" alt="${icon.iconName}" /><br />\`${icon.iconName}\``,
			);
			const rows = [];
			for (let i = 0; i < cells.length; i += PREVIEW_COLUMNS) {
				const row = cells.slice(i, i + PREVIEW_COLUMNS);
				while (row.length < PREVIEW_COLUMNS) row.push('');
				rows.push(`| ${row.join(' | ')} |`);
			}
			return [
				`## ${category}`,
				'',
				`${icons.length} icon${icons.length === 1 ? '' : 's'}`,
				'',
				`| ${header} |`,
				`| ${divider} |`,
				rows.join('\n'),
			].join('\n');
		})
		.join('\n\n');

	const intro = [
		'# Icon categories',
		'',
		`${total} icons across ${presentCategories.length} categories. This file is generated by \`scripts/build.js\` — do not edit by hand.`,
		'',
		'Each icon is exported as a React component named after the preview label (e.g. `ArrowLeftIcon`). Import it from `@autoguru/icons`.',
		'',
	].join('\n');

	return `${intro}\n${toc}\n\n${sections}\n`;
}

function slugify(value) {
	return value
		.toLowerCase()
		.replace(/&/g, '')
		.replace(/[^\da-z]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

async function mapWithConcurrency(items, limit, mapper) {
	const results = new Array(items.length);
	let cursor = 0;

	const workers = Array.from(
		{ length: Math.min(limit, items.length) },
		async () => {
			while (cursor < items.length) {
				const index = cursor;
				cursor += 1;
				results[index] = await mapper(items[index], index);
			}
		},
	);

	await Promise.all(workers);
	return results;
}

function logForIcon(iconName, level, state, message = '') {
	const [fnc, symbol] = {
		warning: [yellow, '⚠️'],
		success: [green, '✅'],
		error: [red, '❌'],
	}[level];

	console.log(
		`${fnc(symbol)} ${dim(`${state}:`)} ${iconName}${
			message.length > 0 ? fnc(` ${message}`) : ''
		}`,
	);
}
