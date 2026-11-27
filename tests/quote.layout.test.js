import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';

const css = readFileSync(new URL('../dist/index.css', import.meta.url), 'utf8');
let browser;
let page;

before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  page = await browser.newPage();
});

after(async () => {
  await browser?.close();
});

async function render(markup, { width = 1024, extraCss = '' } = {}) {
  await page.setViewportSize({ width, height: 900 });
  await page.setContent(`<!doctype html><html><head><style>${css}</style><style>
    body { margin:0; }
    .fixture { display:flow-root; }
    ${extraCss}
    </style></head><body>${markup}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-probe]')].map(element => {
    const style = getComputedStyle(element);
    const { top, bottom, left, right } = element.getBoundingClientRect();
    return [element.dataset.probe, {
      top, bottom, left, right,
      fontSize: parseFloat(style.fontSize),
      lineHeight: parseFloat(style.lineHeight),
      start: parseFloat(style.marginBlockStart),
      end: parseFloat(style.marginBlockEnd),
      inlineStart: parseFloat(style.marginInlineStart),
      inlineEnd: parseFloat(style.marginInlineEnd),
      fontStyle: style.fontStyle,
      fontWeight: style.fontWeight,
      color: style.color,
    }];
  })));
}

function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= 0.08,
    `${message}: expected ${expected}px, received ${actual}px`);
}

test('all three quote structures have one outer margin and captions add only their own gap', async () => {
  for (const layout of ['flow-root', 'flex', 'grid']) {
    const styles = await render(['with-caption', 'without-caption', 'standalone'].map(id => {
      const quote = `<blockquote data-probe="${id}-quote"><p class="body-large" data-probe="${id}-text">Quoted text.</p></blockquote>`;
      const content = id === 'standalone' ? quote : `<figure data-probe="${id}-figure">${quote}
        ${id === 'with-caption' ? '<figcaption data-probe="caption">— Author</figcaption>' : ''}</figure>`;
      return `<section class="fixture" data-probe="${id}-parent">${content}<span>Tail</span></section>`;
    }).join(''), {
      extraCss: `.fixture { display:${layout}; flex-direction:column; grid-template-columns:minmax(0,1fr); }`,
    });
    const standalone = styles['standalone-quote'];
    for (const id of ['with-caption', 'without-caption', 'standalone']) {
      const quote = styles[`${id}-quote`];
      const outer = styles[`${id}-${id === 'standalone' ? 'quote' : 'figure'}`];
      const text = styles[`${id}-text`];
      near(outer.start, standalone.lineHeight * 0.75, `${layout} ${id}: outer start margin`);
      near(outer.end, standalone.lineHeight * 0.75, `${layout} ${id}: outer end margin`);
      near(outer.left - styles[`${id}-parent`].left, standalone.lineHeight, `${layout} ${id}: one inline indent`);
      near(outer.inlineEnd, standalone.lineHeight, `${id}: end indent`);
      near(text.start, 0, `${id}: first paragraph start margin`);
      near(text.end, 0, `${id}: last paragraph end margin`);
      near(text.top, outer.top, `${id}: no inner leading gap`);
      assert.equal(text.fontStyle, 'normal', 'quote does not force italics');
      if (id !== 'standalone') {
        for (const property of ['start', 'end', 'inlineStart', 'inlineEnd']) near(quote[property], 0, `${id}: inner ${property}`);
      }
    }
    near(styles.caption.top - styles['with-caption-quote'].bottom,
      styles.caption.lineHeight * 0.5, `${layout}: caption gap`);
    near(styles['without-caption-figure'].bottom, styles['without-caption-text'].bottom, 'no caption leaves no trailing gap');
  }
});

test('captions inherit fluid figure metrics and local body scaling, with smaller text chosen explicitly', async () => {
  const utilities = ['body-large', 'body-medium', 'body-small', 'label-medium'];
  for (const width of [320, 600, 1024, 1440]) {
    const styles = await render([0.8, 1.2].map((scale, index) => `<article style="--t-body-scale:${scale}">
      ${utilities.map(name => `<p class="${name}" data-probe="${index}-reference-${name}">Reference</p>`).join('')}
      <figure class="fixture" data-probe="${index}-figure"><blockquote>
        ${utilities.map(name => `<p class="${name}" data-probe="${index}-quote-${name}">Quote</p>`).join('')}
      </blockquote><figcaption data-probe="${index}-caption"><p data-probe="${index}-caption-p">Author</p>
        ${utilities.map(name => `<p class="${name}" data-probe="${index}-caption-${name}">Author</p>`).join('')}
      </figcaption></figure>
      <figure class="fixture"><blockquote><p>Quote.</p></blockquote>
        <figcaption class="body-small" data-probe="${index}-small-caption">
          <p data-probe="${index}-small-caption-p">Author</p>
        </figcaption></figure></article>`).join(''), {
      width, extraCss: ':root { --t-line-height-body:1.7; }',
    });
    for (const index of [0, 1]) {
      for (const property of ['fontSize', 'lineHeight']) {
        near(styles[`${index}-caption`][property], styles[`${index}-figure`][property], `${width}px: inherited caption ${property}`);
        near(styles[`${index}-caption-p`][property], styles[`${index}-caption`][property], `${width}px: caption paragraph ${property}`);
        near(styles[`${index}-small-caption`][property], styles[`${index}-reference-body-small`][property], `${width}px: explicit small caption ${property}`);
        near(styles[`${index}-small-caption-p`][property], styles[`${index}-small-caption`][property], `${width}px: small caption paragraph ${property}`);
      }
      for (const name of utilities) {
        for (const context of ['quote', 'caption']) {
          const actual = styles[`${index}-${context}-${name}`];
          const reference = styles[`${index}-reference-${name}`];
          near(actual.fontSize, reference.fontSize, `${context} ${name}: utility size`);
          near(actual.lineHeight, reference.lineHeight, `${context} ${name}: utility line height`);
          assert.equal(actual.fontWeight, reference.fontWeight, `${context}: utility weight`);
        }
      }
    }
  }
});

test('multiple paragraphs, headings, lists and nested quotes keep internal spacing and trim only their edges', async () => {
  const styles = await render(`<section class="fixture"><blockquote data-probe="outer">
    <h3 data-probe="heading">Heading</h3><p data-probe="first">First paragraph.</p>
    <p data-probe="second">Second paragraph.</p><blockquote data-probe="nested"><p>Nested quote.</p></blockquote>
    <ul class="list-large" data-probe="last-list"><li>Last item</li></ul>
    </blockquote>
    <blockquote><ul class="list-large" data-probe="first-list"><li>First item</li></ul><p>Tail</p></blockquote>
    <blockquote data-probe="sole-quote"><p data-probe="sole-p">Sole quote.</p></blockquote></section>`);
  near(styles.heading.start, 0, 'first heading has no leading margin');
  near(styles.heading.end, styles.heading.lineHeight * 0.5, 'heading keeps outgoing spacing');
  near(styles.first.end, styles.first.lineHeight * 0.75, 'first paragraph keeps internal spacing');
  near(styles.second.end, styles.second.lineHeight * 0.75, 'second paragraph keeps internal spacing');
  near(styles.nested.inlineStart, styles.nested.lineHeight, 'nested quote keeps its indentation');
  near(styles['last-list'].end, 0, 'last list has no trailing margin');
  near(styles['first-list'].start, 0, 'first list has no leading margin');
  near(styles['sole-quote'].end, 0, 'last quote trims its external end margin');
  near(styles['sole-p'].start, 0, 'sole paragraph has no leading margin');
  near(styles['sole-p'].end, 0, 'sole paragraph has no trailing margin');
});

test('quote tokens inherit locally, use element line heights, and support captions before quotes and RTL', async () => {
  const styles = await render(`<section class="fixture" dir="rtl" style="--t-body-scale:1.2;
    --t-quote-space-before:2lh;--t-quote-space-after:1lh;--t-quote-indent:12px;
    --t-quote-caption-space:0.75lh;--t-quote-caption-font-size:20px;--t-quote-caption-line-height:2">
    <figure data-probe="figure"><figcaption data-probe="caption"><p data-probe="caption-p">Author</p></figcaption>
      <blockquote data-probe="quote"><p>Quoted text.</p></blockquote></figure>
    <blockquote data-probe="overridden" style="--t-quote-indent:7px">Another quote.</blockquote>
    <span>Tail</span></section>`);
  near(styles.figure.start, styles.figure.lineHeight * 2, 'inherited start spacing uses figure line-height');
  near(styles.figure.end, styles.figure.lineHeight, 'inherited end spacing');
  near(styles.figure.inlineStart, 12, 'RTL inline start indent');
  near(styles.figure.inlineEnd, 12, 'RTL inline end indent');
  near(styles.overridden.inlineStart, 7, 'element token overrides ancestor');
  near(styles.caption.fontSize, 20, 'explicit caption size bypasses body scaling');
  near(styles.caption.lineHeight, 40, 'caption line-height override');
  near(styles['caption-p'].fontSize, 20, 'caption paragraph inherits override');
  near(styles.quote.top - styles.caption.bottom, 30, 'leading caption gap uses caption line-height');
});

test('ordinary figures keep application styles and later CSS can override quote typography and edge trimming', async () => {
  const ordinary = `<figure data-probe="ordinary"><img alt=""><figcaption data-probe="ordinary-caption">Image caption.</figcaption></figure>`;
  const native = await render(ordinary, {
    extraCss: '@layer reset { figure { margin:17px 23px; } figcaption { font-size:21px; line-height:2; margin:9px; } }',
  });
  near(native.ordinary.start, 17, 'ordinary figure start margin');
  near(native.ordinary.inlineStart, 23, 'ordinary figure inline margin');
  near(native['ordinary-caption'].fontSize, 21, 'ordinary caption size');
  near(native['ordinary-caption'].start, 9, 'ordinary caption margin');
  const inherited = await render(`<figure class="fixture" style="font-size:24px;line-height:2;font-weight:500">
    <blockquote><p>Quote.</p></blockquote><figcaption data-probe="caption">
      <p data-probe="caption-p">Author</p></figcaption></figure>`);
  for (const id of ['caption', 'caption-p']) {
    near(inherited[id].fontSize, 24, `${id}: inherits the application's figure size`);
    near(inherited[id].lineHeight, 48, `${id}: inherits the application's figure line-height`);
    assert.equal(inherited[id].fontWeight, '500', `${id}: inherits figure weight`);
  }
  for (const layer of ['components', 'utilities', null]) {
    const rules = `figure { margin:13px; } blockquote { margin:11px; }
      figcaption { font-size:24px; line-height:2; margin-block-start:8px; }
      p { margin-block:7px; }`;
    const styles = await render(`<figure class="fixture" data-probe="figure"><blockquote data-probe="quote">
      <p data-probe="text">Quote.</p></blockquote><figcaption data-probe="caption">Author</figcaption></figure>`, {
      extraCss: layer ? `@layer ${layer} { ${rules} }` : rules,
    });
    near(styles.figure.end, 13, `${layer}: last figure margin override`);
    near(styles.quote.inlineStart, 11, `${layer}: nested quote margin override`);
    near(styles.caption.fontSize, 24, `${layer}: caption size override`);
    near(styles.caption.start, 8, `${layer}: caption gap override`);
    near(styles.text.start, 7, `${layer}: first child trim override`);
    near(styles.text.end, 7, `${layer}: last child trim override`);
  }
});
