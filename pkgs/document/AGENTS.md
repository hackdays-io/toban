# AGENTS.md — pkgs/document

Toban's public documentation site. Repo-root `AGENTS.md` has the monorepo context.

## Stack

- **Docusaurus 3.6** with the classic preset.
- **MDX** + `remark-math` / `rehype-katex` for math notation.
- Deployed to **GitHub Pages** by `.github/workflows/deploy-document.yml`. Published at https://hackdays-io.github.io/toban/.

## Commands

```
pnpm document start         # local dev server
pnpm document build         # static build → build/
pnpm document serve         # serve the production build
pnpm document typecheck     # tsc
pnpm document clear         # clear Docusaurus cache (when MDX gets stuck)
```

## Layout

- `docs/` — content (`welcome.md`, `howToUse.md`, `Glossary.md`, `supportedNetworks.md`, `getstarted/`, `protocol/`).
- `docs/protocol/` — protocol spec (English). `modules/<module>.md` pages use the sections Goal / Mechanism / Rationale / Principles / Known limitations. Principles is a table `| \`ID\` | Principle | Proof | Implementation |` with Proof `proven (Lean)` / `—` and Implementation `fuzzed`, `tested` / `—` — `scripts/check-spec-ids.mjs` parses exactly this shape and checks it against `pkgs/spec` and `pkgs/contract/test`. Mermaid diagrams are enabled (`@docusaurus/theme-mermaid`).
- `src/` — custom React components and CSS overrides for the theme.
- `static/` — public assets.
- `docusaurus.config.ts` — site config, plugins, navbar, footer.
- `sidebars.ts` — sidebar structure (auto-generated from `docs/` by default; customize here when ordering matters).

## When updating docs

- Use MDX where you need React; plain `.md` is fine for prose.
- Math: wrap with `$...$` (inline) or `$$...$$` (block); `remark-math`/`rehype-katex` are pre-wired.
- Cross-link to other Toban packages with relative URLs once published; treat the deployed URL as canonical.
- Biome ignores `**/docs` (see root `biome.json`) — formatting MD/MDX is a manual concern here.
