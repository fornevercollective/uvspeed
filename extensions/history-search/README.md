# History — Universal Timeline Search (Browser Extension)

## Browser Support

| Browser | Support | Install Method |
|---------|---------|---------------|
| **Chrome** | Full | Load unpacked → `extensions/history-search` |
| **Edge** | Full | Same as Chrome (Chromium-based) |
| **Brave** | Full | Same as Chrome (Chromium-based) |
| **Opera** | Full | Same as Chrome (Chromium-based) |
| **Arc** | Full | Same as Chrome (Chromium-based) |
| **Vivaldi** | Full | Same as Chrome (Chromium-based) |
| **Firefox** | Full | `about:debugging` → Load Temporary Add-on → `manifest.json` |
| **Safari** | Requires wrapper | Use Xcode's "Convert Web Extension" to wrap this extension |

## Search Engines Supported

Google, Bing, DuckDuckGo, Brave Search, Ecosia, Yahoo

## What It Does

Injects a panel above search results with:
- **14 connectors**: Wikipedia, Open Library, Wayback Machine, Sacred Texts, Yale Archives, ARDA, arXiv, PubChem, GenBank, LGBTQ Archives, Meta Research, HathiTrust, Internet Archive
- **Mini timeline strip**: 61 orders of magnitude (Planck time → Observable Universe)
- **Progressive loading**: Results appear as each connector responds
- **Connector toggles**: Enable/disable any source, saved to browser storage

## Mobile Alternative

Mobile browsers don't support content script extensions.
Use the PWA instead: **[search.html](https://fornevercollective.github.io/uvspeed/web/search.html)**

Or use the `search` command in HexTerm:
```
search shakespeare
q quantum computing
```

## Install (Developer Mode)

1. `chrome://extensions` → Enable Developer Mode
2. "Load unpacked" → select this folder
3. Go to Google/Bing/DuckDuckGo and search anything

## Files

- `manifest.json` — Manifest v3 (Chrome/Edge/Brave/Opera/Firefox)
- `content.js` — Content script injected into search pages
- `styles.css` — Dark galactic theme
- `background.js` — Service worker for settings
- `popup.html` — Extension popup with connector toggles
- `icons/` — Extension icons (open `generate-icons.html` to make custom ones)
