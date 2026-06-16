/**
 * Generates the icon category reference: an index (categories/README.md) plus
 * one page per category (categories/<slug>.md). Standalone documentation tooling
 * — intentionally separate from the build (scripts/build.js) and not part of the
 * published package. Everything category-related lives in this folder.
 *
 * Data source: categories.json (icon filename -> category), alongside this
 * script. Update it when adding an icon, then run:  node categories/generate.js
 */
const { readdirSync, readFileSync, writeFileSync, unlinkSync } = require('fs');
const { join, basename } = require('path');

const { pascalCase } = require('change-case');

const ROOT = join(__dirname, '..');
const ICONS_DIR = join(ROOT, 'icons');
const OUT_DIR = __dirname;

// The reference is split into one page per category, linked from an image-free
// index (README.md). This keeps each page's preview count low: a single
// 1576-image page trips GitHub's image rate-limiting, so a random subset renders
// broken on every load. Category pages reference icons with a repo-relative path
// (../icons/<name>.svg) so previews resolve against whichever ref the file is
// viewed on — no stale commit SHA to orphan after merge. Set ICONS_REF (branch,
// tag, or commit SHA) to emit absolute raw.githubusercontent URLs instead, for
// rendering the doc outside GitHub (e.g. npm).
const ICONS_REF = process.env.ICONS_REF;
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
	const map = { ...JSON.parse(readFileSync(join(OUT_DIR, 'categories.json'), 'utf8')) };
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

// Clear previously generated pages (every .md here is generated; the script and
// categories.json are not). Pages resolve previews relative to the repo root
// (../icons), unless ICONS_REF requests absolute URLs.
readdirSync(OUT_DIR)
	.filter((f) => f.endsWith('.md'))
	.forEach((f) => unlinkSync(join(OUT_DIR, f)));

const categoryIconBase = ICONS_REF
	? `https://raw.githubusercontent.com/autoguru-au/icons/${ICONS_REF}/icons`
	: '../icons';

const header = new Array(PREVIEW_COLUMNS).fill('').join(' | ');
const divider = new Array(PREVIEW_COLUMNS).fill('---').join(' | ');

const buildGrid = (list) => {
	const cells = list.map(
		(icon) =>
			`<img src="${categoryIconBase}/${icon.base}.svg" width="32" height="32" alt="${icon.name}" /><br />\`${icon.name}\``,
	);
	const rows = [];
	for (let i = 0; i < cells.length; i += PREVIEW_COLUMNS) {
		const row = cells.slice(i, i + PREVIEW_COLUMNS);
		while (row.length < PREVIEW_COLUMNS) row.push('');
		rows.push(`| ${row.join(' | ')} |`);
	}
	return [`| ${header} |`, `| ${divider} |`, rows.join('\n')].join('\n');
};

// One page per category — each holds at most a few hundred previews, well within
// what GitHub renders reliably.
present.forEach((category) => {
	const list = grouped.get(category);
	const page = [
		`# ${category}`,
		'',
		`${list.length} icon${list.length === 1 ? '' : 's'} · part of the [icon reference](./README.md).`,
		'',
		'Each icon is an individual React component named after its label below, imported from `@autoguru/icons`.',
		'',
		buildGrid(list),
		'',
	].join('\n');
	writeFileSync(join(OUT_DIR, `${slugify(category)}.md`), page);
});

// Index page — navigation only, no per-icon images, so it always renders.
const indexRows = present
	.map(
		(c) =>
			`| **${c}** | ${grouped.get(c).length} | [Browse&nbsp;→](./${slugify(c)}.md) |`,
	)
	.join('\n');

const index = [
	'# AutoGuru Icons — category reference',
	'',
	`> A visual reference for all ${total} icons in \`@autoguru/icons\`, grouped into ${present.length} categories.`,
	'',
	'Every icon ships as an individual, tree-shakeable React component named after',
	'its label (e.g. `ArrowLeftIcon`). Choose a category below to browse its icons',
	'with live previews and exact export names.',
	'',
	'## Categories',
	'',
	'| Category | Icons | |',
	'| --- | --: | --- |',
	indexRows,
	`| **Total** | **${total}** | |`,
	'',
	'## Usage',
	'',
	'```jsx',
	"import { ArrowLeftIcon } from '@autoguru/icons';",
	"import { Icon } from '@autoguru/overdrive';",
	'',
	'<Icon icon={ArrowLeftIcon} size={16} />;',
	'```',
	'',
	'Icons inherit colour via `currentColor` and scale to any size, so they adapt to',
	'their surrounding text and theme.',
	'',
	'---',
	'',
	'<sub>Generated by <code>node categories/generate.js</code> from <code>categories/categories.json</code> — do not edit by hand.</sub>',
	'',
].join('\n');

writeFileSync(join(OUT_DIR, 'README.md'), index);
console.log(
	`Wrote categories/README.md index + ${present.length} category pages — ${total} icons.`,
);
