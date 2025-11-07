# Repository Guidelines

## Project Structure & Module Organization
GitHub Pages serves directly from `main`, so keep the structure flat and predictable:
```
beefbeater/
|-- index.html      # landing page rendered by GitHub Pages
|-- assets/
|   |-- css/        # global styles (`styles.css`)
|   |-- js/         # progressive enhancement scripts (`main.js`)
|   `-- img/        # optimized media (SVG/PNG, under 200KB each)
`-- docs/           # contributor notes, roadmap, security briefings
```
Stick to semantic HTML sections in `index.html` so screen readers map content correctly. Group reusable UI in partials before inlining to the top-level page.

## Build, Test, and Development Commands
- `npm install` -- install tooling such as Prettier or eslint configs if you add Node-based automation.
- `npm run format` -- optional script that runs `prettier --write \"**/*.{html,css,js,md}\"`; add when formatting automation lands.
- `npx serve .` -- lightweight static preview (or use VS Code Live Server) to test pages before pushing.
- `npx lighthouse http://localhost:3000` -- spot-check accessibility and performance budgets; keep performance ≥90.

## Coding Style & Naming Conventions
Use HTML5 + CSS custom properties; prefer BEM-inspired class names (e.g., `.hero__card`, `.section--accent`). Indent with 2 spaces in HTML/CSS/JS and single quotes in scripts. Centralize colors, spacing, and typography tokens in `:root` so palette swaps stay simple. JS modules should be self-contained, exporting functions from `assets/js/` and attaching behavior with `data-*` hooks instead of hard-coded IDs.

## Testing Guidelines
For a static site, prioritize smoke checks:
- Validate HTML via `npx html-validate index.html`.
- Run `npx stylelint \"assets/css/**/*.css\"` if styles grow beyond a single file.
- Use Playwright or Cypress only if interactive flows emerge; keep tests in `tests/e2e/` and reference them from `docs/testing.md`.

## Commit & Pull Request Guidelines
Follow Conventional Commits (examples: `feat: redesign hero metrics`, `chore: compress hero background`). Rebase before pushing so `main` stays linear. Each PR must include: TL;DR summary, before/after screenshot or Lighthouse snippet, list of commands executed, and any open questions. Tag reviewers with domain context (design, content, engineering) when appropriate.

## Security & Configuration Tips
GitHub Pages is public—never commit secrets. If a workflow eventually requires API keys, keep them in repository secrets and document usage in `docs/security.md`. Optimize images offline and strip EXIF data before committing. Use dependabot alerts to stay current on any npm tooling you add for formatting or testing.
