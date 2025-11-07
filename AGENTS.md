# Repository Guidelines

## Project Structure & Module Organization
```
beefbeater/
|-- index.html            # Neon Surveyor entry (full canvas + floating HUD chips)
|-- assets/
|   |-- css/styles.css    # HUD + button styling, global tokens
|   `-- js/main.js        # Three.js scene graph, camera rig, gameplay loop
|-- .github/workflows/    # GitHub Pages deployment workflow
`-- docs/                 # use for design notes, roadmap, security briefs
```
`main.js` bootstraps the city, collectibles, and manual camera with no bundler; keep new modules ES-module friendly.

## Build, Test, and Development Commands
- `npx serve .` - preview locally before pushing.
- `npx html-validate index.html` - catch markup issues when adjusting the HUD.
- `npx stylelint "assets/css/**/*.css"` - enforce token usage and avoid accidental overrides.
- `npx eslint assets/js/main.js` - optional once you add a config to keep modules tidy.

## Coding Style & Naming Conventions
Use 2-space indentation and single quotes inside scripts. CSS sticks to BEM-leaning names (`.hud-floating__stats`). Store palette, spacing, and typography tokens under `:root`. Scene helpers (camera controls, node spawning) remain in discrete functions—prefer pure helpers over sprawling animation blocks. Guard new DOM hooks with `data-*` attributes so scripts stay decoupled from presentation.

## Testing Guidelines
Manual smoke tests: WASD movement, boost, camera pan/tilt (arrow keys + Q/E), node collection, reset button, and responsive HUD behavior. For automation, add Playwright specs under `tests/e2e/` to assert score increments after collisions and to verify camera clamps.

## Commit & Pull Request Guidelines
Follow Conventional Commits (e.g., `feat: add skyline particles`, `fix: clamp camera pan`). PRs should include a quick summary, a GIF/video clip, and the commands executed (serve/lint/validate). Rebase feature branches on `main` before pushing to keep the Pages workflow simple.

## Deployment Workflow
`.github/workflows/pages.yml` builds the repository root and publishes to the `github-pages` environment on every push to `main` or manual dispatch. Keep the playable experience rooted at `/`; update the workflow `path` only if you reorganize the tree.

## Three.js Gameplay Notes
The camera is diagonal and user-controlled: arrow keys pan the view, and the mouse scroll wheel adjusts altitude (scroll up lowers the camera, scroll down raises it). Tweak `cameraState` and `handleCameraPan` if you need different bounds or speeds. Collectible nodes live in the `nodes` array—extend their `userData` objects for new mechanics (power boosts, decay timers). Keep score logic centralized in `collectNode` so HUD values stay in sync.
