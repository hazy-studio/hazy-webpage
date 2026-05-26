# HAZY — Waitlist Page

Static webpage for the HAZY iOS app. Hosted on GitHub Pages.

## How it works

**Animated title** — `script.js` renders "HAZY" on a `<canvas>` using 2D wave noise: three sine waves summed through `Math.tanh()` produce a liquid-glass texture. Rendered at 1/3 resolution and upscaled, then clipped to the text letterforms via `destination-in` compositing. Canvas size is multiplied by `devicePixelRatio` for sharp hi-DPI/mobile rendering. The title width spans the full content area — it reads `.content`'s computed `paddingLeft` at runtime so it stays in sync with the CSS border automatically.

**Layout** — All content is left-aligned to a universal page border (`padding: 0 1.75rem` on `.content`). The waitlist label and form are re-centered independently.

**Waitlist form** — Email is validated with a strict regex (rejects single-label domains like `name@g`). Invalid input triggers the browser's native popup via `setCustomValidity` + `reportValidity`, cleared on the next keystroke. Valid submissions immediately show a success message, then fire-and-forget POST to Google Apps Script with metadata: timestamp, IP, country, browser, device, OS, UTM source.

**Google Apps Script** — Lives in a separate project (not in this repo). Appends a row to a Google Sheet on each POST. Set the deployment URL in `script.js`:

```js
// script.js — "Waitlist form" section
const SCRIPT_URL = 'YOUR_DEPLOYMENT_URL';
```

To deploy: Apps Script → Deploy → New deployment → Web app → Execute as: Me, Access: Anyone → copy URL.

## Configuration

| Location | Variable | Purpose |
|---|---|---|
| `script.js` | `WEIGHT` | Canvas font weight (100–900) |
| `script.js` | `LETTER_SPACING` | Canvas letter spacing (e.g. `'-1px'`) |
| `style.css` | `--weight` | Font weight for all HTML text |
| `style.css` | `--tracking` | Letter spacing for all HTML text |
| `style.css` | `--form-size` | Font size for label, input, and success message |
| `style.css` | `--color-accent` | Accent color (arrow button, "social context.") |
| `style.css` | `.content` padding | Universal page border — also controls HAZY title width |

## Files

- `index.html` — markup shell
- `style.css` — all styles and design tokens
- `script.js` — canvas animation + form logic

