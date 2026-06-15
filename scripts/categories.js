/**
 * Generates CATEGORIES.md — a single reference doc listing every icon grouped
 * by its design-system category. This is standalone documentation tooling and
 * is intentionally separate from the build (scripts/build.js): it does not
 * affect the published package.
 *
 * Data source: categories.json (icon filename -> category). Update that file
 * when adding an icon, then run:  node scripts/categories.js
 */
const { readdirSync, readFileSync, writeFileSync } = require('fs');
const { join, basename } = require('path');

const { pascalCase } = require('change-case');

const ROOT = join(__dirname, '..');
const ICONS_DIR = join(ROOT, 'icons');

// Raw URL base for icon previews. Resolves once on the default branch.
const RAW_BASE =
	'https://raw.githubusercontent.com/autoguru-au/icons/main/icons';
const PREVIEW_COLUMNS = 6;

// AutoGuru-specific groups lead; the remaining categories follow alphabetically.
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

const categoryMap = (() => {
	const map = { ...JSON.parse(readFileSync(join(ROOT, 'categories.json'), 'utf8')) };
	delete map._comment;
	return map;
})();

const icons = readdirSync(ICONS_DIR)
	.filter((f) => f.endsWith('.svg'))
	.map((f) => {
		const base = basename(f, '.svg');
		return {
			base,
			name: `${pascalCase(base)}Icon`,
			category: categoryMap[base] || 'Uncategorized',
		};
	});

const grouped = new Map();
for (const icon of icons) {
	if (!grouped.has(icon.category)) grouped.set(icon.category, []);
	grouped.get(icon.category).push(icon);
}
const present = CATEGORY_ORDER.filter((c) => grouped.get(c)?.length);
for (const c of grouped.keys()) if (!present.includes(c)) present.push(c);
present.forEach((c) => grouped.get(c).sort((a, b) => a.name.localeCompare(b.name)));

const slugify = (v) =>
	v.toLowerCase().replace(/&/g, '').replace(/[^\da-z]+/g, '-').replace(/^-+|-+$/g, '');

const total = icons.length;
const toc = present
	.map((c) => `- [${c}](#${slugify(c)}) (${grouped.get(c).length})`)
	.join('\n');

const header = new Array(PREVIEW_COLUMNS).fill('').join(' | ');
const divider = new Array(PREVIEW_COLUMNS).fill('---').join(' | ');

const sections = present
	.map((category) => {
		const list = grouped.get(category);
		const cells = list.map(
			(icon) =>
				`<img src="${RAW_BASE}/${icon.base}.svg" width="32" height="32" alt="${icon.name}" /><br />\`${icon.name}\``,
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
			`${list.length} icon${list.length === 1 ? '' : 's'}`,
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
	`Reference of all ${total} icons grouped across ${present.length} categories. Regenerate with \`node scripts/categories.js\` after editing \`categories.json\`.`,
	'',
	'Each icon is exported as a React component named after the preview label (e.g. `ArrowLeftIcon`). Import it from `@autoguru/icons`.',
	'',
].join('\n');

writeFileSync(join(ROOT, 'CATEGORIES.md'), `${intro}\n${toc}\n\n${sections}\n`);
console.log(`Wrote CATEGORIES.md — ${total} icons, ${present.length} categories.`);
