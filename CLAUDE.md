# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A small WordPress plugin ("Enhanced Save Functionality") that injects a **"Save As"** button into the Gutenberg block editor toolbar. Clicking it is meant to clone the current post/page into a new draft (title, content, meta, status, visibility, password, featured media) via the REST API and redirect to the new draft's edit screen.

## Commands

```bash
pnpm build      # one-off production build via @wordpress/scripts (wp-scripts build)
pnpm start      # watch mode for development (wp-scripts start)
```

There is no test, lint, or single-test command configured. Use `pnpm` (a `pnpm-lock.yaml` is committed).

## Architecture

Two halves, connected by the build step:

1. **`enhanced-save.php`** — the WordPress plugin entry point. On `enqueue_block_editor_assets` it loads the compiled bundle from `build/` and reads dependencies/version from the generated `*.asset.php` file. The bundle only runs inside the block editor.

2. **`src/save-as-button.js`** — the editor-side source (the only entry point). It:
   - Reads/writes editor state through `@wordpress/data` stores (`select`/`dispatch` on `core/editor` and `core`) rather than touching the DOM for data.
   - Creates the "Save As" `<button>` imperatively and injects it into the toolbar (`.editor-header__settings`) by polling via `wp.data.subscribe`, debounced with a `setTimeout`. The button is suppressed on brand-new posts (`isEditedPostNew()`).
   - `handleSaveAs()` assembles a payload from `getCurrentPost()` plus non-transient entity edits and `POST`s to `/wp/v2/posts`, then redirects to the new post's edit screen.

3. **Build pipeline** — `webpack.config.js` merges `@wordpress/scripts`' default config, overriding the entry to `src/save-as-button.js` and emitting `build/my-plugin-script.js`. `wp-scripts` also generates `build/my-plugin-script.asset.php` (the dependency/version manifest). **Always run `pnpm build` after editing `src/` — the PHP loads the compiled `build/` output, not `src/`.**

## Known issues / gotchas (this code is a work-in-progress prototype)

- **Asset filename mismatch:** `enhanced-save.php` includes `build/index.asset.php`, but `wp-scripts` (per `webpack.config.js`) actually emits `build/my-plugin-script.asset.php`. The include path needs to match the configured output filename.
- **`handleSaveAs()` is unfinished:** it has an early `return;` (line ~41) that short-circuits before the `apiFetch` call, so no save happens — it only `console.log`s. It also references an undefined `getEditedPostMeta`, and sets `featured_media` twice (once incorrectly to the slug). Treat this function as a draft to be fixed, not working behavior.
- **PHP `add_filter('editPostToolbar', ...)`** has no matching `apply_filters` anywhere, so it's currently a no-op; the button is injected entirely from JS.
- **`.gitignore` is the full WordPress core ignore list**, not a plugin/Node ignore list — so `node_modules/` and `build/` are *not* ignored. Be deliberate about what you stage.
