# CLAUDE.md — pkgs/frontend

Guidance for the Toban web app. The repo-root `CLAUDE.md` covers monorepo-wide concerns (Biome, Lefthook, worktree flow, domain model). This file covers the frontend specifics.

## Stack

- **React Router v7** (the successor to Remix; `react-router dev`/`build` — there is no `remix` CLI here despite older docs). File-based routes in `app/routes/`, route config in `app/routes.ts`, root in `app/root.tsx`.
- **Vite 7** with `vite-tsconfig-paths`, `vite-plugin-pwa`, `vite-plugin-node-polyfills`.
- **Tailwind CSS v4** via `@tailwindcss/vite` — design tokens and base styles live in `app/styles/globals.css`. There is no `tailwind.config.*`; v4 is CSS-first.
- **shadcn/ui** components are vendored under `app/components/ui/` (`new-york` style, `components.json`). Aliases: `~/components`, `~/components/ui`, `~/lib/utils`, `~/hooks`. Composite/layout patterns built on top live in `app/components/composite/` and `app/components/layout/` and have Ladle stories alongside.
- **Ladle** (`pnpm ladle`) for component preview — every shadcn-level and composite component should ship with a `*.stories.tsx` next to it.
- **Privy** (`@privy-io/react-auth`) for auth + embedded/smart wallets. `useActiveWallet` (`hooks/useWallet.ts`) is the canonical hook; `SmartWalletLoading` gates render until the smart wallet is ready (see `app/root.tsx`).
- **viem** for chain RPC (`hooks/useViem.ts` exports `currentChain`, derived from `VITE_CHAIN_ID`). **Pimlico + permissionless** for ERC-4337 user ops.
- **Apollo Client** for GraphQL. Two endpoints in `utils/apollo.ts`: `goldskyClient` (Toban subgraph, primary) and `hatsApolloClient` (Hats Protocol subgraph). Apollo's `ApolloProvider` wraps the tree in `app/root.tsx` with `goldskyClient`.
- **Zustand** stores in `app/stores/` (`workspace`, `ui`, `session`) — re-exported from `app/stores/index.ts`. Prefer extending these over inventing new stores.
- **i18n** with `react-i18next`; locales in `app/locales/`. The HTML `lang` attribute is set from `i18n.resolvedLanguage` in `Layout`.

## Design system — build pages by composing existing components

`app/components/ui/`, `app/components/composite/`, and `app/components/layout/` together **are** the design system. Routes/pages should be assembled from these — do not introduce new ad-hoc layout/typography/styling at the page level.

- **`app/components/ui/`** — shadcn-vendored primitives (`new-york` style): `button`, `card`, `dialog`, `dropdown-menu`, `input`, `textarea`, `tabs`, `sheet`, `popover`, `tooltip`, `avatar`, `badge`, `checkbox`, `switch`, `radio-group`, `skeleton`, `sonner`, `field`, `label`, `menu`, `icon`, plus the Toban-specific `heading` and `typography` (see Typography section below). These are the lowest level — keep them close to upstream shadcn so future updates merge cleanly. Edit only when a token/variant change is needed; otherwise build *on top* in `composite/`.
- **`app/components/composite/`** — Toban-specific patterns built from primitives: `chip`, `divider`, `empty-state`, `field-label`, `row`, `section-label`, `segmented`, `stat-card`, `step-bar`, `summary-row`, `toggle-row`, `weight-bar`. Use these for any list-row / form-row / status-card shape that already exists.
- **`app/components/layout/`** — page chrome: `AppShell`, `AppHeader`, `TopBar`, `BottomNav`, `Sidebar`, `PageContainer`, `ScreenHeader`, `MasterDetailLayout`. Routes should wrap their content in these instead of hand-rolling headers/containers.

Workflow when building a route:

1. Wrap the screen in the right `layout/` component (`AppShell` for mobile-first nav screens, `MasterDetailLayout` for split views, `PageContainer` + `ScreenHeader` for inner pages).
2. Compose the screen body from `composite/` rows/cards/segmented controls.
3. Drop to `ui/` primitives only when no `composite/` pattern fits.
4. **Before adding a new component**, check `composite/` for a near-match and extend it — most "I need a new card variant" turns into a new prop on `stat-card` / `summary-row`. New shared patterns belong in `composite/`, not in `routes/`.
5. Every new `ui/` or `composite/` component ships with a `*.stories.tsx` next to it (Ladle previews them).

Domain components (`app/components/{assistcredit,roles,splits,thankstoken,...}/`) are allowed to compose `composite/` + `ui/` for feature-specific UIs; they are **not** the design system and should not be reached for from unrelated features.

## Typography — `Heading` and `Typography` primitives

All headings and running text on renewed surfaces go through `app/components/ui/heading.tsx` and `app/components/ui/typography.tsx` (issue #491). **Don't reach for `text-*` / `font-*` / `tracking-*` / `leading-*` Tailwind utilities on `<h*>`/`<p>`/`<span>`/`<div>` text nodes** — pick the right `variant` instead. The variants exist so the type scale lives in one place and trivially follows token changes in `globals.css`.

- `Heading variant="…"` for headings. Variant carries the full visual scale; `level={1..6}` controls the semantic element. Variants: `display` (LP hero), `hero` (auth hero), `h1` (LP section title), `h2` (app page title), `h3` (section / card title), `h4` / `h5` / `h6` (progressively tighter card-internal titles), `eyebrow` (small-caps section caption). Decouple visual size from semantic level when needed: `<Heading variant="h2" level={1}>` for a page title that's visually h2 but the page's H1 in document outline.
- `Typography variant="…"` for body / caption / numeric stat text. Variants: `display`, `statLg` / `statMd` (numeric stat displays), `lead`, `body`, `bodySm`, `caption`, `micro`, `label`, `mono`. Use `tone` (`primary` / `secondary` / `muted` / `danger` / `success`) for colour, `weight` to bump weight without leaving the variant, `truncate` for single-line ellipsis, and `as` (`p` / `span` / `div`) when the default `<p>` is wrong (e.g. inline copy).
- The 13 px and 14 px sizes collapse into `bodySm` on purpose — don't reintroduce a near-duplicate adjacent slot.
- Need a one-off literal px (40 px / 56 px hero numeric on the home screen, for instance)? Compose `variant="statLg"` with a `className="text-[40px]"` override so the call site still declares "this is a stat display" rather than re-deriving the full scale.
- When wrapping a `<Link>` so it inherits Typography styles, use `<Typography asChild as="span" variant="caption" tone="secondary"><Link …/></Typography>` — Radix `Slot.Root` passes the classes onto the link.
- Composite-level wrappers (`SectionLabel`, `FieldLabel`, etc.) already consume Typography internally; reach for those when the role is named ("section label"). Reach for the raw primitive when no composite fits.

## Icons — react-icons only

Use `react-icons` (already a dependency). **Do not install `lucide-react`.** When pasting shadcn/ui generator output that imports from `lucide-react`, replace those imports with `react-icons/lu` (e.g. `import { LuChevronRight } from "react-icons/lu"`) — `react-icons/lu` exposes the same Lucide set.

## Toasts — sonner only

Use `sonner` for toasts: `import { toast } from "sonner"` (matches the `toast.success` / `toast.error` API). The global `<Toaster />` is already mounted inside `PrivyAppRoot`. **Do not import from `react-toastify`** in any route module or any module that a route imports at the top level — `react-toastify@11`'s ESM entry runs `document.head.insertBefore(<style>, head.firstChild)` at module evaluation, which shifts every expected `<meta>` position in `<head>` and breaks SSR hydration on direct loads ("Expected server HTML to contain a matching `<meta>` in `<head>`"). Sonner is safe because its equivalent uses `appendChild` (END of `<head>`), so the order of React-rendered children is preserved. `react-toastify`'s `<ToastContainer />` is still mounted via the lazy `PrivyAppRoot` for the legacy chakra-era surfaces that haven't migrated yet (issue #422); leave those alone but don't add new imports.

## Commands

```
pnpm frontend dev          # react-router dev (uses .env.local)
pnpm frontend dev:base     # uses .env.base — for Base mainnet config
pnpm frontend build        # react-router build
pnpm frontend start        # serve build/server/index.js
pnpm frontend typecheck    # react-router typegen + tsc --noEmit
pnpm frontend codegen      # GraphQL Codegen → ./gql/ (client preset)
pnpm frontend ladle        # component preview
pnpm frontend test:e2e:dev # cypress open
```

`typecheck` runs `react-router typegen` first — that regenerates `.react-router/types/*.ts` from `app/routes.ts`. If you see "missing route export" type errors after editing routes, run typecheck.

`codegen` reads from the **Base** Goldsky endpoint (hardcoded in `codegen.ts`) regardless of your local env. Output (`gql/`) is committed; re-run only when the subgraph schema actually changes.

## Routing conventions

Routes are flat files in `app/routes/` with `$param` for segments and `_` for index/escape (React Router v7 file conventions). Examples:

- `$treeId._index.tsx` — workspace home
- `$treeId_.$hatId.tsx` — role detail (note `_` after `$treeId` to break out of nesting)
- `$treeId_.$hatId_.$address_.assistcredit.send.tsx` — deeply scoped action

`treeId` (a Hats tree id) and `hatId` (256-bit hat identifier as decimal string) are the primary URL parameters. When you need a contract for a workspace, derive its addresses from the workspace's BigBang execution — see `useWorkspace` and `useContracts` hooks.

## Hooks layer (`hooks/`)

One hook per contract / concern. These wrap viem `getContract` calls and are the **only** sanctioned way for routes to talk to chain. When adding a contract, follow the existing pattern: ABI in `pkgs/frontend/abi/`, hook in `hooks/`, optional Apollo query for indexed data.

Notable hooks: `useBigBang`, `useHats`, `useHatsTimeFrameModule`, `useHatsHatCreatorModule`, `useFractionToken`, `useThanksToken`, `useSplitsCreator`, `useWorkspace`, `useWallet`, `useViem`, `useIpfs` (Pinata), `useENS` (Namestone).

## Environment

Required `pkgs/frontend/.env.local` keys (see README for the canonical list): `VITE_CHAIN_ID`, `VITE_PRIVY_APP_ID`, `VITE_BIGBANG_ADDRESS`, `VITE_HATS_ADDRESS`, `VITE_FRACTION_TOKEN_ADDRESS`, `VITE_SPLITS_CREATOR_ADDRESS`, `VITE_PIMLICO_API_KEY`, `VITE_PINATA_*`, `VITE_NAMESTONE_API_KEY`, `VITE_GOLDSKY_GRAPHQL_ENDPOINT`, `VITE_ALCHEMY_KEY`. `.env.base` toggles to Base mainnet for `dev:base`.

## Testing

E2E only — Cypress under `cypress/`. There is no Vitest/Jest unit-test setup here; for non-trivial logic, prefer extracting to a pure module and exercising via Cypress component testing or Ladle.
