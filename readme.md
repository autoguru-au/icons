# @autoguru/icons

> Icons and illustrations that support product at AutoGuru.

[![npm](https://img.shields.io/npm/v/@autoguru/icons.svg)](https://www.npmjs.com/package/@autoguru/icons)
[![license](https://img.shields.io/npm/l/@autoguru/icons.svg)](./LICENSE)

A tree-shakeable React icon library combining bespoke AutoGuru icons with the
[Phosphor](https://phosphoricons.com/) icon set, mirroring the AutoGuru Design
System. Every icon is an individual component, so you only ship what you import.

- **1,500+ icons** across **20 categories** — see [CATEGORIES.md](./CATEGORIES.md)
- **Tree-shakeable** — `sideEffects: false`, one component per icon
- **Themeable** — icons inherit colour via `currentColor` and scale to any size
- **Typed** — ships TypeScript definitions and category metadata

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
full, illustrated index in **[CATEGORIES.md](./CATEGORIES.md)**.

The grouping is also exported as code, so you can build pickers and filters:

```ts
import { iconCategories, categories } from '@autoguru/icons';
import type { Category } from '@autoguru/icons';

categories; // ['AutoGuru', 'Filled', 'Arrows', …]
iconCategories['Arrows']; // ['ArrowBendUpLeftIcon', 'ArrowClockwiseIcon', …]
```

## Finding an icon

- Browse [CATEGORIES.md](./CATEGORIES.md) or search [phosphoricons.com](https://phosphoricons.com/).
- The Phosphor icon `arrow-square-out` is exported here as `ArrowSquareOutIcon`.

## Contributing

Icons come from two sources:

- **Phosphor** (regular weight) — pulled automatically from
  [`@phosphor-icons/core`](https://github.com/phosphor-icons/core):

  ```sh
  node scripts/import-phosphor.js
  ```

  This is **additive** — it only adds icons that don't already exist in
  `icons/`, so hand-tuned AutoGuru icons are never overwritten.

- **AutoGuru-custom** icons — exported from the AutoGuru Design System (Figma)
  as SVGs, optimised, and dropped into `icons/` with a kebab-case filename.
  Keep source SVGs clean (`viewBox="0 0 256 256"`, `currentColor` / black fills,
  no inline dimensions) — they're run through `svgo` during the build, but we
  want the source tidy too.

### Building

```sh
yarn generate   # SVGs -> React components, index.ts, lib/categories.ts, CATEGORIES.md
yarn build      # generate, then compile CJS + ESM + type definitions
```

`scripts/build.js` is the single source of truth for the generated `index.ts`,
`lib/categories.ts`, and `CATEGORIES.md` — don't edit those by hand. Category
assignments live in [`categories.json`](./categories.json) (overrides) and fall
back to Phosphor's own category metadata.

## License

MIT &copy; [AutoGuru](https://www.autoguru.com.au/)

<a href="http://www.autoguru.com.au/"><img src="https://cdn.autoguru.com.au/images/logos/autoguru.svg" alt="AutoGuru" width="150" /></a>

Icons from [Phosphor Icons](https://phosphoricons.com/) (MIT). With special
thanks to [Templarian/MaterialDesign](https://github.com/Templarian/MaterialDesign)
for the original inspiration and base.
