# Sass Phase 3 Investigation: `@import` → `@use`/`@forward` Migration

**Date:** 2026-03-24
**Scope:** All 7 frontend repos — notification, decision, checks, control, upload, bordernotification, bcpadmin
**Purpose:** Deep effort assessment for Phase 3 of the Sass deprecation remediation

---

## Executive Summary

The `@import` → `@use`/`@forward` migration is a significant but achievable body of work. The central constraint is that **govuk-frontend 6.1.0 (the currently installed version — and the latest available) still uses `@import` throughout its own dist SCSS files**. This means the migration cannot fully eliminate `[import]` warnings from govuk-frontend's own internals — those warnings will persist until govuk-frontend ships a future release using `@use` natively. Our own code's `@import` usage can and should be migrated regardless.

The migration across all 7 repos involves:
- **235 SCSS files in total** (application.scss + partials)
- **57 files that use `@import`** (1 `application.scss` per repo + 50 partials)
- **178 "pure" partials** (no `@import`, just rules — structurally valid `@use` targets already)

The key complexity is not the file count. It is the **dependency structure**: the majority of partials rely on govuk-frontend mixins (`govuk-spacing`, `govuk-font`, `govuk-media-query`) and functions (`govuk-colour`, `govuk-functional-colour`) made globally available by the `@import "govuk-frontend/dist/govuk"` in `application.scss`. Under `@use`, that global scope disappears entirely. Every partial that uses a govuk mixin or function without its own explicit `@import` of the relevant govuk helper will break.

---

## 1. govuk-frontend Version and `@use` Readiness

### Version installed

All 7 repos specify `^6.1.0` in `package.json` and have `6.1.0` installed in `node_modules`. This is the latest available version on npm.

### govuk-frontend 6.1.0 internals

govuk-frontend 6.1.0 **still uses `@import` throughout its own dist SCSS**. Counts in `node_modules/govuk-frontend/dist/govuk/`:

| Directive | Count |
|---|---|
| `@import` | 330 |
| `@use` (Sass built-in modules only, e.g. `sass:map`, `sass:math`) | 42 |
| `@forward` | 0 |

The `@use` occurrences are exclusively `@use "sass:map"`, `@use "sass:math"` etc. within individual helper files. The cross-file module loading (`@import "../settings/colours-functional"` etc.) remains all `@import`. There is no `@forward`-based re-export structure.

The entry point `dist/govuk/index.scss` is:
```scss
@import "base";
@import "core/index";
@import "objects/index";
@import "components/index";
@import "utilities/index";
@import "overrides/index";
```

**Conclusion for migration:** There is no govuk-frontend upgrade that addresses this. Version 6.1.0 is the latest. The govuk-frontend team has a roadmap to migrate to `@use` in a future major version (anticipated 7.x) but that has not shipped. This means:

1. After migrating our own code to `@use`, we will still see `[import]` deprecation warnings originating from govuk-frontend's 330 internal `@import` statements. These cannot be suppressed without patching the package directly.
2. The govuk-frontend helpers (typography, spacing, colour, media-queries) that our partials import individually — e.g. `@import "govuk-frontend/dist/govuk/helpers/typography"` — themselves use a mixed `@use` + `@import` pattern. Under Sass's module system, **a file that uses `@import` cannot be loaded via `@use`**. This is the critical blocker for the "clean" approach.

### Implication for migration strategy

Because govuk-frontend 6.1.0 uses `@import` internally, **we cannot load it via `@use "govuk-frontend/dist/govuk"` from our own `@use`-based files without violating the Sass module system rules**. There are two approaches to handle this:

**Option A — `@use as *` at application.scss level (recommended)**
Keep the govuk-frontend load at application.scss using `@use "govuk-frontend/dist/govuk" as *`. This exposes all govuk mixins/functions/variables into the local namespace without a prefix, which approximates the current `@import` behaviour at the boundary. Our partials then do `@use` for each other but do NOT re-import govuk helpers individually — they rely on the parent cascade. Under the Sass module system, `@use as *` from a `@import`-based library is permitted (the module system allows loading an `@import`-using library as a single unit).

**Option B — Keep `@import "govuk-frontend/dist/govuk"` + migrate our own partials**
The `@import` rule at application.scss for govuk-frontend remains as-is (one warning). Our own partials migrate from `@import ../other-partial` to `@use`. This is a hybrid approach that works today and is pragmatic given govuk-frontend's state.

Both options produce warnings from govuk-frontend's own internals. Neither option fully silences `[import]` warnings.

---

## 2. Per-Repo File Inventory

### Summary table

| Repo | Total `.scss` | application.scss | Partials with `@import` | Pure partials (no `@import`) |
|---|---|---|---|---|
| notification | 64 | 1 (75 `@import` lines) | 18 | 45 |
| decision | 61 | 1 (44 `@import` lines) | 8 | 52 |
| checks | 23 | 1 (14 `@import` lines) | 1 | 21 |
| control | 22 | 1 (13 `@import` lines) | 6 | 15 |
| upload | 22 | 1 (13 `@import` lines) | 6 | 15 |
| bordernotification | 24 | 1 (12 `@import` lines) | 4 | 19 |
| bcpadmin | 19 | 1 (16 `@import` lines) | 5 | 13 |
| **Total** | **235** | **7** | **48** | **180** |

### Partials with `@import` — breakdown per repo

**notification (18 partials with @import):**

| File | Govuk imports | Own-file imports | Notes |
|---|---|---|---|
| `layout/_header.scss` | helpers/typography, helpers/media-queries | `../base/variables` | Uses `$rolling-stone` custom var |
| `components/_notification_banner.scss` | helpers/colour | — | Simple |
| `components/_task_list.scss` | helpers/spacing, helpers/typography, settings/colours-functional | — | Defines `$govuk-task-list-hover-colour` |
| `components/_review_summary_list.scss` | helpers/media-queries, helpers/spacing, helpers/typography, settings/colours-functional, settings/typography-font | `../base/variables` | Uses `$error-border-width`, `$error-border-padding`, `$govuk-font-weight-bold` |
| `components/_datepicker.scss` | helpers/colour, settings/typography-font, settings/media-queries | `../base/variables` | Already has `@use "sass:color"`, `@use "sass:map"` — partially migrated |
| `components/_navigation.scss` | helpers/spacing, helpers/typography, helpers/media-queries, settings/colours-functional | — | |
| `components/_summary_list.scss` | settings/colours-functional, helpers/media-queries, helpers/spacing, helpers/typography | — | |
| `components/_information_banner.scss` | helpers/typography, helpers/spacing, helpers/media-queries | — | |
| `components/_link.scss` | helpers/colour | — | Simple |
| `pages/_retrospective_cloning_summary.scss` | helpers/colour, helpers/spacing | — | |
| `pages/_transporter_details_cheda.scss` | helpers/media-queries | — | Simple |
| `pages/_manage_catch_certificates.scss` | helpers/spacing, helpers/colour | — | |
| `pages/_identification_details.scss` | helpers/media-queries | — | Simple |
| `pages/_certificate.scss` | — | `../base/variables` | Already has `@use "sass:color"` — partially migrated |
| `pages/_add_catch_certificate_details.scss` | helpers/clearfix, settings/colours-functional, helpers/media-queries, helpers/spacing, helpers/typography | — | Most complex page-level import |
| `pages/_cloning_summary.scss` | helpers/typography, settings/colours-functional | — | |
| `pages/_establishment_search.scss` | helpers/media-queries | — | Simple |
| `pages/_commodity_details_cheda.scss` | helpers/media-queries | — | Simple |

**decision (8 partials with @import):**

| File | Govuk imports | Own-file imports |
|---|---|---|
| `layout/_header.scss` | helpers/media-queries | `../base/variables` |
| `components/_notification_banner.scss` | helpers/colour | — |
| `components/_alert_box.scss` | — | `../base/variables` |
| `components/_review_summary_list.scss` | helpers/spacing, helpers/typography, settings/colours-functional, settings/typography-font | `../base/variables` |
| `components/_datepicker.scss` | helpers/colour, settings/typography-font | `../base/variables` — already has `@use "sass:color"`, `@use "sass:map"` |
| `components/_navigation.scss` | helpers/spacing, helpers/typography, helpers/media-queries, settings/colours-functional | `../base/variables` |
| `components/_spinner.scss` | — | `../base/variables` |
| `components/_information_banner.scss` | helpers/typography, helpers/spacing, helpers/media-queries | — |

**checks (1 partial with @import):**

| File | Govuk imports | Own-file imports |
|---|---|---|
| `components/_datepicker.scss` | helpers/colour, settings/typography-font | `../base/variables` — already has `@use "sass:color"`, `@use "sass:map"` |

**control (6 partials with @import):**

| File | Govuk imports | Own-file imports |
|---|---|---|
| `layout/_header.scss` | helpers/media-queries | — |
| `components/_notification_banner.scss` | helpers/colour | — |
| `components/_tag.scss` | — | `../base/variables` |
| `components/_datepicker.scss` | helpers/colour, settings/typography-font | `../base/variables` — already has `@use "sass:color"`, `@use "sass:map"` |
| `components/_navigation.scss` | helpers/media-queries, settings/colours-functional | — |
| `components/_information_banner.scss` | helpers/typography, helpers/spacing, helpers/media-queries | — |

**upload (6 partials with @import):**

| File | Govuk imports | Own-file imports |
|---|---|---|
| `layout/_dividers.scss` | settings/colours-functional | — |
| `layout/_header.scss` | helpers/media-queries | — |
| `components/_tag.scss` | helpers/typography, helpers/colour, settings/colours-functional | — |
| `components/_navigation.scss` | helpers/media-queries, helpers/typography, helpers/spacing, settings/colours-functional | — |
| `components/_multi_file_upload.scss` | helpers/spacing, helpers/typography, helpers/media-queries, settings/colours-functional | — — already has `@use "sass:map"` |
| `components/_information_banner.scss` | helpers/typography, helpers/spacing | — |

**bordernotification (4 partials with @import):**

| File | Govuk imports | Own-file imports |
|---|---|---|
| `components/_status.scss` | helpers/media-queries, settings/colours-functional | — |
| `components/_datepicker.scss` | helpers/colour, settings/typography-font | `../utilities/variables` — already has `@use "sass:color"`, `@use "sass:map"` |
| `components/_navigation.scss` | helpers/spacing, helpers/typography, helpers/media-queries, settings/colours-functional | — |
| `components/_information_banner.scss` | helpers/spacing, helpers/typography, settings/colours-functional | — |

**bcpadmin (5 partials with @import):**

| File | Govuk imports | Own-file imports |
|---|---|---|
| `layout/_form.scss` | — | `../base/maps` |
| `layout/_header.scss` | helpers/media-queries | — |
| `components/_notification_banner.scss` | helpers/colour | — |
| `components/_account_banner.scss` | helpers/typography, helpers/spacing | — |
| `components/_page_header.scss` | helpers/media-queries, settings/colours-functional | — |

---

## 3. Variable and Mixin Dependency Complexity

### The govuk global scope problem

This is the most significant source of complexity. The current `@import` model makes every govuk mixin, function, and variable globally available to all partials once `application.scss` imports govuk-frontend. The following table shows how many partials in each repo **use govuk constructs without having their own `@import`** — they silently depend on the global scope:

| Repo | Partials using govuk without own import |
|---|---|
| notification | 32 |
| decision | 26 |
| checks | 14 |
| control | 10 |
| upload | 7 |
| bordernotification | 13 |
| bcpadmin | 13 |

These are **not currently listed as "files with @import"** because they have no `@import` at all — they just call `govuk-spacing()`, `govuk-functional-colour()`, `@include govuk-font()`, etc. directly. Under `@use`, each of these files would need to either:

(a) Add their own `@use "govuk-frontend/dist/govuk" as *` (or individual helper imports), or
(b) Receive govuk symbols via `@forward` from a shared index file

This is the largest single body of work in the migration.

### Custom variable (`_variables.scss`) dependency graph

Each repo has a `_variables.scss` (or `utilities/_variables.scss` in bordernotification, `base/` variants for all others) defining 28–40 colour and font variables. These variables are consumed by other partials but the partials do not import `_variables.scss` themselves — they rely on application.scss loading `_variables.scss` via `@import` first.

| Repo | Variables defined | Files consuming custom vars | Total occurrences |
|---|---|---|---|
| notification | 34 | 11 files | ~49 |
| decision | 40 | 20 files | ~48 |
| checks | 32 | 8 files | ~15 |
| control | 30 | 7 files | ~13 |
| upload | 30 | 6 files | ~9 |
| bordernotification | 32 | 7 files | ~13 |
| bcpadmin | 13 (wraps govuk-colour) | 8 files | ~15 |

Key observation: **bcpadmin's `_variables.scss` calls `govuk-colour()` at definition time** (e.g. `$black: govuk-colour("black")`). Under `@use`, the variables file itself would need to `@use "govuk-frontend/..."` before it can call `govuk-colour()`. This creates a circular dependency risk if not structured carefully.

### Direct `$govuk-*` variable references

Some partials directly reference govuk's own internal variables (not via functions):

| Variable | Repos | Files | Notes |
|---|---|---|---|
| `$govuk-border-colour` | upload (3 files), notification (1 file) | 4 files | Used in navigation, notification_list, dividers, multi_file_upload, info_summary |
| `$govuk-breakpoints` | notification, decision, checks, control, bordernotification, upload | datepicker in all 5, multi_file_upload | Used directly in `map.get($govuk-breakpoints, "tablet")` |
| `$govuk-font-family` | notification, decision, checks, control, bordernotification | datepicker in all 5 | `font-family: $govuk-font-family` |
| `$govuk-font-weight-bold` | notification | review_summary_list | |
| `$govuk-border-width`, `$govuk-focus-width` | notification | info_summary | |

Under `@use`, `$govuk-*` variables from govuk-frontend would need to be accessed via a namespace (e.g. `govuk.$govuk-border-colour`) unless govuk-frontend is loaded `as *`.

### Mixin usage without `@import`

Key govuk mixins used across "pure" partials (no own `@import`):

- `govuk-font($size, $weight)` — used in ~30+ files across repos
- `govuk-spacing($n)` — used in ~20+ files
- `govuk-media-query($from, $until)` — used in ~25+ files
- `govuk-functional-colour($name)` — used in ~25+ files
- `@include govuk-clearfix` — used in 4 repos' notification_list
- `govuk-responsive-margin/padding` — used in notification, decision review_summary_list, task_list

### Local mixin definitions

The `_notification_list.scss` in 4 repos (notification, decision, control, bordernotification) defines a local mixin `grid-column($width)` that is used within the same file. This is not shared cross-file so it does not create a dependency graph problem — it simply needs to be in the same `@use`-migrated file.

---

## 4. Namespace Impact Assessment

Under `@use`, the question of namespacing is the other major effort driver.

### Option A: `@use "..." as *` (avoid namespace prefixes)

Loading govuk-frontend and `_variables.scss` with `as *` preserves existing call sites — `govuk-spacing(3)` continues to work without a prefix. This is the pragmatic migration path and is explicitly supported by the Sass module system for backwards compatibility.

**Pros:** Near-zero rename burden on existing rules. sass-migrator's `module` migration uses `as *` by default when migrating third-party libraries.
**Cons:** Defeats some of the isolation benefits of `@use`. Still produces `[import]` warnings from govuk-frontend internals.

### Option B: Fully namespaced (proper `@use`)

Each call to a govuk function/mixin/variable would need a namespace prefix. With ~100+ govuk mixin/function calls per repo that currently have no `@import`, the rename burden is large.

**Recommendation:** Use `as *` for govuk-frontend and for the shared `_variables.scss`. This is the approach the sass-migrator tool takes by default for third-party libraries and is the correct pragmatic choice while govuk-frontend 6.1.0 remains `@import`-based.

---

## 5. Cross-Repo Component Duplication

Several SCSS components appear across multiple repos. Comparing them:

### `_datepicker.scss` (appears in notification, decision, checks, control, bordernotification — 5 repos)

These files are near-identical with small per-repo differences:
- **Shared structure:** Identical `$icon-size`, `$svg-size`, `$date-button-hover-colour`, `$icon-base-colour`, `$keyboard-focus-colour` definitions; identical `.defra-datepicker` block; identical `.date__button` block; identical `.hidden-icon` block.
- **Differences:** The `.search-filter-form` / `.search-and-filter-form` / `.search-form` selector around `.date-picker__dialog` differs per repo (repo-specific form class name). The notification version has an extra IE11 fallback. bordernotification adds a `#create-border-notification-page` selector.
- **Already partially migrated:** All 5 have `@use "sass:color"` and `@use "sass:map"` at the top — applied as part of Phases 1/2. They retain `@import` lines for govuk helpers and `../base/variables`.

**Cross-repo migration opportunity:** A single migration template can be written and applied to all 5 with the only diff being the form-class selector. Estimated saving: ~1 hour across all 5 vs doing each independently.

### `_information_banner.scss` (appears in notification, decision, checks, control, upload, bordernotification — 6 repos)

Near-identical `.information-banner` styling with minor variations:
- notification, decision: identical (float right, margin, media query)
- control, upload: adds `@media (max-width: 500px) { float: unset; }` block
- bordernotification: slightly different import ordering, no media-query block
- checks: stripped-down version (no `@import`, uses global govuk scope)

**Migration:** 6 files, all structurally similar. The `@import` lines become `@use` lines; the govuk mixin/function calls are unchanged if using `as *`.

### `_notification_list.scss` (notification, decision, control, bordernotification — 4 repos)

These share an identical `$gutter`/`$gutter-half` local variable pattern and identical `.notification-list__grid-row` / `@mixin grid-column` structure. Minor differences in `.notification-list__heading`, `.notification-list__value`, and `.notification-list__links` per repo. **None of these files have an `@import` directive** — they depend entirely on govuk global scope for `govuk-spacing()`, `govuk-functional-colour()`, `govuk-font()`, and `@include govuk-clearfix`.

Under migration, all 4 would need to gain explicit `@use` declarations for govuk symbols they use.

### `_navigation.scss` (notification, decision, control, upload, bordernotification — 5 repos)

Shares a `.navigation-links` base but with per-repo differences in extra selectors and styling. All have `@import` lines for govuk helpers.

---

## 6. sass-migrator Feasibility

The `sass-migrator module` command (`npx sass-migrator module --migrate-deps application.scss`) is the officially recommended tool for this migration. Based on the codebase analysis:

### What it handles well

- Converting `@import "partial"` to `@use "partial"` at the application.scss entry point
- Adding `as *` to govuk-frontend imports to preserve call sites
- Traversing `--migrate-deps` to update all imported partials
- Converting `@import "../base/variables"` in partials to `@use "../base/variables" as *`
- Removing duplicate `@use` declarations if a partial is imported multiple times (deduplication is a `@use` benefit)

### Known limitations with this codebase

1. **govuk-frontend's mixed `@use`/`@import` helpers cannot be loaded via `@use` from migrated files.** The partials that currently do `@import "govuk-frontend/dist/govuk/helpers/typography"` will need to retain those as `@import` (not convertable to `@use`) OR have the govuk entry loaded at a higher level and forwarded down. The sass-migrator will flag these as "can't migrate" because the target files themselves use `@import`.

2. **Pure partials (no @import) that use govuk globals.** sass-migrator's `--migrate-deps` only processes files that are explicitly `@import`ed. The 100+ "pure" partials that silently rely on govuk's global scope are not visited by the migrator — they will compile to errors post-migration unless govuk symbols are made available via `@forward` in an index file.

3. **`$gutter`/`$gutter-half` local variables in `_notification_list.scss`.** These are used within the same file only (to define `margin: -$gutter-half`). sass-migrator handles local variables correctly; no issue here.

4. **bcpadmin's `_variables.scss` calling `govuk-colour()`.** The migrator will correctly add `@use "govuk-frontend/dist/govuk" as *` to `_variables.scss` when it processes the dependency chain. This is valid Sass as long as govuk is loaded before variables resolves.

5. **`$error-border-width` / `$error-border-padding` in `_review_summary_list.scss`.** These variables come from `_variables.scss` (notification only). The migrator will add `@use "../base/variables" as *` to the review_summary_list partial, which is correct.

### Realistic assessment

The sass-migrator handles the mechanical conversion well for files that have their own `@import` declarations. **It does not solve the implicit global scope problem** — the 100+ pure partials that use govuk without importing anything. Those require a separate, manual step: either add `@use "govuk-frontend/dist/govuk" as *` to each affected partial, or create a shared index partial that `@forward`s what they need.

---

## 7. Effort Estimates

### Without sass-migrator (fully manual)

| Task | Scope | Estimate |
|---|---|---|
| Understand `@use`/`@forward` module system | Once per developer | 0.5 days |
| Convert application.scss in each repo | 7 files | 1h total |
| Convert partials with explicit `@import` | 48 files across 7 repos | 4–6h total |
| Add govuk `@use` to pure partials (implicit dependency fix) | ~115 files across 7 repos | 2–3 days |
| Handle bcpadmin variables calling govuk-colour | 1 file, special case | 1h |
| Test and verify each repo builds cleanly | 7 repos | 1 day |
| **Total** | | **3–5 days** |

### With sass-migrator

The migrator handles the application.scss + partials-with-explicit-imports automatically. The implicit dependency problem remains manual.

| Task | Scope | Estimate |
|---|---|---|
| Run `npx sass-migrator module --migrate-deps application.scss` | 7 repos | 2h |
| Fix sass-migrator failures (govuk helpers @import incompatibility) | ~8 unique govuk helper paths across repos | 2h |
| Identify and add govuk `@use` to pure partials | ~115 files | 1.5 days |
| Create `@forward` index if taking a centralized approach instead | 7 repos | 0.5 days |
| Test and verify each repo builds cleanly | 7 repos | 1 day |
| **Total** | | **2.5–3.5 days** |

### With sass-migrator + `@use as *` shortcut strategy

If the team accepts `as *` on govuk-frontend at each file that needs it (rather than a clean namespaced approach):

- The migrator's output can be used as a base
- A bulk find-and-fix script can add `@use "govuk-frontend/dist/govuk" as *` to all pure partials that use govuk
- Testing remains the same

| Task | Scope | Estimate |
|---|---|---|
| Run migrator across all 7 repos | 7 repos | 2h |
| Fix govuk helper import incompatibilities | ~8 paths | 2h |
| Scripted addition of govuk `@use` to pure partials | Script once, apply 7x | 3h |
| Test and verify builds | 7 repos | 1 day |
| **Total** | | **~2 days** |

---

## 8. Recommendation on Sequencing

### Should govuk-frontend be upgraded first?

**No — and cannot be.** govuk-frontend 6.1.0 is the latest available. There is no `@use`-based version to upgrade to. Waiting for one is not a viable plan on any reasonable horizon.

### Pilot repo recommendation

**`eudp-live-animals-frontend-checks`** is the recommended pilot. Reasons:
- Smallest codebase: 23 SCSS files total
- Fewest partials with `@import`: only 1 (`_datepicker.scss`)
- Lowest custom variable complexity (32 vars, 8 consumer files)
- Clean directory structure with no path quirks (unlike bcpadmin's `lib/assets/sass/`)
- The `_datepicker.scss` is already partially migrated (`@use "sass:color"`, `@use "sass:map"`) so the remaining work is representative of the govuk helper import problem without being large

A successful migration in checks validates the approach, surfaces the govuk helper compatibility issues, and produces a template for the other 6 repos.

### Recommended migration sequence

1. **checks** — pilot, validate approach (~0.5 days)
2. **control** — next simplest (22 files, 6 partials with imports), similar structure to checks (~0.5 days)
3. **upload** — similar size to control but has `_multi_file_upload.scss` with more complexity (~0.5 days)
4. **bordernotification** — 24 files, 4 partials with imports, uses `utilities/` rather than `base/` for variables (minor path difference to handle) (~0.5 days)
5. **bcpadmin** — distinct enough structure (lib/assets/sass, _maps.scss, variables calling govuk-colour) to treat separately (~1 day)
6. **decision** — 61 files, medium complexity (~1 day)
7. **notification** — largest: 64 files, 18 partials with imports, most page-level scss, most complex dependency graph (~1.5 days)

**Total estimated calendar time with one developer:** 5–6 days (could be compressed to 3–4 with parallelism across 2 developers after the pilot).

### The govuk helper `@import` problem — recommended resolution

The govuk helper files (`dist/govuk/helpers/typography`, etc.) use `@import` internally and **cannot be loaded via `@use`**. The current pattern where individual partials do `@import "govuk-frontend/dist/govuk/helpers/typography"` works under the `@import` system but is redundant (the full govuk-frontend is already loaded in application.scss). Under `@use`, these individual helper imports should be **removed** from partials entirely, and govuk should be loaded once at the application.scss level using `@use "govuk-frontend/dist/govuk" as *`.

This means the migration removes govuk helper `@import` lines from partials (rather than converting them to `@use`), making the migration of those particular partials simpler than it looks.

---

## 9. Residual Warning After Migration

Even after a complete migration of all 7 repos' own SCSS to `@use`/`@forward`, the following warnings will remain:

- `[import]` warnings from govuk-frontend's internal 330 `@import` statements (these are in `node_modules` and cannot be changed without patching the package)

The volume of these warnings will be significantly reduced — currently the `application.scss` single `@import "govuk-frontend/dist/govuk"` triggers a cascade of hundreds of repeated warnings. After migration, if govuk-frontend is loaded via `@use ... as *` in application.scss, the warning behaviour may differ (the exact suppression rules differ between `@use` and `@import` loading of a legacy library). The number of visible warnings should drop substantially because `@use` deduplicates module loading.

**Expected warning state post-migration:** 1–20 `[import]` warnings from govuk-frontend's own internals per compilation (compared to hundreds currently). Full elimination requires waiting for govuk-frontend to publish a `@use`-based major version.

---

## 10. Summary Findings

| Finding | Impact |
|---|---|
| govuk-frontend 6.1.0 still uses @import throughout — no upgrade path exists today | Residual [import] warnings will remain post-migration; cannot do a fully clean @use migration against govuk's API |
| govuk-frontend's individual helper files (helpers/typography etc.) use @use + @import mix and cannot be loaded via @use | Govuk helper @imports in partials must be removed (not converted to @use); govuk loaded once at entry point level |
| ~115 pure partials use govuk mixins/functions with no own @import | Biggest effort item: these all need explicit govuk symbols made available post-migration |
| Custom _variables.scss consumed by 6–20 files per repo without explicit import | Needs @forward in a new index file or as * loading in each consumer |
| 5 repos share near-identical _datepicker.scss (already partially migrated with @use sass:*) | Migration template created once and applied 5 times |
| 6 repos share near-identical _information_banner.scss | Same template pattern |
| bcpadmin is structurally different (different path, variables call govuk-colour) | Treat as separate work item, do not batch with others |
| sass-migrator handles mechanical @import→@use for files with explicit imports | Still requires manual work for implicit dependency (pure partials); not a complete automated solution |
| checks is the simplest repo by every metric | Use as pilot to validate approach before tackling notification (most complex) |
