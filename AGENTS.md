# Repository Guidelines

## Project Structure & Module Organization
```
beefbeater/
|-- index.html            # Neon Surveyor entry point (full page canvas + HUD)
|-- assets/
|   |-- css/styles.css    # overlay + responsive styles, CSS custom properties
|   `-- js/main.js        # Three.js scene graph, camera rig, gameplay loop
|-- .github/workflows/    # GitHub Pages deployment workflow
`-- docs/                 # use for design notes, roadmap, security briefs
```
`main.js` bootstraps the world, orbital camera, city props, and collectibles with no bundler; keep additional modules ES-module friendly.

## Build, Test, and Development Commands
- `npx serve .` – preview the site locally before pushing.
- `npx html-validate index.html` – catch ARIA or semantic regressions when editing the HUD overlay.
- `npx stylelint "assets/css/**/*.css"` – enforce token usage and avoid accidental global overrides.
- `npx eslint assets/js/main.js` – optional once you add a config; helps keep modules tidy.

## Coding Style & Naming Conventions
Use 2-space indentation and single quotes inside scripts. CSS sticks to BEM-leaning names (`.overlay__header`, `.energy__fill`). Store palette, spacing, and typography tokens under `:root`. Scene helpers (camera rig, node spawning, car loops) live in discrete functions—prefer pure helpers over long animation blocks. Document new HUD data hooks with `data-*` attributes in the markup.

## Testing Guidelines
Smoke-test interactions: keyboard movement, boost, node collection, reset states, and responsive overlay (desktop vs mobile). For automated coverage, add Playwright specs under `tests/e2e/` to assert score increments after simulated collisions and to ensure energy drains when idle.

## Commit & Pull Request Guidelines
Follow Conventional Commits (e.g., `feat: add skyline particles`, `fix: stabilize camera orbit`). PRs should include a short summary, a GIF or video clip, and the commands executed (serve/lint/validate). Rebase feature branches on `main` before pushing to keep the Pages workflow simple.

## Deployment Workflow
`.github/workflows/pages.yml` builds the repository root and publishes to the `github-pages` environment on every push to `main` or manual dispatch. Keep the playable experience rooted at `/`; update the `path` input only if you reorganize the project tree.

## Three.js Gameplay Notes
The orbital camera emulates Little Workshop's Infinitown rig: a constant Y-rotation with pointer-driven easing. Extend it by adjusting `cameraState` but keep the focus target on the player mesh. Entities such as nodes and traffic live in arrays—add new mechanics by extending their `userData` instead of global flags. Keep energy/score logic centralized in `updateGameState` so HUD values stay in sync.
