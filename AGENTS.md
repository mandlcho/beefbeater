# Repository Guidelines

## Project Structure & Module Organization
```
beefbeater/
|-- index.html            # Flux Runner entry point loaded by GitHub Pages
|-- assets/
|   |-- css/styles.css    # HUD + control panel styles and design tokens
|   `-- js/main.js        # Three.js scene, game loop, and UI bindings
|-- .github/workflows/    # Pages deployment pipeline
`-- docs/                 # design notes, roadmap, security briefs (add as needed)
```
`assets/js/main.js` imports Three.js from a CDN. Keep modules self-contained and prefer semantic HTML in `index.html` so overlays remain accessible to screen readers.

## Build, Test, and Development Commands
- `npm install` – pull in optional dev tooling (Prettier, stylelint, html-validate) when you add a `package.json`.
- `npx serve .` – run a static preview before pushing; Lighthouse prefers 60 FPS during gameplay.
- `npx html-validate index.html` – catch markup regressions, especially ARIA labels.
- `npx stylelint "assets/css/**/*.css"` – ensure HUD styles stay consistent.

## Coding Style & Naming Conventions
Use 2-space indentation and single quotes inside scripts. Class names follow a BEM-ish style (`.hud__stats`, `.status-banner`). Keep color, spacing, and typographic tokens in the `:root` block. Gameplay helpers (`spawnCrate`, `logEvent`, `escalateDifficulty`) should live in dedicated functions; add new HUD stats via `[data-*]` hooks rather than scattered IDs.

## Testing Guidelines
Manual smoke tests: capture + avoid collisions, ensure HUD counters update, and resize the window to verify responsive behavior. When automation is needed, use Playwright to assert that `[data-score]` increments after simulated collisions and that the reset button clears the log. Store browser tests under `tests/e2e/` and document scenarios in `docs/testing.md`.

## Commit & Pull Request Guidelines
Follow Conventional Commits (e.g., `feat: add energy surge power-ups`, `fix: clamp camera roll`). Every PR needs a short summary, gameplay clip or GIF, and the commands you ran. Rebase before pushing; avoid merge commits in feature branches.

## Deployment Workflow
`.github/workflows/pages.yml` builds and deploys on every push to `main` or manual dispatch. Keep the playable experience rooted at `/` so the workflow’s `path: .` remains valid. After a merge, confirm the “pages build and deployment” Action finishes green—the log prints the public URL.

## Three.js Gameplay Notes
Flux Runner targets Three.js `0.160.x`. If you upgrade, snapshot the CDN version in the import string and test combo logic (`handleCollision`) plus wave scaling. Entities live in the `crates` array; extend their `userData` for new mechanics (boosts, slow fields) instead of mutating global state. Reuse `logEvent` for any new narrative beats so the telemetry panel stays chronological.

## Security & Configuration Tips
Never store secrets in the repo—GitHub Pages is public. Optimize textures or audio offline, strip EXIF data, and keep third-party libraries pinned. If you introduce build tooling, document `.env` needs in `docs/security.md` and rely on repository secrets for API keys.
