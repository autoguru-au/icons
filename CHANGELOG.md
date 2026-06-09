# @autoguru/icons

## 2.0.0

### Major Changes

-   02c8473: Icon library refresh — custom + Phosphor Icons (AG-19073, #69). A
    full redesign of the icon set. **Breaking:** some icons were removed or
    renamed, so exported icon component names have changed — consumers must
    update imports for any affected icons. See `ICON-MIGRATION.md` for the full
    old → new mapping.

    -   **49** custom icons replaced with new designs from the design team
        (filenames/export names unchanged).
    -   **11** new custom icons added (no previous equivalent).
    -   **171** icons replaced with
        [Phosphor Icons](https://phosphoricons.com).
    -   **2** original icons kept where no replacement was available.

    Totals across `icons/`: 123 added, 154 removed, 77 modified.

## 1.8.22

### Patch Changes

-   ae4694b: Fix `sort` icon rendering — replace stroke-based artwork with
    filled chevron paths from the Fleet Client Portal design, and tighten the
    viewBox to remove excess whitespace around the glyph.

## 1.8.21

### Patch Changes

-   083cc22: Add `sort` icon — 24×24 stacked up/down chevrons using
    `currentColor` so it inherits the consuming context's colour.
