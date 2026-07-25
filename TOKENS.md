# Required tokens

This package ships **behaviour and token names**. Every value below must be
defined by the consumer, normally on `:root`. The package contains no colour
or font literals — enforced by `npm run lint:neutral`.

| Token | Your value |
|---|---|
| `--accent` | |
| `--amber-text` | |
| `--border` | |
| `--border-strong` | |
| `--control-bg` | |
| `--control-h` | |
| `--focus-ring` | |
| `--green-border` | |
| `--green-solid` | |
| `--green-text` | |
| `--hairline` | |
| `--on-accent` | |
| `--on-green` | |
| `--panel-2` | |
| `--pill` | |
| `--radius` | |
| `--radius-lg` | |
| `--radius-sm` | |
| `--red` | |
| `--red-border` | |
| `--red-text` | |
| `--scrim` | |
| `--shadow-pop` | |
| `--space-1` | |
| `--space-2` | |
| `--space-3` | |
| `--space-4` | |
| `--space-6` | |
| `--surface` | |
| `--text` | |
| `--text-faint` | |
| `--text-muted` | |

## The two "on-fill" tokens

`--on-accent` and `--on-green` are **separate on purpose** and are not
interchangeable:

| Token | Sits on | Must contrast against |
|---|---|---|
| `--on-accent` | `--accent` | your accent colour |
| `--on-green` | `--green-solid` | your solid green |

If your accent and your green are the same hue, point both at one value. If
they are different — say a blue accent and a dark green — **one value cannot
serve both**. Collapsing them regressed one consumer's date picker from
4.93:1 to 3.83:1, below AA, while fixing its confirm button.

Measure yours. Text needs 4.5:1; non-text marks (the checkbox tick, the
switch knob) need 3:1.

## Notes

- `--scrim` backs the modal `::backdrop`.
- The package sets `font-family: inherit` everywhere except a neutral
  monospace stack, so it adopts whatever type the host page uses.
