# Checkbox Autochecker (Obsidian Plugin)

Automatically sync parent and child checkboxes inside your Markdown files in Obsidian.

Supports hierarchical task lists with flexible propagation modes.

---

## Features

- Automatically checks or unchecks parent tasks based on child completion.
- Downward propagation: toggle parent -> sync children automatically.
- 3 sync modes:
  - **Loose:** only upward propagation (children -> parents).
  - **Partial Strict:** toggle parent -> only update unchecked children.
  - **Strict:** toggle parent -> overwrite all children.
- Works in real-time while typing.
- Fully supports nested checklists and multiple indentation levels.
- Fully compatible with native Obsidian Markdown files.

---

## Limitations

- Only works on standard Markdown files (`.md`).
- Does not modify embedded Canvas nodes.
  - Embedded Markdown files inside `.canvas` do work.

---

## Installation

### Obsidian Community Plugins (recommended)

- Search for **"Checkbox Autochecker"** inside Obsidian's Community Plugin browser.

### Manual Installation

1. Clone or download this repository.
2. Run `npm install && npm run build` to generate plugin files.
3. Copy the generated `manifest.json` and `main.js` files into your Obsidian plugins folder.

---

## License

MIT License — see [LICENSE](LICENSE.txt) for full terms.
