const { join, basename, relative } = require('path');
const dedent = require('dedent');
const globby = require('globby');
const SVGO = require('svgo');
const { dim, yellow, red, green } = require('kleur');
const { default: svgr } = require('@svgr/core');
const { pascalCase } = require('change-case');
const { readFile, writeFile } = require('fs-extra');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const ROOT = join(__dirname, '..');

const destinationDir = join(ROOT, 'lib');

const svgo = new SVGO({
	multipass: true,
	plugins: [
		{ minifyStyles: true },
		{ sortAttrs: true },
		{ mergePaths: true },
		{ convertColors: true },
		{ removeViewBox: false },
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
			export const Icon:ReactElement<SVGAttributes<SVGElement>, 'svg'> = ${jsx};
		`;
	},
	plugins: ['@svgr/plugin-jsx', '@svgr/plugin-prettier'],
};

let hasError = false;
(async () => {
	const iconsLibrary = await globby('icons/*.svg', {
		absolute: true,
		cwd: ROOT,
	});

	const library = await Promise.all(
		iconsLibrary.map(async iconPath => {
			const raw = await readFile(iconPath, 'utf8');
			const optimizedSvg = (await svgo.optimize(raw)).data;

			const iconName = `${pascalCase(basename(iconPath, '.svg'))}Icon`;
			const outputFileName = join(destinationDir, `${iconName}.tsx`);

			logForIcon(iconName, 'success', 'Processing');

			try {
				// Validate SVG before import
				const $ = cheerio.load(optimizedSvg);
				$('svg *').each((i, el) => {
					const $el = $(el);

					// Validate color attributes
					['stroke', 'fill'].forEach(attr => {
						const color = $el.attr(attr);
						const validColors = [
							'currentColor',
							'black',
							'#000',
							'#000000',
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
			const componentContents = await svgr(optimizedSvg, svgrConfig, {
				componentName: iconName,
			});

			// Create files
			await writeFile(outputFileName, componentContents, 'utf8'); // Creates per-component file

			return {
				iconName,
				outputFileName,
				importFrom: relative(ROOT, outputFileName).replace(
					/\.tsx$/,
					'',
				),
				optimizedSvg,
			};
		}),
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
						iconConfig =>
							`export { Icon as ${iconConfig.iconName} } from './${iconConfig.importFrom}';`,
					)
					.join('\n'),
			)
			.concat('\n'),
		'utf8',
	);

	if (hasError) {
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}

	await generateIconsImage(library);
})();

async function generateIconsImage(library) {
	const browser = await puppeteer.launch({
		headless: true,
	});
	const page = await browser.newPage();
	page.setViewport({
		width: 800,
		height: 800,
		deviceScaleFactor: 2,
		isLandscape: true,
	});

	page.setContent(`
			<div class="iconWrapper">
					${library
						.map(
							iconConfig => `<div class="icon">
					<div class="svg">${iconConfig.optimizedSvg}</div>
					<span>${iconConfig.iconName}</span>
				</div>`,
						)
						.join('\n')}
			</div>
	`);
	page.addStyleTag({
		content: `@font-face{font-family:'AvertaStandard';font-style:normal;font-weight:500;font-display:swap;src:local('Averta Std Semibold'),local(AvertaStd-Semibold),url(https://cdn.autoguru.com.au/assets/fonts/avertastd-semibold-webfont.woff2) format("woff2"),url(https://cdn.autoguru.com.au/assets/fonts/avertastd-semibold-webfont.woff) format("woff")}:root{font:400 16px/22px AvertaStandard,system-ui,sans-serif}body{background-color:#fafbfc;padding:20px}.iconWrapper{display:grid;grid-template-columns:repeat(4,1fr);grid-gap:20px}.icon{flex-direction:column;box-sizing:border-box;display:flex;place-content:center;align-items:center;color:#34384c;font-weight:500}.icon span{margin-top:10px}`,
	});

	await page.screenshot({ path: 'icons.png', fullPage: true });

	await browser.close();
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
