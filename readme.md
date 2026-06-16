# @autoguru/icons

> Icons and illustrations that support product at AutoGuru.

[![npm](https://img.shields.io/npm/v/@autoguru/icons.svg)](https://www.npmjs.com/package/@autoguru/icons)
[![license](https://img.shields.io/npm/l/@autoguru/icons.svg)](./LICENSE)

A tree-shakeable React icon library combining bespoke AutoGuru icons with the
[Phosphor](https://phosphoricons.com/) icon set, mirroring the AutoGuru Design
System. Every icon is an individual component, so you only ship what you import.

- **1,500+ icons** across **20 categories** — see the [category reference](./categories)
- **Tree-shakeable** — `sideEffects: false`, one component per icon
- **Themeable** — icons inherit colour via `currentColor` and scale to any size
- **Typed** — ships TypeScript definitions for every icon

## Install

```sh
yarn add @autoguru/icons react
```

`react` (>=16.8) is a peer dependency.

## Usage

Icons are React components. Render them through the
[`Icon`](https://github.com/autoguru-au/overdrive) component from
`@autoguru/overdrive`:

```jsx
import { UserSquareIcon } from '@autoguru/icons';
import { Icon } from '@autoguru/overdrive';

<Icon icon={UserSquareIcon} size={16} />;
```

Or render directly — icons take `currentColor`, so colour and size are
controlled by their container:

```jsx
import { CarIcon } from '@autoguru/icons';

<span style={{ color: 'tomato', width: 24, height: 24, display: 'inline-flex' }}>
	<CarIcon />
</span>;
```

### Naming

Each icon is exported as `PascalCase` + `Icon`, derived from its kebab-case
source filename:

| Source SVG          | Export           |
| ------------------- | ---------------- |
| `arrow-left.svg`    | `ArrowLeftIcon`  |
| `user-square.svg`   | `UserSquareIcon` |
| `magnifying-glass.svg` | `MagnifyingGlassIcon` |

## Categories

Icons are grouped into 20 categories (AutoGuru-custom, Filled, Brands, plus the
Phosphor categories such as Arrows, Commerce, System & Devices…). Browse the
full, illustrated reference in **[`categories/`](./categories)** — every icon
with a preview and its export name, grouped by category.

## Finding an icon

- Browse the [category reference](./categories) or search [phosphoricons.com](https://phosphoricons.com/).
- The Phosphor icon `arrow-square-out` is exported here as `ArrowSquareOutIcon`.

## Contributing

### Adding an icon

1. Drop the optimised SVG into `icons/` with a kebab-case filename
   (e.g. `car-key.svg`). The filename becomes the export name —
   `car-key.svg` → `CarKeyIcon`.
2. Keep the source clean: a single `viewBox`, `currentColor` / black fills,
   `none` strokes, and no inline `width`/`height`. SVGs are run through `svgo`
   during the build, but we want the source tidy too.
3. Add the icon's category to [`categories/categories.json`](./categories/categories.json)
   (`"car-key": "AutoGuru"`), then refresh the reference:

   ```sh
   node categories/generate.js   # regenerates the category reference
   ```

4. Run `yarn build`.

The base icon set was sourced from [Phosphor](https://phosphoricons.com/)
(regular weight) plus bespoke AutoGuru designs; those SVGs now live directly in
`icons/`, so there's no external icon dependency.

### Building

```sh
yarn generate   # SVGs -> React components + index.ts
yarn build      # generate, then compile CJS + ESM + type definitions
```

`scripts/build.js` turns the SVGs into components and the generated `index.ts`.
The [`categories/`](./categories) reference is separate, standalone documentation
produced by `categories/generate.js` from `categories/categories.json` — it is
not part of the build and the package exports no category metadata.

## License

MIT &copy; [AutoGuru](https://www.autoguru.com.au/)

<a href="http://www.autoguru.com.au/"><img src="https://cdn.autoguru.com.au/images/logos/autoguru.svg" alt="AutoGuru" width="150" /></a>

Icons from [Phosphor Icons](https://phosphoricons.com/) (MIT). With special
thanks to [Templarian/MaterialDesign](https://github.com/Templarian/MaterialDesign)
for the original inspiration and base.
