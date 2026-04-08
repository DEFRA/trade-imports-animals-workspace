# Sass Deprecation Warnings: Remediation Plan

**Date:** 2026-03-24
**Scope:** All 7 frontend repos (`notification`, `decision`, `checks`, `control`, `upload`, `bordernotification`, `bcpadmin`)

---

## Summary of Warnings Found

All 7 repos produce deprecation warnings from the Sass compiler during `npm run build`. The warnings cluster into 5 categories, all pointing to the same underlying issue: the codebase uses the Sass legacy `@import` API which Dart Sass is progressively removing.

### Warning Categories

| Category | Sass Key | Dart Sass Deadline | Repos Affected |
|---|---|---|---|
| `@import` rules deprecated | `[import]` | Removed in 3.0.0 | All 7 |
| Global built-in functions (`mix`, `map-get`, etc.) | `[global-builtin]` | Removed in 3.0.0 | 6 (all except bcpadmin) |
| Deprecated `govuk-text-colour` mixin | N/A (govuk-frontend) | govuk-frontend v5 | 6 (all except bcpadmin) |
| Slash division (`$x / 2`) | `[slash-div]` | Removed in 2.0.0 | 5 (notification, decision, checks, control, bordernotification) |
| Deprecated colour functions (`lighten()`) | `[color-functions]` | Removed in 3.0.0 | 1 (notification only) |

---

## Warning Detail

### 1. `@import` rules — affects ALL repos

All repos use `@import` to load govuk-frontend and their own partials. This has been deprecated in favour of `@use` / `@forward`.

**Representative example** (same pattern in all repos):
```scss
// src/assets/sass/application.scss
@import "govuk-frontend/dist/govuk";
@import "base/variables";
@import "components/datepicker";
```

**Note:** The majority of the 277–360 "repetitive deprecation warnings omitted" messages are `@import` warnings cascading from govuk-frontend's own internal imports. These will be resolved automatically once govuk-frontend itself is migrated (see Phase 0 below).

**Import counts per repo:**

| Repo | `@import` count |
|---|---|
| notification | 108 |
| decision | 82 |
| upload | 37 |
| bordernotification | 36 |
| control | 33 |
| checks | 26 |
| bcpadmin | 25 |

---

### 2. Global built-in functions — affects 6 repos

Custom SCSS components call Sass built-in functions (`mix()`, `map-get()`) without loading the required Sass modules. Under `@import`, these functions were globally available. Under `@use`, they require explicit module imports.

**Affected files** (same `_datepicker.scss` appears in notification, decision, checks, control, bordernotification):

| File | Function | Fix |
|---|---|---|
| `components/_datepicker.scss` | `mix()` | `color.mix()` with `@use "sass:color"` |
| `components/_datepicker.scss` | `map-get()` | `map.get()` with `@use "sass:map"` |
| `components/_date.scss` (bordernotification) | `map-get()` | `map.get()` with `@use "sass:map"` |
| `components/_multi_file_upload.scss` (upload) | `map-get()` | `map.get()` with `@use "sass:map"` |

---

### 3. Deprecated `govuk-text-colour` mixin — affects 6 repos

govuk-frontend v5 deprecated the `govuk-text-colour` mixin. Custom components across the repos still call it. The fix is to replace `@include govuk-text-colour` with `color: govuk-colour(text)`.

**Instance counts per repo:**

| Repo | Files using `govuk-text-colour` |
|---|---|
| notification | 8 instances across 7 files |
| decision | 6 instances |
| checks | 3 instances |
| control | 2 instances |
| bordernotification | 3 instances |
| upload | 2 instances |

---

### 4. Slash division — affects 5 repos

The same pattern (`$gutter-half: $gutter / 2;`) appears in a shared notification-list/checks-list component in 5 repos.

| Repo | File | Line |
|---|---|---|
| notification | `components/_notification_list.scss` | 2 |
| decision | `components/_notification_list.scss` | 2 |
| checks | `components/_reenforced_checks_list.scss` | 2 |
| control | `components/_notification_list.scss` | 2 |
| bordernotification | `components/_notification_list.scss` | 2 |

**Fix:** Replace `$gutter / 2` with `math.div($gutter, 2)` or `calc(#{$gutter} / 2)`.

---

### 5. Deprecated colour functions — notification only

`_certificate.scss` in `eudp-live-animals-frontend-notification` uses `lighten()` in 4 places.

| File | Line | Usage |
|---|---|---|
| `pages/_certificate.scss` | 191, 202, 206, 212 | `lighten($black, 70%)` |

**Fix:** Replace with `color.scale($black, $lightness: 70%)` (after adding `@use "sass:color"`).

---

## Remediation Plan

### Phase 0 — Check govuk-frontend version (prerequisite)

Before doing any local fixes, check if a newer govuk-frontend is available that has already migrated to `@use` internally. This would eliminate the vast majority of cascading `@import` warnings automatically.

```bash
npm outdated govuk-frontend  # in each repo's service/ directory
```

If govuk-frontend v5.x+ ships with `@use`-based internals, upgrading it should clear the bulk of the "repetitive warnings omitted" messages. Coordinate with the npm upgrade work (ORCHESTRATOR) if upgrading govuk-frontend as part of a broader deps upgrade.

---

### Phase 1 — Quick wins (low risk, isolated fixes)

These can be done independently per repo with no architectural change.

**1a. Fix slash division** — 5 repos, 1 line each
In `_notification_list.scss` / `_reenforced_checks_list.scss`:
```scss
// Before
$gutter-half: $gutter / 2;

// After
@use "sass:math";
$gutter-half: math.div($gutter, 2);
```
Or, if `@use` migration isn't happening yet:
```scss
$gutter-half: calc(#{$gutter} / 2);
```

**1b. Fix `lighten()` in certificate.scss** — notification only, 4 lines
```scss
// Before
border-bottom: .5px solid lighten($black, 70%);

// After (requires @use "sass:color" at top of file)
border-bottom: .5px solid color.scale($black, $lightness: 70%);
```

**1c. Fix `govuk-text-colour` mixin calls** — 6 repos
Find and replace across all files:
```scss
// Before
@include govuk-text-colour;

// After
color: govuk-colour("text");
```
This is a safe mechanical replacement. Run a search across all 6 repos:
```bash
grep -rn "govuk-text-colour" service/src/assets/sass/
```

---

### Phase 2 — Migrate global built-in functions (medium complexity)

Fix the `mix()` and `map-get()` usage in `_datepicker.scss` and other components. This requires adding module imports at the top of each affected file.

For `_datepicker.scss` (appears in 5 repos — consider extracting to `eudp-live-animals-frontend-common` if not already there):

```scss
// Add at top
@use "sass:color";
@use "sass:map";

// Replace
$date-button-hover-colour: color.mix(#000000, govuk-colour("black", $variant: "tint-95"), 20%);
$icon-hover-colour: color.mix(#000000, $icon-base-colour, 20%);
@media screen and (min-width: map.get($govuk-breakpoints, "tablet")) { ... }
```

**Note:** If `_datepicker.scss` is duplicated across repos verbatim, consider whether it should live in `eudp-live-animals-frontend-common` as a shared component.

---

### Phase 3 — Full `@import` → `@use`/`@forward` migration (high complexity)

This is the root cause of all warnings. Migrating from `@import` to `@use`/`@forward` is the long-term fix and will silence all remaining deprecation warnings.

**Approach:** Use the official `sass-migrator` tool:
```bash
npx sass-migrator module --migrate-deps src/assets/sass/application.scss
```

The migrator handles:
- Converting `@import` to `@use` / `@forward`
- Adding `as *` namespacing where needed for backwards compatibility
- Flagging variables/mixins that need explicit re-exporting

**Key considerations:**
- govuk-frontend v5 uses `@use` internally. If still on v4, upgrading to v5 first simplifies the migration (avoids mixing old and new syntax at the boundary)
- Partials that define variables/mixins shared by multiple files will need `@forward` rather than `@use`
- `$govuk-*` variables used across partials will need the parent stylesheet to `@use "govuk-frontend/dist/govuk" as govuk` or be forwarded explicitly

**Suggested migration order per repo:**
1. `base/` files first (variables, utilities) — establish the new module structure
2. `components/` — depend on base variables
3. `pages/` — depend on components
4. `application.scss` last — orchestrates everything

---

## Recommended Delivery

| Priority | Work | Risk | Effort |
|---|---|---|---|
| Now | Phase 0: Check govuk-frontend version | None | 30 min |
| Short-term | Phase 1a: Slash division fixes | Very low | ~1h across all repos |
| Short-term | Phase 1b: `lighten()` fix in notification | Very low | 15 min |
| Short-term | Phase 1c: `govuk-text-colour` replacements | Low | ~2h across 6 repos |
| Medium-term | Phase 2: Global built-in functions | Medium | ~1 day per repo |
| Long-term | Phase 3: Full `@use`/`@forward` migration | High | 2-3 days per repo (or 1 sprint for all with sass-migrator) |

---

## One Jira Ticket or Seven?

Given the identical warning patterns across repos, this work is best split as:

- **1 spike/investigation ticket** — confirm govuk-frontend upgrade path (Phase 0)
- **1 ticket for Phase 1 fixes** — mechanical changes, low risk, can be batched into one cross-repo PR
- **7 tickets for Phase 3** — one per repo, each is an isolated migration that shouldn't block others

Phases 1 and 2 can be combined into the same ticket/PR per repo if preferred.
