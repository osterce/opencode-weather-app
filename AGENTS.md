# AGENTS.md

## Project

Bun + TypeScript weather CLI. The target is a console app that accepts a city,
fetches current weather from Open-Meteo, and compiles to a standalone
executable. `index.ts` is the only source file and is still the `bun init`
placeholder; treat `README.md` (Spanish) as the product spec (default city,
saved city list, menu mockup).

## Commands

- Run: `bun run index.ts`
- Typecheck: `bunx tsc --noEmit` — strict with `noUncheckedIndexedAccess`; Bun
  does not typecheck when running
- Test: `bun test` (`bun:test`) — no tests exist yet
- Build standalone binary: `bun build --compile ./index.ts --outfile weather`
- Install: `bun install` — `bun.lock` is the lockfile

There are no package.json scripts, lint/formatter config, CI, or pre-commit
hooks. Use Bun rather than Node/npm; `bun-instructions.md` is the canonical Bun
API guidance (more docs in `node_modules/bun-types/docs/`).

## Conventions

- User-facing strings, prompts, and docs are in Spanish. Match the menu layout
  in README.
- Imports may include `.ts` extensions; `verbatimModuleSyntax` requires
  `import type` for type-only imports.
- Weather lookup is always two calls: geocoding
  (`geocoding-api.open-meteo.com/v1/search`, use `language=es`) to get lat/lon,
  then `api.open-meteo.com/v1/forecast`.
- No persistence or state format exists yet. If adding default-city/city-list
  storage, establish the format explicitly instead of assuming one.
- Puedes utilizar `@bun-instructions.md` para obtener informacion de como
  utilizar bun.
