# AGENTS.md

## Project

Bun + TypeScript weather CLI. It accepts a city, fetches current weather from
Open-Meteo, persists a default city and a saved city list, and compiles to a
standalone executable. `README.md` (Spanish) is the product spec (default city,
saved city list, menu mockup).

Layout:

- `index.ts` — entry point: menu loop, option handlers, SIGINT/EOF handling.
- `src/api.ts` — geocoding and forecast calls, timeouts, `WeatherApiError`.
- `src/config.ts` — JSON config load/save, validation, corrupt-file backup.
- `src/format.ts` — temperature conversion, Spanish formatting, weather card,
  city table, and 7-day forecast table (`forecast_days=7`).
- `src/ui.ts` — ANSI colors, menu/settings rendering, readline prompt helpers.
- `src/weather-codes.ts` — WMO code → Spanish label/icon table.
- `src/types.ts` — shared `City`, `Config`, `WeatherData` types.
- `src/*.test.ts` — `bun:test` unit tests.

## Commands

- Run: `bun run start` (or `bun run index.ts`)
- Dev with watch: `bun run dev`
- Typecheck: `bun run typecheck` (`bunx tsc --noEmit`) — strict with
  `noUncheckedIndexedAccess`; Bun does not typecheck when running
- Test: `bun run test` (`bun test`)
- Build standalone binary: `bun run build` (runs `bun build --compile`, then an
  ad-hoc `codesign` on macOS so the binary launches)
- Install: `bun install` — `bun.lock` is the lockfile

Use Bun rather than Node/npm; `bun-instructions.md` is the canonical Bun API
guidance (more docs in `node_modules/bun-types/docs/`).

## Conventions

- User-facing strings, prompts, and docs are in Spanish. Match the menu layout
  in README (options 1-5, 8, 9; 6 and 7 stay free).
- Imports include `.ts` extensions; `verbatimModuleSyntax` requires `import type`
  for type-only imports.
- Weather lookup is always two calls: geocoding
  (`geocoding-api.open-meteo.com/v1/search`, `language=es`) to get lat/lon, then
  `api.open-meteo.com/v1/forecast` (current + daily for 7 days, including
  `precipitation_probability_max`). The forecast is always requested in °C and
  converted locally for °F.
- Persistence is a single JSON file: `$XDG_CONFIG_HOME/weather-cli/config.json`
  (default `~/.config/weather-cli/config.json`), overridable with
  `WEATHER_CLI_CONFIG`. Schema: `{ version: 1, unit, defaultCityId, cities[] }`;
  the default city is referenced by `id` and also lives in `cities`. Saves are
  atomic (temp file + rename). Corrupt configs are renamed to `config.json.bak`.
- Network failures must stay user-facing and Spanish, and must not crash the
  menu loop.
- Puedes utilizar `@bun-instructions.md` para obtener informacion de como
  utilizar bun.
