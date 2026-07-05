# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

A WordPress plugin (**"Clone Post with Unsaved Changes to a Draft"**, slug/text-domain `clone-post-unsaved-changes`) that adds a **"Save As"** button to the Gutenberg block editor. Clicking it clones the current post/page — including unsaved edits — into a new **draft** (title, content, excerpt, meta, taxonomies, discussion settings, format, template, featured media) via the REST API, then redirects to the new draft's edit screen. The action is exposed in the header toolbar, the post sidebar, and the editor's ⋮ (Options) menu.

## Commands

```bash
pnpm build      # one-off production build via @wordpress/scripts
pnpm start      # watch mode for development
pnpm typecheck  # tsc --noEmit (strict type checking)
pnpm lint:js    # eslint via wp-scripts
pnpm format     # prettier via wp-scripts
pnpm plugin-zip # build a distributable plugin zip (honors .distignore)
```

A `pnpm-lock.yaml` is committed; use `pnpm`.

## Architecture

Two halves, connected by the build step:

1. **`clone-post-unsaved-changes.php`** — the plugin entry point. On `enqueue_block_editor_assets` it loads `build/index.js`, reading dependencies/version from the generated `build/index.asset.php` manifest, and registers JS translations via `wp_set_script_translations()`. Has an `ABSPATH` guard and bails if the build output is missing.

2. **`src/`** — the editor source, written in TypeScript/TSX and split into modules:
   - `index.tsx` — entry; `registerPlugin('clone-post-unsaved-changes', …)`.
   - `types.ts` — shared types.
   - `preferences.ts` — typed `localStorage` preference helpers (`clonePostUnsavedChanges*` keys).
   - `api/draft.ts` — REST copy logic (`createDraftCopy`, `redirectToEditor`, `quickCopy`); derives the REST route from the post type, retries without meta on rejection.
   - `hooks/useToolbarSlot.ts` — injects a portal container into `.editor-header__settings`; suppressed on brand-new posts.
   - `components/SaveAsModal.tsx` — the dialog (title + "don't ask" + hide-button preferences).
   - `components/SaveAsPlugin.tsx` — orchestration: the three buttons, dialog, and visibility state. State is read via `@wordpress/data` (`core/editor`, `core`); the DOM is touched only to mount the toolbar button.

3. **Build pipeline** — `@wordpress/scripts` with **no custom webpack config**: it auto-detects the `src/index.tsx` entry and emits `build/index.js` + `build/index.asset.php`. **Always run `pnpm build` after editing `src/` — the PHP loads the compiled `build/` output, not `src/`.** TypeScript is stripped by Babel at build time; type errors do *not* fail the build, so run `pnpm typecheck` separately.

## Conventions / gotchas

- **Text domain must equal the slug** (`clone-post-unsaved-changes`) for WordPress.org language packs. All JS strings use `__`/`sprintf` from `@wordpress/i18n`.
- **`build/` and `node_modules/` are gitignored** — `build/` must be produced wherever the plugin is packaged/deployed.
- **WordPress's generated types for `PluginPostStatusInfo` / `PluginMoreMenuItem` are incomplete** (children typed as DOM `Element`, or omitted), so `SaveAsPlugin.tsx` re-types them locally with a documented cast.
- The ⋮ menu item always renders (even when both buttons are hidden) as the escape hatch back to the dialog and its visibility settings.
