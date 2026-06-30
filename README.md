# Save As Draft

Adds a **Save As** button to the WordPress block editor that clones the current post or page — including unsaved changes — into a new draft and opens it.

- **Author:** [Alimuzzaman Alim](https://profiles.wordpress.org/alimuzzamanalim/)
- **Requires:** WordPress 6.6+ · PHP 7.4+
- **License:** GPL-2.0-or-later

> For the end-user description, installation, and FAQ, see [`readme.txt`](readme.txt) (the WordPress.org-formatted readme). This file is the developer guide.

## What it does

One click copies the post you are editing into a brand-new **draft** and redirects you to it — the original is never touched. It copies title, content, excerpt, featured image, taxonomies, discussion settings, format, template, and REST-exposed post meta, and works for posts, pages, and public custom post types.

The action is exposed in three places:

- the editor header toolbar (next to the native *Save*),
- the post status sidebar,
- the editor **⋮ (Options)** menu (always available — the escape hatch when the other two are hidden).

A dialog lets you name the copy and toggle visibility preferences (persisted per-browser in `localStorage`).

## Development

```bash
pnpm install     # install dependencies
pnpm start       # development build, watch mode
pnpm build       # one-off production build
pnpm typecheck   # tsc --noEmit (strict type checking)
```

> **Always run `pnpm build` after editing `src/`** — the PHP loads the compiled `build/` output, not `src/`. `build/` is gitignored, so it must be produced wherever the plugin is packaged/deployed.

## Architecture

The editor source is written in TypeScript/TSX and split into focused modules:

```
src/
  index.tsx                  Entry point — registers the editor plugin.
  types.ts                   Shared types (RestPost, DraftPayload).
  preferences.ts             Typed localStorage preference helpers.
  api/draft.ts               REST copy logic: createDraftCopy, redirect, quickCopy.
  hooks/useToolbarSlot.ts    Injects a portal slot into the editor header toolbar.
  components/
    SaveAsModal.tsx          The dialog (title + preference checkboxes).
    SaveAsPlugin.tsx         Orchestration: buttons, menu, dialog, visibility state.
```

- **State** is read/written through `@wordpress/data` stores (`core/editor`, `core`); the DOM is touched only to mount the toolbar button.
- **`save-as-draft.php`** enqueues the compiled bundle on `enqueue_block_editor_assets`, reading dependencies/version from the generated `*.asset.php` manifest, and registers JS translations via `wp_set_script_translations()`.
- **Build:** [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) with zero config — it auto-detects the `src/index.tsx` entry and emits `build/index.js` (+ `build/index.asset.php`). `wp-scripts` strips TypeScript via Babel at build time; `pnpm typecheck` runs `tsc` separately. Run `pnpm plugin-zip` to produce a distributable zip (see `.distignore`).

## Internationalization

All user-facing strings use `__`/`sprintf` from `@wordpress/i18n` with the `save-as-draft` text domain, wired for translation via `wp_set_script_translations()`. The text domain matches the plugin slug, as required for WordPress.org language packs.

## License

[GPL-2.0-or-later](https://www.gnu.org/licenses/gpl-2.0.html)
