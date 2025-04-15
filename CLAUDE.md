# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Lint, Test Commands
- Build: `pnpm run build` (frontend) or `pnpm run compile` (contract)
- Lint: `pnpm run lint` or `npx biome check --write .`
- Format: `npx biome format --write .`
- Test contract: `npx hardhat test` or `npx hardhat test test/FractionToken.ts` (single test)
- Run frontend: `pnpm frontend dev`
- Typecheck: `pnpm typecheck`
- Generate GraphQL types: `pnpm frontend codegen`

## Code Style
- Use double quotes for strings (as specified in biome.json)
- Use spaces for indentation (not tabs)
- Always run typecheck before committing (`pnpm frontend typecheck`)
- Organize imports (automatically handled by Biome)
- Follow recommended linting rules from Biome
- For contracts: follow Solidity style guide and use solhint
- Use functional components with TypeScript for React
- Use descriptive variable names in camelCase (or PascalCase for components)
- Handle errors with appropriate try/catch or propagation