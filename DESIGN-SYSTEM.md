# THIÊN LỘC GROUP - Medical Design System

Status: Normative specification v1.0  
Phase: 1 - Design System only  
Last updated: 13/08/2026  
Applies to: Public Website, User Portal, Admin

## 1. System intent

This document is the source of truth for the THIÊN LỘC GROUP interface foundation. It defines tokens, component contracts, states, responsive behavior and accessibility requirements. It does not define a Homepage or any full-page composition.

Design read:

> A medical and veterinary B2B system for clinicians, procurement teams, technicians, sales staff and administrators. The language is clinical, careful and technical. The interface prioritizes evidence, readable specifications and predictable tasks over visual effects.

Taste Skill dials:

| Dial | Value | System effect |
|---|---:|---|
| Design variance | 4/10 | Familiar controls, measured visual rhythm, no experimental affordance |
| Motion intensity | 2/10 | State feedback only, no decorative entrance motion |
| Visual density | 6/10 | Technical information can be dense, but labels and touch targets remain comfortable |

Core rules:

1. Clarity > Decoration.
2. Readability > Effects.
3. Information > Marketing noise.
4. Evidence > Claims.
5. Standard behavior > Novel controls.
6. Tokens > Hard-coded values.
7. Border and spacing > Shadow.

## 2. Scope and implementation contract

### 2.1 Included

- Typography, color, spacing, radius, shadow, motion, breakpoint and layer tokens.
- Buttons, form controls, data display, navigation and product foundations.
- Default, hover, focus, active, disabled, loading, empty and error states where relevant.
- WCAG 2.2 AA requirements and semantic HTML contracts.
- Usage guidance for Public Website, User Portal and Admin.

### 2.2 Excluded

- Homepage or any full page.
- Brand logo redesign.
- Framework, router, build system or package selection.
- Business rules, product taxonomy and API contracts.
- Final production component code. No frontend framework exists in the workspace yet.

### 2.3 Authority order

When rules conflict, use this order:

1. Accessibility and user safety.
2. Semantic component behavior.
3. This design system.
4. Page-specific composition.
5. Decorative preference.

### 2.4 Naming conventions

- CSS tokens: semantic kebab case, for example `--color-primary-hover`.
- Components: PascalCase, for example `ProductCard`.
- Variants: lowercase semantic names, for example `primary`, `danger`, `outline`.
- State is exposed with native attributes first: `disabled`, `aria-invalid`, `aria-busy`, `aria-selected`, `aria-current`.
- Use `data-state` only when native HTML/ARIA cannot express the visual state.
- Never name a color token after its raw hue, such as `blue-500`, inside component APIs.

## 3. Typography

### 3.1 Font family

Primary family:

```css
--font-sans: "Be Vietnam Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Use one family across Public Website, User Portal and Admin. Do not introduce a serif or display font to simulate premium styling.

### 3.2 Font loading

Load only:

- 400 Regular
- 500 Medium
- 600 SemiBold
- 700 Bold

Requirements:

- Self-host WOFF2 when licensing and asset pipeline are confirmed.
- Load only Latin and Vietnamese glyph coverage required by the product.
- Use `font-display: swap`.
- Do not load italic files until approved content requires italics.
- Do not synthesize unavailable weights.
- Preload only the weight used above the fold. Do not preload all four weights by default.
- If static font files are used, provide exactly four `@font-face` declarations.

### 3.3 Weight roles

| Weight | Role |
|---:|---|
| 400 | Body, descriptions, long-form content |
| 500 | Labels, navigation, compact metadata, table cells |
| 600 | Buttons, field labels, H4, card titles, active navigation |
| 700 | Hero H1, Page H1, H2 and rare emphasis |

Do not use 700 for full paragraphs or entire tables.

### 3.4 Type tokens

Public headings may be fluid. Product UI headings remain fixed to preserve density.

```css
--font-size-hero: clamp(2.25rem, 1.68rem + 2.4vw, 3.5rem);
--font-size-page-h1: clamp(2rem, 1.52rem + 2vw, 3rem);
--font-size-h2: clamp(1.875rem, 1.65rem + 0.9vw, 2.25rem);
--font-size-h3: clamp(1.375rem, 1.24rem + 0.55vw, 1.625rem);
--font-size-h4: clamp(1.125rem, 1.06rem + 0.25vw, 1.25rem);
--font-size-body-lg: 1.0625rem;
--font-size-body: 1rem;
--font-size-body-compact: 0.9375rem;
--font-size-small: 0.875rem;
--font-size-meta: 0.8125rem;

--line-height-hero: 1.1;
--line-height-heading: 1.2;
--line-height-body: 1.6;
--line-height-ui: 1.45;
--line-height-small: 1.45;

--letter-spacing-display: -0.022em;
--letter-spacing-heading: -0.012em;
--letter-spacing-body: 0;
--letter-spacing-label: 0.005em;
```

### 3.5 Hierarchy

| Role | Desktop | Mobile | Weight | Line height | Max usage |
|---|---:|---:|---:|---:|---|
| Hero H1 | 48-56px | 36-42px | 700 | 1.10 | Public hero only, max 2 lines |
| Page H1 | 40-48px | 32-38px | 700 | 1.15 | One per page |
| H2 | 30-36px | 27-32px | 700 | 1.20 | Major section heading |
| H3 | 22-26px | 21-24px | 600 | 1.25 | Subsection/card title |
| H4 | 18-20px | 18-20px | 600 | 1.30 | Group heading |
| Body Large | 17px | 17px | 400 | 1.65 | Introductory copy |
| Body | 16px default, 15px dense UI | 16px | 400 | 1.55-1.65 | Main content and controls |
| Small | 14px | 14px | 400/500 | 1.45 | Helper and secondary text |
| Metadata | 13px | 13px | 500 | 1.45 | Non-critical metadata only |

Rules:

- Important product, medical, pricing, form or status information must never be 12px.
- Body copy is capped at 65-75ch.
- Apply balanced wrapping to H1-H3 and pretty wrapping to prose when supported.
- Headings use sentence case.
- Uppercase is limited to short data labels. It is not a section-heading pattern.
- Product model, SKU and numeric table columns use `font-variant-numeric: tabular-nums`.
- Monospace is reserved for actual codes, serial numbers and machine-readable identifiers.

## 4. Color system

### 4.1 Strategy

The physical scene is a clinician or procurement specialist comparing technical information in a bright office or clinical environment. The normative theme is light, high-clarity and restrained.

The primary anchor follows the cobalt/indigo seed from the Taste Skill palette step. It is a corporate instrument blue, not a generic cyan medical gradient. Primary color should occupy no more than about 10% of a typical view.

Green is reserved for success. Amber is reserved for warning. Red is reserved for danger. Info uses a distinct blue-cyan role only for semantic messages. None are decorative palette accents.

### 4.2 Semantic color tokens

OKLCH values are authoritative. Hex approximations may be generated by tooling for legacy clients but must not become source tokens.

```css
:root {
  color-scheme: light;

  --color-background: oklch(0.985 0.003 250);
  --color-foreground: oklch(0.235 0.025 250);

  --color-surface: oklch(1 0 0);
  --color-surface-subtle: oklch(0.965 0.008 250);
  --color-surface-raised: oklch(1 0 0);

  --color-border: oklch(0.875 0.012 250);
  --color-border-strong: oklch(0.64 0.02 250);

  --color-primary: oklch(0.46 0.135 250);
  --color-primary-hover: oklch(0.405 0.125 250);
  --color-primary-active: oklch(0.355 0.115 250);
  --color-primary-foreground: oklch(0.985 0.003 250);
  --color-primary-subtle: oklch(0.945 0.028 250);

  --color-secondary: oklch(0.94 0.014 250);
  --color-secondary-hover: oklch(0.90 0.02 250);
  --color-secondary-foreground: oklch(0.285 0.04 250);

  --color-muted: oklch(0.95 0.006 250);
  --color-muted-foreground: oklch(0.43 0.022 250);

  --color-success: oklch(0.39 0.09 150);
  --color-success-subtle: oklch(0.95 0.032 150);
  --color-success-foreground: oklch(0.39 0.09 150);

  --color-warning: oklch(0.43 0.09 75);
  --color-warning-subtle: oklch(0.955 0.045 85);
  --color-warning-foreground: oklch(0.43 0.09 75);

  --color-danger: oklch(0.46 0.15 25);
  --color-danger-hover: oklch(0.405 0.14 25);
  --color-danger-active: oklch(0.36 0.13 25);
  --color-danger-subtle: oklch(0.95 0.035 25);
  --color-danger-foreground: oklch(0.985 0.003 250);

  --color-info: oklch(0.43 0.10 225);
  --color-info-subtle: oklch(0.95 0.03 225);
  --color-info-foreground: oklch(0.43 0.10 225);

  --color-focus-ring: oklch(0.55 0.17 250);
  --color-focus-ring-inverse: oklch(0.985 0.003 250);
  --color-overlay: oklch(0.16 0.02 250 / 0.48);
  --color-skeleton: oklch(0.91 0.01 250);
  --color-disabled: oklch(0.93 0.008 250);
  --color-disabled-foreground: oklch(0.52 0.015 250);
}
```

### 4.3 Token usage

| Token | Use | Do not use for |
|---|---|---|
| `background` | Page canvas | Card fill on every section |
| `foreground` | Primary text | Decorative dark blocks |
| `surface` | Controls, tables, necessary panels | Wrapping every content group |
| `surface-subtle` | Toolbar, grouped specs, alternate row group | Random section coloring |
| `border` | Dividers, passive boundaries | Input boundary when 3:1 is required |
| `border-strong` | Inputs, selected structural edges | Every card |
| `primary` | Primary action, active navigation, key link | Large decorative backgrounds |
| `secondary` | Neutral secondary control | Second brand accent |
| `muted` | Disabled/passive surface | Low-contrast body text |
| Semantic colors | Actual state and feedback | Category decoration or product marketing |

### 4.4 Contrast verification

Ratios are calculated from the normative OKLCH values converted to sRGB. Browser implementation must be rechecked because color management can vary slightly.

| Pair | Ratio | Requirement | Result |
|---|---:|---:|---|
| Foreground / Background | 15.95:1 | 4.5:1 | Pass |
| Muted foreground / Background | 7.75:1 | 4.5:1 | Pass |
| Foreground / Surface | 16.65:1 | 4.5:1 | Pass |
| Primary foreground / Primary | 6.81:1 | 4.5:1 | Pass |
| Primary foreground / Primary hover | 8.59:1 | 4.5:1 | Pass |
| Secondary foreground / Secondary | 12.03:1 | 4.5:1 | Pass |
| Success / Success subtle | 8.05:1 | 4.5:1 | Pass |
| Warning / Warning subtle | 7.22:1 | 4.5:1 | Pass |
| Danger / Danger subtle | 6.49:1 | 4.5:1 | Pass |
| Info / Info subtle | 6.69:1 | 4.5:1 | Pass |
| Focus ring / Background | 4.61:1 | 3:1 | Pass |
| Border strong / Background | 3.22:1 | 3:1 for control boundary | Pass |

### 4.5 Theme policy

- Light theme is normative for Phase 1 because the primary use scene is bright and information-heavy.
- Do not auto-switch Public Website to dark mode from system preference until a complete dark semantic palette is designed and audited.
- Portal/Admin may add dark mode later only if real users need it.
- Never invert individual sections to simulate visual variety.

## 5. Spacing and rhythm

### 5.1 Base scale

```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

No component may introduce an arbitrary spacing value without adding a documented token.

### 5.2 Semantic spacing

| Relationship | Token/value | Examples |
|---|---|---|
| Icon to label | 8px | Button, menu item, status |
| Label to control | 8px | Form field |
| Control to helper/error | 8px | Form field |
| Closely related text | 4-8px | Title and metadata |
| Component internal gap | 12-16px | Card content, toolbar group |
| Component padding compact | 12-16px | Dense Admin controls |
| Component padding default | 20-24px | Product/Category Card |
| Group to group | 24-32px | Form sections, spec groups |
| Section tight | 48px | Continuation of same narrative |
| Section standard | 64px | Normal Public section boundary |
| Section spacious | 80-96px | Major topic change or evidence block |

### 5.3 Rhythm rules

- Choose section spacing by relationship: tight, standard or spacious. Do not pick ad hoc values.
- Do not assign 64px to every section.
- Heading to introductory text is tighter than introductory text to content.
- Dense Portal/Admin pages use 24-40px page rhythm and 8-24px component rhythm.
- Public pages may use 48-96px section rhythm.
- Mobile reduces section rhythm one step: 96 to 64, 80 to 48-64, 64 to 40-48, 48 to 32-40.
- Nested containers do not duplicate padding. A panel inside a padded page must not create a second identical gutter without need.

## 6. Radius, border and shadow

### 6.1 Radius tokens

```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.625rem;  /* 10px */
--radius-xl: 0.75rem;   /* 12px */
--radius-pill: 999px;
```

| Component | Radius |
|---|---:|
| Compact control, checkbox | 6px |
| Button, input, select, dropdown | 8px |
| Product/Category Card, file upload | 10px |
| Drawer, modal, large media | 12px |
| Status, active filter, essential tag | Pill |

Pill is not permitted for ordinary buttons, cards, input containers or navigation shells.

### 6.2 Border tokens

```css
--border-width-default: 1px;
--border-width-focus: 2px;
--border-width-selected: 2px;
```

- Use `border` for passive grouping and dividers.
- Use `border-strong` for controls that need a visible boundary.
- Selected state uses primary border plus another signal, such as checkmark or background.
- Never use a thick colored side stripe on cards, alerts or list rows.

### 6.3 Shadow tokens

```css
--shadow-none: none;
--shadow-sticky: 0 1px 3px oklch(0.235 0.025 250 / 0.10);
--shadow-dropdown: 0 4px 12px oklch(0.235 0.025 250 / 0.12);
--shadow-modal: 0 12px 32px oklch(0.235 0.025 250 / 0.16);
```

Rules:

- Normal cards use `shadow-none`.
- Prefer border, spacing and background hierarchy.
- Sticky elements may use `shadow-sticky` only after they detach from the page.
- Dropdown/popover may use `shadow-dropdown` without a decorative border-shadow combination.
- Modal may use `shadow-modal`; the overlay provides most of the separation.
- `shadow-xl`, `shadow-2xl`, glow and glass effects are not part of this system.

## 7. Motion, layers and responsive primitives

### 7.1 Motion tokens

```css
--duration-instant: 0ms;
--duration-fast: 120ms;
--duration-default: 180ms;
--duration-slow: 240ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-exit: cubic-bezier(0.4, 0, 1, 1);
```

- Animate only state changes, feedback and continuity.
- Prefer opacity and transform.
- Do not use bounce, elastic, parallax, marquee or page-wide fade-up.
- Content is visible before animation enhancement.
- Under `prefers-reduced-motion: reduce`, state transitions become instant except essential progress indication.

### 7.2 Layer scale

```css
--z-base: 0;
--z-sticky: 100;
--z-dropdown: 200;
--z-drawer: 300;
--z-backdrop: 400;
--z-modal: 500;
--z-toast: 600;
--z-tooltip: 700;
```

Do not use arbitrary values such as 999 or 9999.

### 7.3 Breakpoints

```css
--breakpoint-sm: 40rem;   /* 640px */
--breakpoint-md: 48rem;   /* 768px */
--breakpoint-lg: 64rem;   /* 1024px */
--breakpoint-xl: 80rem;   /* 1280px */
--breakpoint-2xl: 96rem;  /* 1536px */
```

- Breakpoint use follows content failure, not device naming alone.
- Multi-column composition collapses to one column below 768px unless the content proves a two-column mobile layout remains readable.
- Touch targets are at least 44x44px on coarse pointers.
- Do not use fixed widths that cause horizontal page scroll.

## 8. Shared interaction rules

### 8.1 Focus

- Use `:focus-visible`, not permanent focus decoration after pointer click.
- Standard focus: 2px focus ring with 2px offset.
- On a primary-colored surface, use a double indicator: 2px inverse ring plus an outer focus ring.
- Focus must not be clipped by overflow containers.
- Sticky headers must account for focused anchors with scroll margin.

### 8.2 Disabled

- Disabled controls use disabled surface and disabled foreground.
- Disabled state must not rely on opacity below readable contrast.
- Native `disabled` is used whenever supported.
- Explain why an important action is disabled when the reason is not obvious.

### 8.3 Loading

- Preserve component width and layout.
- Set `aria-busy="true"` on the affected region/control.
- Buttons may use a compact progress spinner plus an unchanged or explicit loading label.
- Content regions use structure-matching skeletons, not a centered generic spinner.
- Do not block unrelated content during a local load.

### 8.4 Error

- Error is stated in text and associated with the source.
- Use danger color plus icon/text, never color alone.
- Preserve user-entered values after submission errors.
- Move focus to the error summary only after full-form submission, not on every keystroke.

### 8.5 Control dimensions

| Size | Visual height | Horizontal padding | Icon | Use |
|---|---:|---:|---:|---|
| sm | 40px | 12px | 16px | Dense desktop toolbars only |
| md | 44px | 16px | 18px | Default UI |
| lg | 48px | 20px | 20px | Public primary action and older-user forms |

On coarse pointers, `sm` receives a minimum 44px hit area without changing its visual density.

## 9. Buttons

### 9.1 Anatomy

Button can contain:

- Optional leading icon.
- One short label, ideally 1-3 words.
- Optional trailing icon only when it clarifies direction or menu behavior.
- Loading indicator replacing one icon, not both label and context.

Use `<button>` for actions and `<a>` for navigation. Do not style an anchor as a disabled button without removing it from the action flow and explaining the unavailable destination.

### 9.2 Variants

| Variant | Default | Hover | Active | Intended use |
|---|---|---|---|---|
| Primary | Primary fill, primary foreground | Primary hover | Primary active | One main action per region |
| Secondary | Secondary fill, secondary foreground | Secondary hover | Slightly darker secondary | Supporting action |
| Outline | Surface, border strong, foreground | Surface subtle | Secondary | Alternative action with visible boundary |
| Ghost | Transparent, foreground | Surface subtle | Secondary | Low-emphasis toolbar/navigation action |
| Danger | Danger fill, danger foreground | Danger hover | Danger active | Destructive action after clear labeling |
| Link | Transparent, primary text, underline on hover | Primary hover text | Primary active text | Inline navigation, never form submit |

### 9.3 States

| State | Contract |
|---|---|
| Default | Label and action are unambiguous |
| Hover | Color shift only; no large lift or glow |
| Focus | Visible focus ring, same action remains stable |
| Active | 1px downward translation or 0.99 scale plus active color |
| Disabled | Native disabled, readable label, no pointer event |
| Loading | `aria-busy`, width retained, repeated activation blocked |

Additional rules:

- Button label does not wrap on desktop.
- Icon-only button requires an accessible name and tooltip for unfamiliar actions.
- Do not place two Primary buttons in one CTA group.
- Danger is never used to make a normal CTA more noticeable.
- Minimum gap between adjacent buttons is 8px; 12px is preferred.

## 10. Form components

### 10.1 Field anatomy

Every field follows this order:

1. Visible label.
2. Optional marker such as “Không bắt buộc”, written in text.
3. Control.
4. Helper text when needed.
5. Error text when invalid.

Field defaults:

- Label: 15-16px, weight 600.
- Control text: 16px.
- Default control height: 48px for Public and older-user workflows; 44px for dense Portal/Admin.
- Field gap: 8px.
- Field-group gap: 20-24px.
- Placeholder is an example or format hint only. It never replaces the label.
- Required state is announced programmatically and visually.

### 10.2 Input

- Use semantic input type: email, tel, number, search, date where appropriate.
- Default border uses `border-strong` to meet non-text contrast.
- Hover darkens the boundary without moving the field.
- Focus uses focus ring and primary boundary.
- Invalid uses danger boundary, `aria-invalid="true"` and `aria-describedby`.
- Read-only remains readable and selectable; it is visually distinct from disabled.
- Prefix/suffix cannot obscure the text value at 200% zoom.

### 10.3 Textarea

- Minimum height 120px.
- Resize vertically unless the content model requires auto-growth.
- Character count is shown only when a real limit exists.
- Error and count remain separate so screen readers do not announce a confusing combined string.

### 10.4 Select

- Use native `<select>` for simple, short, single-choice lists.
- Use a custom listbox only when search, grouping or rich option content is required.
- Label and current value remain visible.
- Placeholder-like empty option is not a substitute for the label.

### 10.5 Combobox

- Use the ARIA combobox pattern with text input, popup listbox and active descendant management.
- Supports Arrow Up/Down, Enter, Escape, Home/End and text input.
- Announces result count and current option without excessive live-region updates.
- Free-text input is allowed only when the data model accepts values outside the list.

### 10.6 Autocomplete

- Use for suggestions that assist but do not constrain input.
- Visually distinguish suggested completion from entered text.
- Do not auto-submit when a suggestion is selected.
- Search results preserve exact Vietnamese diacritics while matching accent-insensitively when useful.

### 10.7 Checkbox

- Native checkbox semantics.
- 20-24px visual control with a 44px row hit target.
- Label is clickable and placed to the right.
- Supports checked, unchecked, indeterminate, focus, disabled and error group states.
- Use a checkbox for independent selections, not mutually exclusive choices.

### 10.8 Radio

- Use `<fieldset>` and `<legend>` for each group.
- One choice per group.
- Arrow-key behavior follows native radio semantics.
- Do not use radio controls for immediate navigation when tabs are clearer.

### 10.9 Switch

- Use only for immediate binary settings.
- Label describes the setting, not the action, for example “Nhận email bảo trì”.
- State is exposed with checkbox or `role="switch"` and `aria-checked`.
- Do not use a switch for form answers that are saved later; use checkbox/radio instead.

### 10.10 Date Picker

- Always permits typed date entry in a documented format.
- Calendar button has an accessible name.
- Popup uses dialog/grid semantics and supports arrow keys, Page Up/Down, Home/End, Enter and Escape.
- Selected, today, disabled and out-of-range dates are visually and programmatically distinct.
- Do not rely on color alone for selected/today state.
- Preserve locale `vi-VN`; store machine values separately from displayed format.

### 10.11 File Upload

- Standard file input remains available to assistive technology.
- Drag and drop is an enhancement, never the only method.
- Dropzone height at least 112px and has a visible browse action.
- State list shows file name, type, size, progress, success/error and remove action.
- Declare accepted file types and maximum size before selection.
- Error identifies the exact file and reason.

### 10.12 Search Input

- Uses `<input type="search">` inside a `<form role="search">` where it is the page/site search.
- Has visible or programmatically persistent label.
- Search icon is decorative when a text label exists.
- Clear action appears only when there is a value and has an accessible name.
- Enter submits. Escape clears suggestions before clearing the query.
- Default height 48px Public, 44px Portal/Admin.

## 11. Data components

### 11.1 Table

Anatomy:

- Caption or external heading associated with the table.
- Optional toolbar above the table.
- Semantic `<table>`, `<thead>`, `<tbody>`, `<th scope>` and `<td>`.
- Optional row selection uses a labeled checkbox column.
- Optional row actions use a clear menu button.

Rules:

- Default row height 48px; compact Admin row 40-44px only when touch use is not primary.
- Numeric columns align right and use tabular figures.
- Text columns align left.
- Header remains visible for long scroll regions when technically safe.
- Zebra striping is optional; use subtle row hover and sparse dividers first.
- Table does not sit inside another decorative card by default.
- Empty, loading and error states occupy the table region without changing page structure.

Responsive behavior must be chosen per task:

1. Horizontal scroll with sticky key column for true comparison tables.
2. Priority columns plus a row details disclosure for operational tables.
3. A separate details view when the row has many fields.

Do not automatically convert every table row into a card on mobile.

### 11.2 Pagination

- Use when result position and stable URLs matter.
- Includes Previous, Next, current page and a compact window of page numbers.
- Current page uses `aria-current="page"`.
- Disabled previous/next uses native disabled or non-link text.
- Touch targets are at least 44px.
- Do not render every page number for large result sets.
- Pagination state is represented in the URL for Public searchable content.

### 11.3 Filter Bar

- Groups query, filters, sort and result count by function.
- Active filters appear as removable pills only because they represent applied state.
- Clear all is shown only when at least one filter is active.
- Mobile filter opens a Drawer with Apply and Clear controls plus expected result count when available.
- Filter state persists through detail/back navigation when feasible.

### 11.4 Sort

- Label is explicit, for example “Sắp xếp theo”.
- Use Select for one sort key or sortable table headers for column sort.
- Sort direction is visible and programmatically announced.
- A sortable table header remains a `<th>` containing a button.
- Default sort is explained if not obvious.

### 11.5 Tabs

- Use for peer views of the same context, not sequential steps.
- Follow ARIA tabs pattern with roving tab index.
- Arrow keys move focus; Enter/Space behavior matches activation mode.
- Active tab has text/weight and indicator, not color alone.
- On narrow screens, use scrollable tabs only when labels remain readable; otherwise use Select or a structured list.
- Tabs are not pill badges.

### 11.6 Accordion

- Use native `<details>/<summary>` when behavior and styling allow.
- Custom accordion headers are buttons with `aria-expanded` and `aria-controls`.
- Heading hierarchy remains semantic.
- Multiple panels may stay open unless the content model requires one-at-a-time behavior.
- Do not hide decision-critical product information behind closed accordions by default.

### 11.7 Specification Table

Use for grouped technical facts, not marketing benefits.

Anatomy:

- Specification group heading.
- Optional group description.
- Label/value rows.
- Optional unit, tolerance or source note.

Rules:

- Group long specifications into meaningful sections such as Performance, Dimensions, Electrical and Accessories.
- Use one divider between rows, not both top and bottom borders on every row.
- Desktop label column is 32-40%; value column uses remaining width.
- Mobile stacks label above value with 4-8px gap.
- Units remain attached to values and do not wrap alone.
- Definitions use `<dl>`, `<dt>`, `<dd>` when the content is not genuinely tabular.
- Three to five decision-critical specifications may be featured outside this component; the full specification remains grouped here.

### 11.8 Status

Status variants:

- Neutral
- Info
- Success
- Warning
- Danger

Status can use pill shape because it represents state. It includes concise text and optional semantic icon. Decorative dots are not used. Status text must remain meaningful without color, for example “Còn hàng”, “Sắp hết hạn”, “Ngừng kinh doanh”.

### 11.9 Empty State

Contains:

- Plain-language title.
- One-sentence explanation.
- One primary recovery/start action when appropriate.
- Optional secondary help link.

Do not use oversized illustrations, confetti or “Không có gì ở đây” without next steps.

### 11.10 Loading State

- Use skeletons matching the final content hierarchy.
- Reserve final dimensions to prevent layout shift.
- Do not animate more than necessary.
- Set `aria-busy` on the region and provide a concise accessible loading label.

### 11.11 Error State

- Inline error for field/local component failure.
- Section error for data region failure with Retry.
- Page error only when the page cannot function.
- State what failed and what the user can do.
- Do not use “Oops”.

### 11.12 Skeleton

Variants:

- Text: 1-3 lines with realistic varied widths.
- Product media: reserved aspect ratio.
- Table: header plus representative rows.
- Card: mirrors image/title/meta/action structure.

Default is static subtle fill. Optional shimmer runs only under no-preference motion and must not continuously repaint a large scrolling container.

## 12. Navigation components

### 12.1 Breadcrumb

- Semantic `<nav aria-label="Breadcrumb">` with ordered list.
- Current page is text or link with `aria-current="page"`.
- Separator is hidden from assistive technology.
- Mobile may collapse middle items into an accessible menu, but parent and current remain visible.
- Product breadcrumb reflects real taxonomy and does not invent duplicate levels.

### 12.2 Dropdown

- Trigger is a button with expanded state and relationship to the popup.
- Menu behavior is used only for commands. Navigation lists use disclosure/list semantics.
- Supports Enter, Space, Escape and Arrow keys according to the selected pattern.
- Popup uses a portal/fixed layer when ancestor overflow may clip it.
- Closes on outside interaction and returns focus to trigger on Escape.

### 12.3 Mega Menu foundation

Purpose: browse product taxonomy by Y tế, Thú y, Danh mục, Chuyên khoa and Thương hiệu.

Contract:

- Trigger remains part of one-line desktop navigation.
- Menu is grouped into 2-4 meaningful columns based on taxonomy, not equal decorative cards.
- Group headings are text headings; links remain ordinary links.
- Optional featured content uses real product/brand imagery only.
- Opens by deliberate click or stable hover intent, never by accidental pointer crossing.
- Escape closes; Tab traverses in DOM order; focus is never trapped.
- Mobile does not reuse the desktop mega-menu layout. It becomes grouped accordion navigation.

### 12.4 Tabs

Navigation Tabs follow the data Tabs contract in section 11.5. Route-level tabs use links and `aria-current`, not `role="tab"`, unless content changes without navigation.

### 12.5 Sidebar

- Used for Portal/Admin task navigation or complex desktop filters.
- Has clear group labels and active state.
- Active item uses color, weight and shape/background, not color alone.
- Collapse preserves accessible names through tooltip/label strategy.
- Mobile converts to Drawer; it does not remain a narrow fixed rail.
- Sidebar width is content-led, baseline 240-280px expanded.

### 12.6 Mobile Drawer

- Uses dialog semantics with accessible title.
- Focus is trapped while open and restored to trigger on close.
- Escape and close button both work.
- Background scroll is locked without shifting layout.
- Width is min(90vw, 360px) for navigation/filter use; full-screen only for complex search.
- Uses 12px outer radius only on the exposed edge where the platform pattern supports it.

### 12.7 Pagination

Navigation Pagination follows section 11.2 and is not duplicated as a second visual pattern.

### 12.8 Command Search

Purpose: fast navigation and action discovery for Portal/Admin. Public global search is content search and remains a separate pattern.

Contract:

- Opens from labeled search control; keyboard shortcut is supplementary.
- Dialog has search input, grouped results and empty/error state.
- Results declare type: page, product, customer, document or action.
- Arrow keys move active result; Enter activates; Escape closes.
- Recent searches are user-controlled and do not expose sensitive data on shared devices.
- Command actions requiring destructive confirmation do not execute immediately from search.

## 13. Product foundations

### 13.1 Product Card

Purpose: browse and compare products, not create a promotional tile.

Anatomy:

1. Product image with reserved aspect ratio.
2. Brand and model metadata.
3. Product name, max 2-3 lines.
4. Two to four decision-critical attributes.
5. Optional status/product badge.
6. Price display or quote policy.
7. One primary card action or full-card link, not both with conflicting click areas.

Rules:

- Radius 10px, border by default, no normal shadow.
- Image is real and accurate; no gradient placeholder in production.
- Card height may vary with content. Do not force equal height by truncating critical information.
- Card is not nested inside another card.
- Hover changes boundary/background subtly; no lift greater than 1px.
- Compare checkbox, when present, remains a separate labeled control.

### 13.2 Category Card

- Represents a real taxonomy destination.
- Contains category name, optional product count and accurate category image/icon.
- Description is one short sentence only when it improves disambiguation.
- No decorative badge or icon above every title.
- May use text-led horizontal row instead of card grid when categories are numerous.

### 13.3 Brand Item

- Shows official logo and brand name for accessibility.
- Logo has consistent bounding box without distorting aspect ratio.
- Optional product count is metadata, not a badge.
- No invented country/quality claim.
- Dense brand directories should use list/grid with dividers, not heavy cards.

### 13.4 Specification Row

- Label, value, optional unit and optional source/help action.
- Uses 15-16px for critical value; 14-15px label minimum.
- Value can be copied when it is a model, code or precise technical identifier.
- Long values wrap naturally; units stay with the number.
- Do not place every row in its own card.

### 13.5 Price Display

Variants:

- Public price: formatted VND with locale-aware separators.
- From price: explicit “Từ” label.
- Quote required: plain “Liên hệ báo giá”, not a fake zero price.
- Previous price: only when a real commercial policy supports it.

Rules:

- Price uses foreground or primary, never danger red by default.
- Main price is 22-30px, weight 700, tabular figures.
- Tax, configuration and validity context appears immediately nearby at 14px minimum.
- Do not use flash-sale styling, countdown or percentage badge without real data.

### 13.6 Product Badge

Allowed purposes:

- New product with a defined date window.
- Official distributor/authorization.
- Availability or lifecycle state.
- Regulatory/certification status when verified.

Not allowed:

- Decorative “Premium”, “Best”, “Hot” or unverified “Medical grade”.
- More than two visible badges on one Product Card.
- Overlay that covers important product imagery.

Badge uses pill only because it expresses status/category. Text is 13-14px and remains understandable without color.

### 13.7 Document Row

Anatomy:

- Document title.
- Document type and optional language.
- File format and size when known.
- Updated date/version when real.
- Download/view action.

Rules:

- Use a row with divider, not a card per document.
- Link label states action and document, for example “Tải catalogue PDF”.
- Opening a new tab is announced.
- Restricted documents show access requirement before activation.

### 13.8 CTA Group

- One Primary action.
- Maximum one Secondary or Outline action.
- Optional Link action may follow when intent differs.
- Gap 8-12px.
- Stack full-width below 480px when labels or touch targets require it.
- Avoid duplicate intent: “Yêu cầu báo giá” and “Nhận báo giá” cannot coexist in one group.
- Destructive action never shares equal prominence with the primary commercial action.

## 14. Icons and content rules

### 14.1 Icons

- Use one icon family, baseline Phosphor with regular weight.
- Standard UI sizes: 16, 18, 20 and 24px.
- Do not hand-draw common interface SVG icons.
- Do not place an icon in every heading.
- Do not use a medical cross, heart pulse or shield as generic decoration.
- Icon-only actions require accessible names.

### 14.2 Interface language

- Use direct Vietnamese labels and sentence case.
- Avoid AI marketing words such as “nâng tầm”, “đột phá”, “liền mạch” and “thế hệ mới” without evidence.
- Do not use fake statistics, fake certifications or perfect round metrics.
- Error copy states what failed and how to recover.
- Status labels use domain language consistently across Public, Portal and Admin.

## 15. Accessibility requirements

### 15.1 WCAG 2.2 AA baseline

- Normal text contrast at least 4.5:1.
- Large text contrast at least 3:1.
- UI component boundary and focus indicator contrast at least 3:1 against adjacent colors.
- Keyboard focus is visible and not obscured.
- Pointer targets are at least 44x44px where the interface is touch-capable.
- Page/component remains usable at 200% text zoom and 400% browser zoom where applicable.
- No information is conveyed by color alone.
- Motion respects reduced-motion preference.

### 15.2 Semantic HTML

- Use native elements before ARIA.
- Buttons perform actions; links navigate.
- Heading levels represent structure, not visual size.
- Tables use real table semantics when data relationships are tabular.
- Form groups use fieldset/legend where appropriate.
- Navigation regions have specific accessible names when multiple navs exist.

### 15.3 Keyboard contract

- Tab order follows visual and task order.
- No positive `tabindex`.
- Escape closes transient overlays and restores focus.
- Arrow keys are implemented only for patterns that require them, such as tabs, menus, listboxes and grids.
- Focus is trapped only in modal dialogs/drawers.
- Hover-only content is also available through focus and touch.

### 15.4 ARIA contract

- ARIA supplements native semantics; it does not replace them.
- Every icon-only control has an accessible name.
- Expanded, selected, current, busy and invalid states are programmatically exposed.
- Live regions are concise and not updated on every keystroke unnecessarily.
- IDs used by `aria-describedby`, `aria-controls` and labels are stable and unique.

### 15.5 Older-user readability

- Default form and Public body text is 16px.
- Default controls are 44-48px high.
- Labels remain visible before, during and after input.
- Instructions do not depend on memory of placeholder text.
- Error messages use plain language and remain near the field.
- Dense data views offer comfortable mode when user testing shows need.

## 16. Component governance

### 16.1 Shared across all surfaces

- Tokens.
- Button and IconButton.
- Form primitives.
- Status and feedback states.
- Breadcrumb, Tabs, Pagination primitives.
- Accessibility behavior.

### 16.2 Shared behavior, separate composition

- Public Search and Command Search share input/focus primitives but not result behavior.
- Public Product Card and Admin product row share product data tokens but not container composition.
- Public Mega Menu and Admin Sidebar share navigation tokens but not layout.
- Specification Table may appear Public/Portal; Admin uses editable data patterns separately.

### 16.3 Release checklist for every component

- All required variants exist.
- Default, hover, focus, active, disabled, loading and error states are addressed where applicable.
- Keyboard behavior is documented and tested.
- Accessible name/description is verified.
- Light-theme contrast is measured.
- Touch target and 200% text zoom are tested.
- Mobile behavior is explicit.
- Empty, long-text, Vietnamese-diacritic and localization cases are tested.
- No hard-coded color, spacing, radius, shadow or z-index value remains.
- No nested card, oversized radius, glow, glass or unnecessary badge is introduced.

## 17. Taste Skill audit after system definition

This is a specification-level audit. Runtime behavior must be audited again after implementation.

| Audit area | Result | Evidence / remaining work |
|---|---|---|
| Brief inference | Pass | Medical B2B audience and trust-first scene are explicit |
| Dial selection | Pass | Variance 4, motion 2, density 6 are defined |
| Typography | Pass at spec level | Be Vietnam Pro only; 400/500/600/700; 13px floor for metadata; 16px main body/forms |
| Color semantics | Pass at spec level | OKLCH semantic tokens; one cobalt primary; state colors are not decorative |
| Contrast | Pass at token level | Core text, filled action, state and focus pairs meet stated ratios |
| Spacing rhythm | Pass | Fixed scale plus tight/standard/spacious semantic rhythm prevents random and uniform spacing |
| Shape consistency | Pass | 6/8/10/12px; pill limited to real status/filter/tag |
| Shadow restraint | Pass | Cards use none; shadow reserved for sticky/overlay layers |
| Component states | Pass at spec level | Required interaction and feedback states are specified |
| Forms | Pass at spec level | Visible labels, 44-48px controls, helper/error relationships and keyboard contracts defined |
| Data density | Pass | Tables/specifications use rows, grouping and dividers instead of universal cards |
| Navigation | Pass at spec level | Breadcrumb, dropdown, mega menu, sidebar, drawer and command search contracts defined |
| Product foundation | Pass at spec level | Product components prioritize model, specs, documents and quote policy over ecommerce noise |
| Motion | Pass | State feedback only; reduced motion is explicit |
| AI pattern audit | Pass by rule | No gradient text, glow, glass, repeated 3-card grammar, mass fade-up or oversized radius is authorized |
| Runtime accessibility | Pending implementation | Screen reader, keyboard, zoom, touch and browser testing require actual components |
| Font delivery | Pending implementation | Be Vietnam Pro font files and framework font pipeline do not yet exist |
| Dark theme | Out of Phase 1 | Light theme is normative; no incomplete dark palette is shipped |

### 17.1 Pre-flight result

- No Homepage or full page was designed.
- No unrelated framework or UI library was introduced.
- The design system uses one palette and one type family.
- Card, badge, icon and pill use is explicitly constrained.
- Public and product registers share primitives but retain separate composition patterns.
- Runtime audit remains mandatory after code exists; this document does not claim implementation compliance.

## 18. Phase boundary

Phase 1 ends with this normative design system. The next phase may implement tokens and components after the frontend stack is explicitly selected. It must not reinterpret the token roles or silently add new visual patterns.

