# Required tokens

This package ships **behaviour and token names**. Every value below must be
defined by the consumer, normally on `:root`. The package contains no colour
or font literals — enforced by `npm run lint:neutral`.

Fill the right column with your own values. Two consumers deliberately fill
them differently; that is the point.

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

## Notes

- `--on-accent` is the text/mark colour placed **on top of** a filled
  `--accent` or `--green-solid` surface. It is usually dark, not white:
  white on a mid-green measures about 2.15:1 and fails WCAG AA. Check yours.
- `--scrim` backs the modal `::backdrop`.
- The package sets `font-family: inherit` everywhere except a neutral
  monospace stack, so it adopts whatever type the host page uses.
