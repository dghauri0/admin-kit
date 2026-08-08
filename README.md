# admin-kit

Shared admin control kit for small operator dashboards.
Dropdown, checkbox, toggle, auto-grow textarea, modal, toast, date/time — so an
admin panel is not rebuilt from scratch each time.

Class prefix: `ak-`. No framework, no build step required by consumers.

## The contract

> **This package ships behaviour and token _names_. Each consumer supplies the
> token _values_.**

A dropdown knows how to manage focus, do type-ahead and mirror a hidden
`<select>`. It does not know what green is.

That single rule is what lets separate products share this without becoming
one product. One consumer stays Playfair/Jost; another stays a dark
green-accented system. Neither can drag its brand into the other, because brand
values never enter this package. Pinned versions mean each consumer upgrades on
its own schedule.

The rule is enforced mechanically, not by good intentions:

```bash
npm run lint:neutral   # fails on any colour or font literal in src/
```

It earns its keep. On the first run against the code this was extracted from, the check
immediately found six leaks — including
`.ak-dialog-btn--confirm { background: var(--accent); color: #fff }`, which is
white text on a filled accent. On a mid-green that measures ~2.15:1 and fails
WCAG AA, in the confirm button of every destructive dialog. Those now use
`--on-accent`.

See [TOKENS.md](./TOKENS.md) for the 31 tokens you must define.

## Consuming it

Two shapes, one source. Pick whichever matches your host.

**Static host** (Cloudflare Pages, plain HTML) — use the real files:

```html
<link rel="stylesheet" href="/admin/kit/admin-kit.css">
<script src="/admin/kit/admin-kit.js" defer></script>
<!-- paste dist/admin-kit.html once, before </body> -->
```

With Eleventy, copy them out of `node_modules` at build time:

```js
eleventyConfig.addPassthroughCopy({
  "node_modules/admin-kit/dist": "admin/kit",
});
```

**Server-injected host** (Cloudflare Workers) — use the string exports:

```js
import { ADMIN_KIT_CSS, ADMIN_KIT_HTML, ADMIN_KIT_JS } from "admin-kit";
```

`dist/strings.js` is generated from `src/`, so the source files are ordinary
CSS and JS. They are **not** subject to the "no backticks / `${}` inside"
constraint the hand-maintained Worker copy had to live under.

## API

```js
AdminKit.confirm({ title, message, confirmText, cancelText, danger }) // → Promise<boolean>
AdminKit.alert({ title, message, confirmText })                      // → Promise<void>
AdminKit.prompt({ title, message, defaultValue, placeholder })       // → Promise<string|null>
AdminKit.toast(message, kind)        // kind: "" | "ok" | "err"
AdminKit.enhance(root)               // upgrade controls under root
AdminKit.refresh(root)               // re-sync labels after a programmatic .value set
```

| Control | Markup |
|---|---|
| Dropdown | `<label for="kind">Kind</label><select id="kind" data-ak-select>` + `AdminKit.enhance(root)` |
| Checkbox | `<label class="ak-check"><input type=checkbox><span class="ak-check-box"></span><span class="ak-check-text">…</span></label>` |
| Toggle | add `ak-switch` to an `ak-check` |
| Auto-grow textarea | `<textarea class="ak-autogrow">` |
| Date/time | `<input class="ak-datetime" type="datetime-local">` |

Enhancement is progressive: use `data-ak-select` and the native control stays
visible until JavaScript has built the complete custom control. The real
`<select>` remains in the DOM as the form-value source, so code reading
`.value` or listening for `change` keeps working. The legacy
`class="ak-select-src"` opt-in remains supported, but new consumers should use
the data attribute for a resilient no-script fallback.

Only ordinary single selects are enhanced. A `multiple` select or a select
with `size > 1` remains native; silently turning either into a single-choice
popup would change its form semantics. Use an explicit `for`/`id` label (or
an ARIA label); an implicit label is left native so enhancement never nests a
generated button inside a label. Long lists gain an in-panel search by
default above 12 options. Use `data-ak-search="on"` to force it or
`data-ak-search="off"` to disable it.

The generated select-only combobox preserves the native source as the value
store, transfers the explicit label and description relationship, mirrors
required/disabled/invalid state, skips disabled options, and supports Arrow
keys, Home/End, Enter/Space, Escape, Tab, and buffered type-ahead. Call
`AdminKit.enhance(container)` after any dynamic `innerHTML` render, and
`AdminKit.refresh(root)` after setting `.value` or `.disabled`
programmatically.

The date/time enhancer currently renders five-minute choices. Consumers that
require a different `step`, strict `min`/`max` behavior, or a native mobile
picker should keep `datetime-local` native until that contract is expanded.

## Why not an off-the-shelf library

[Web Awesome](https://webawesome.com/) (Shoelace's successor) is the strongest
alternative: MIT, framework-agnostic web components, CDN, covers this surface.
It was considered and deferred, because for these consumers:

- 13.4 MB package plus a Lit runtime, against ~500 lines here for the same
  seven controls
- shadow-DOM theming works through CSS parts, which fights the plain-CSS
  custom-property system both consumers already use
- it will not encode the house rule that motivated this kit: **never open an OS
  picker or dialog**, because they break the visual language and yank mobile
  users out of the page

Revisit for genuinely expensive components — virtualised data grid, date-range,
async combobox. Web Awesome is per-component, so that is not an all-or-nothing
switch: keep this kit for primitives and pull in one component where it pays.

React-only options (Radix, Headless UI, Base UI) and full admin frameworks
(React Admin, Refine, AdminJS) are out — both consumers are vanilla JS.

## Development

```bash
npm run build          # regenerate dist/ from src/
npm run lint:neutral   # brand-neutrality guard
npm test               # unit tests + guard
```

Edit `src/`. Never edit `dist/` — it is generated.
