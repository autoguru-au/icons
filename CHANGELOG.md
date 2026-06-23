# @autoguru/icons

## 2.2.0

### Minor Changes

-   bf8b5ae: Restore the `mic` icon (`MicIcon`). It was dropped in the 2.0
    Phosphor migration (AG-19073), which left the FMO booking AI Summary
    "Powered by" footer rendering a literal microphone instead of the brand
    mark. This re-adds the custom `mic.svg` so `MicIcon` is exported again.

## 2.1.0

### Minor Changes

-   aed66e4: Add the full Phosphor 2.1 regular-weight set, AutoGuru custom
    icons, and a browsable category reference — bringing the library to **1,576
    icons** (up from 203).

    -   **Complete icon set.** Every SVG now lives directly in `icons/`, making
        the package self-contained — no external icon dependency or import
        tooling. Each icon is still emitted as an individual, tree-shakeable
        React component, and all existing export names are preserved.
    -   **Category reference (`categories/`).** New documentation split into one
        page per category (20 pages, e.g. `categories/commerce.md`), generated
        from `categories/categories.json`. Docs only — not part of the build and
        not published.
    -   **README** refreshed with clearer usage, naming, category, and
        contributing guidance.

## 2.0.1

### Patch Changes

-   fad1028: Use Phosphor fill-weight star and star-half icons for correct
    rendering

## 2.0.0

### Major Changes

-   02c8473: Icon library refresh — replace 53 existing icons with updated
    designs, add 11 new icons (TikTok, X/Twitter, YouTube, Instagram filled,
    Afterpay filled, fg-plate, heart-filled, p-plate), and replace 167 legacy
    icons with Phosphor Icons

## 1.8.22

### Patch Changes

-   ae4694b: Fix `sort` icon rendering — replace stroke-based artwork with
    filled chevron paths from the Fleet Client Portal design, and tighten the
    viewBox to remove excess whitespace around the glyph.

## 1.8.21

### Patch Changes

-   083cc22: Add `sort` icon — 24×24 stacked up/down chevrons using
    `currentColor` so it inherits the consuming context's colour.
