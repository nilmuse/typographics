# typographics

CSS typography styles that scale body text and headings between viewport widths, with spacing based on each element's line-height.

[![npm](https://img.shields.io/npm/v/typographics.svg?colorB=brightgreen)](https://www.npmjs.com/package/typographics)
[![NPM Downloads](https://img.shields.io/npm/dm/typographics.svg?style=flat)](https://www.npmjs.com/package/typographics)

[Demo](https://codepen.io/ux-ui/pen/BavYXRz)

## Installation

```bash
npm install typographics
```

## Quick start

In an app with a bundler that handles CSS imports, import the stylesheet in the entry file:

```js
import 'typographics';
```

Use native headings and paragraphs, or choose a utility class when the visual style should differ from the element's default:

```html
<article class="article">
  <h1 class="headline-medium">A heading that scales with the viewport</h1>
  <p>Body text uses the fluid body scale.</p>
  <ul class="list-medium">
    <li>List spacing follows the text's line-height.</li>
    <li>Inline <code>code</code> has its own text and background styles.</li>
  </ul>
</article>
```

The built-in defaults scale text as the viewport changes. To customize sizes or breakpoints, see [Styling](#styling).

To load the stylesheet through Sass instead of a JavaScript import:

```scss
@use "typographics/dist/index.css" as *;
```

## Classes

The stylesheet applies typography to native headings, paragraphs, inline code, and code blocks. It also includes these utility classes:

| Classes | Use |
| --- | --- |
| `.display-*`, `.headline-*`, `.title-*` | Heading styles in `large`, `medium`, and `small` sizes. |
| `.body-*` | Body text in `large`, `medium`, and `small` sizes. |
| `.label-*` | Semibold label text in `large`, `medium`, and `small` sizes. |
| `ul.list-*`, `ol.list-*` | Lists in `large`, `medium`, and `small` sizes. |
| `.table-text`, `.table-text-*` | Opt-in table text; see [Table text](#table-text). |

## Styling

Set the fluid-range breakpoints and base font-size endpoints on `:root`. Their derived values are calculated there, so changing only those inputs on a child container does not recalculate its inherited fluid sizes.

For global or local size adjustments, use the [scale multipliers](#global-and-local-scaling): `--t-body-scale` affects body text and code blocks; `--t-heading-scale` affects headings. You can also set [individual heading endpoints](#heading-endpoints).

### Fluid range (breakpoints)

| Variable                   | Default | Description                               |
| :------------------------- | :-----: | :---------------------------------------- |
| `--t-font-scale-min-width` |  `600`  | Viewport width (px) where scaling starts. |
| `--t-font-scale-max-width` | `1440`  | Viewport width (px) where scaling stops.  |

Body and heading sizes interpolate between these widths and stop at their minimum and maximum sizes. Viewport calculations use `100vw`, switching to `100lvw` in browsers that support it.

### Typography defaults

| Variable | Default | Description |
| --- | --- | --- |
| `--t-base-font-family` | System font stack below | Font family for body text. |
| `--t-line-height-body` | `1.5` | Body line-height, without units. |
| `--t-line-height-heading` | `1.3` | Heading line-height, without units. |

Default body font stack:

```css
:root {
  --t-base-font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

### Base fluid sizes (body/headings)

These variables define the endpoints of the fluid range for body text and headings. They are expressed as scales of `1rem`.

| Variable                          | Default | Description                                     |
| :-------------------------------- | :-----: | :---------------------------------------------- |
| `--t-body-font-size-min-scale`    | `0.875` | Minimum body font-size scale (at min width).    |
| `--t-body-font-size-max-scale`    | `1.125` | Maximum body font-size scale (at max width).    |
| `--t-heading-font-size-min-scale` |   `1`   | Minimum heading font-size scale (at min width). |
| `--t-heading-font-size-max-scale` | `1.25`  | Maximum heading font-size scale (at max width). |

### Global and local scaling

Use these multipliers to change text size without changing the fluid endpoints or copying internal `calc()` formulas.

| Variable               | Default | Description                                               |
| :--------------------- | :-----: | :-------------------------------------------------------- |
| `--t-body-scale`       |   `1`   | Multiplier for body, paragraph, list, code-block, and opted-in table text. |
| `--t-heading-scale`    |   `1`   | Multiplier for heading font-size rules.                    |
| `--t-code-block-scale` |   `1`   | Code-block size relative to the fluid body size.           |

Global scale:

```css
:root {
  --t-body-scale: 0.9;
  --t-heading-scale: 0.9;
}
```

Local scale:

```css
.article {
  --t-body-scale: 0.95;
}

.hero {
  --t-heading-scale: 0.9;
}
```

### Heading endpoints

By default, heading styles (`.display-*`, `.headline-*`, `.title-*`) multiply the fluid heading size by a style coefficient, such as `--t-headline-medium`.

To give one style specific sizes at the start and end of the fluid range, set its endpoints:

- `--t-<key>-min`: font-size at `--t-font-scale-min-width`
- `--t-<key>-max`: font-size at `--t-font-scale-max-width`

Example for `.headline-medium`:

```css
.headline-medium {
  --t-headline-medium-min: 28px;
  --t-headline-medium-max: 34px;
}
```

An explicit endpoint replaces its calculated value and bypasses `--t-heading-scale`. To include the multiplier, apply it in the endpoint value:

```css
.headline-medium {
  --t-headline-medium-min: calc(28px * var(--t-heading-scale, 1));
  --t-headline-medium-max: calc(34px * var(--t-heading-scale, 1));
}
```

Available keys:

- `display-large`, `display-medium`, `display-small`
- `headline-large`, `headline-medium`, `headline-small`
- `title-large`, `title-medium`, `title-small`

### Spacing

The `lh` unit resolves against the styled element's computed line-height. Heading spacing has two optional custom properties:

| Variable                   | Default  | Description                                                     |
| :------------------------- | :------: | :-------------------------------------------------------------- |
| `--t-heading-space-before` | `1.25lh` | Start margin when a heading does not directly follow a heading. |
| `--t-heading-space-after`  | `0.5lh`  | End margin, trimmed when the heading is its parent's last child. |

Set either property on `:root`, a container, or an individual heading. Container values are inherited:

```css
.article {
  --t-heading-space-before: 1lh;
  --t-heading-space-after: 0.35lh;
}
```

When a heading directly follows another heading, or a paragraph directly follows a heading, the following element's start margin is zero. The preceding heading's end margin controls the space between them:

```html
<article class="article">
  <h2>Section</h2>
  <h3>Subsection</h3>
  <p>Article text.</p>
</article>
```

These rules cover `h1`–`h6`, the existing `large`, `medium`, and `small` variants of `.display-*`, `.headline-*`, and `.title-*`, and paragraphs represented by `p`, `.body-large`, `.body-medium`, or `.body-small`. They apply only to direct siblings in the same parent; they do not cross wrappers. Other paragraph margins keep their existing behavior.

For headings, paragraphs, and `.label-*` / `.body-*` utilities, the end margin is zero when the element is its parent's last child, including an only child. It keeps its margin if a different element follows.

Use ordinary CSS outside layers, or in the later `components` / `utilities` layers, to override margins or last-child trimming. To adjust a pair while keeping one margin responsible for its spacing, change the preceding heading's end margin and leave the following start margin at zero. In column flex or single-column grid layouts, the container's `gap` adds to that margin.

### Lists

The `ul.list-*` and `ol.list-*` utilities set list padding and item spacing:

- `padding-inline-start: 2.5rem` by default
- `li { margin-block: 0.25lh; }`

A custom property is available if you need to control container padding directly:

| Variable                | Default  | Description                                       |
| :---------------------- | :------: | :------------------------------------------------ |
| `--t-list-padding-left` | `2.5rem` | Base padding if you build your own list wrappers. |

### Table text

Add `table-text` to a native table to opt in to fluid text sizing. The font size uses the body formula and the `--t-body-scale` resolved on the table, including values inherited from a container.

```html
<table class="table-text">
  <caption>Package formats</caption>
  <thead>
    <tr><th scope="col">Package</th><th scope="col">Format</th></tr>
  </thead>
  <tbody>
    <tr><td>typographics</td><td>CSS only</td></tr>
  </tbody>
</table>
```

For a ready-made size, choose one of these standalone classes. Each uses the same font size and line-height as its corresponding `.body-*` style, including fluid sizing and local body scaling:

| Class                 | Text metrics match | Line-height |
| :-------------------- | :----------------- | :---------: |
| `table-text-large`    | `.body-large`      | `1.5`       |
| `table-text-medium`   | `.body-medium`     | `1.45`      |
| `table-text-small`    | `.body-small`      | `1.35`      |

```html
<table class="table-text-large">
  <tr><td>Text matching body-large.</td></tr>
</table>

<table class="table-text-small">
  <tr><td>Text matching body-small.</td></tr>
</table>
```

Each preset works on its own; adding `table-text` is optional. The base `table-text` keeps the fluid body size and uses `--t-line-height-body` or `1.5` for its line-height. Presets use the line-heights listed above.

| Variable                | Default                                 | Description                                      |
| :---------------------- | :-------------------------------------- | :----------------------------------------------- |
| `--t-table-font-size`    | Fluid body size or selected preset size | Explicit font-size override; bypasses body scaling. |
| `--t-table-line-height`  | Base or selected preset line-height     | Line-height for table text.                       |

These properties take precedence over the base and preset defaults. Set them on `:root`, a container, or the table itself. For example, use a table inside `.article` for local scaling, or add `compact-report` to the table's classes for an explicit size:

```css
.article {
  --t-body-scale: 0.95;
}

.compact-report {
  --t-table-font-size: 0.875rem;
  --t-table-line-height: 1.4;
}
```

Font family and color follow normal inheritance. Native `th` emphasis and alignment are preserved. Paragraphs that are direct children of the table's caption or cells inherit their parent's font size, line-height, and weight. Explicit `.body-*` and `.label-*` styles keep their own text settings; paragraphs inside other wrappers or nested unmarked tables keep their existing paragraph styles.

The table text classes add only text properties. The application controls margins, cell padding, borders, backgrounds, widths, column layout, alignment, wrapping, and scrolling. Existing global typography rules still apply, including paragraph margins. Changing text metrics can change wrapping and row heights. Use ordinary CSS outside layers, or the later `components` / `utilities` layers, for direct overrides.

### Inline code

These properties customize inline code fragments (`code:not(pre code)`):

| Variable                        | Default | Description                                |
| :------------------------------ | :------ | :----------------------------------------- |
| `--t-monospace-font-family`     | Monospace stack below | Font family for inline code and code blocks. |
| `--t-code-inline-font-size`     |                                     `1em`                                     | Font-size relative to surrounding text.    |
| `--t-code-inline-line-height`   |                                      `1`                                      | Line-height for inline code.               |
| `--t-code-inline-bg`            |                               `rgb(0 0 0 / 5%)`                               | Background color.                          |
| `--t-code-inline-color`         |                                   `#24292f`                                   | Text color.                                |
| `--t-code-inline-border-radius` |                                    `0.3em`                                    | Corner radius.                             |
| `--t-code-inline-padding`       |                                `0.25em 0.4em`                                 | Internal padding.                          |
| `--t-code-inline-margin`        |                                  `0 0.25em`                                   | External margin.                           |
| `--t-code-inline-border-color`  |                              `rgb(0 0 0 / 10%)`                               | Outline color used by the subtle 1px ring. |

Default monospace stack:

```css
:root {
  --t-monospace-font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
}
```

### Code blocks

Code blocks follow the fluid body size by default. Setting `--t-code-block-font-size` replaces that calculation with an explicit size and bypasses `--t-body-scale`.

These properties customize `pre` elements and their nested `code`:

| Variable                       |       Default       | Description                               |
| :----------------------------- | :-----------------: | :---------------------------------------- |
| `--t-code-block-scale`         |         `1`         | Multiplier for the fluid body size.       |
| `--t-code-block-font-size`     | Fluid body font-size | Explicit font-size override.              |
| `--t-code-block-line-height`   |        `1.6`        | Line-height for code blocks.              |
| `--t-code-block-bg`            |      `#F5F5F5`      | Background color.                         |
| `--t-code-block-color`         |      `#24292f`      | Text color.                               |
| `--t-code-block-padding`       |    `1.2rem 2rem`    | Internal padding.                         |
| `--t-code-block-margin`        |      `1.3em 0`      | External margin (vertical rhythm).        |
| `--t-code-block-border-radius` |      `0.6rem`       | Corner radius.                            |

## License

MIT
