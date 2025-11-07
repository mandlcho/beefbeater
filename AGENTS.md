# Repository Guidelines

## Project Structure & Module Organization
```
beefbeater/
|-- index.html            # Neon Surveyor entry (full page canvas + HUD overlay)
|-- assets/
|   |-- css/styles.css    # overlay + responsive styles, CSS custom properties
|   `-- js/main.js        # Three.js scene graph, camera rig, gameplay loop
|-- .github/workflows/    # GitHub Pages deployment workflow
`-- docs/                 # use for design notes, roadmap, security briefs
```
`main.js` bootstraps the city, vehicles, collectibles, and the manual camera with no bundler; keep additional modules ES-module friendly.

## Build, Test, and Development Commands
- `npx serve .` - preview the site locally before pushing.
- `npx html-validate index.html` - catch ARIA or semantic regressions when editing the HUD overlay.
- `npx stylelint "assets/css/**/*.css"` - enforce token usage and avoid accidental global overrides.
- `npx eslint assets/js/main.js` - optional once you add a config; helps keep modules tidy.

## Coding Style & Naming Conventions
Use 2-space indentation and single quotes inside scripts. CSS sticks to BEM-leaning names (`.overlay__header`, `.energy__fill`). Store palette, spacing, and typography tokens under `:root`. Scene helpers (camera controls, node spawning, car loops) live in discrete functions—prefer pure helpers over sprawling animation blocks. Document new HUD data hooks with `data-*` attributes in the markup.

## Testing Guidelines
Smoke-test interactions: keyboard movement, boost, camera pan/tilt, node collection, reset states, and responsive overlay (desktop vs mobile). For automated coverage, add Playwright specs under `tests/e2e/` to assert score increments after simulated collisions, camera limits, and that energy drains when idle.

## Commit & Pull Request Guidelines
Follow Conventional Commits (e.g., `feat: add skyline particles`, `fix: clamp camera pan`). PRs should include a short summary, a GIF or video clip, and the commands executed (serve/lint/validate). Rebase feature branches on `main` before pushing to keep the Pages workflow simple.

## Deployment Workflow
`.github/workflows/pages.yml` builds the repository root and publishes to the `github-pages` environment on every push to `main` or manual dispatch. Keep the playable experience rooted at `/`; update the `path` input only if you reorganize the project tree.

## Three.js Gameplay Notes
The camera is fixed-angle but user-controlled: arrow keys pan the view, Q/E adjusts altitude. Modify `cameraState` and `handleCameraPan` if you need different bounds or speeds. Collectible nodes live in arrays—extend their `userData` objects for new mechanics (power boosts, decay timers). Keep energy/score logic centralized in `updateGameState` so HUD values stay in sync.
