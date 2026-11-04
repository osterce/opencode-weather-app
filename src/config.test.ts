import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultConfig, loadConfig, saveConfig } from "./config.ts";
import type { Config } from "./types.ts";

let dir: string;
let file: string;
const originalOverride = process.env.WEATHER_CLI_CONFIG;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
  file = join(dir, "config.json");
  process.env.WEATHER_CLI_CONFIG = file;
});

afterEach(async () => {
  if (originalOverride === undefined) {
    delete process.env.WEATHER_CLI_CONFIG;
  } else {
    process.env.WEATHER_CLI_CONFIG = originalOverride;
  }
  await rm(dir, { recursive: true, force: true });
});

describe("loadConfig", () => {
  test("devuelve la configuración por defecto si el archivo no existe", async () => {
    const { config, warning } = await loadConfig();

    expect(config).toEqual(defaultConfig());
    expect(warning).toBeUndefined();
  });

  test("respaldar y reiniciar una configuración con JSON inválido", async () => {
    await writeFile(file, "{esto no es json");

    const { config, warning } = await loadConfig();

    expect(config).toEqual(defaultConfig());
    expect(warning).toContain(".bak");
    expect(await readFile(`${file}.bak`, "utf8")).toBe("{esto no es json");
  });

  test("respaldar y reiniciar una configuración con formato desconocido", async () => {
    await writeFile(file, JSON.stringify({ version: 2, cities: [] }));

    const { config, warning } = await loadConfig();

    expect(config).toEqual(defaultConfig());
    expect(warning).toContain(".bak");
  });

  test("descarta defaultCityId si la ciudad ya no existe", async () => {
    await writeFile(
      file,
      JSON.stringify({
        version: 1,
        unit: "celsius",
        defaultCityId: 99,
        cities: [],
      }),
    );

    const { config } = await loadConfig();

    expect(config.defaultCityId).toBeNull();
  });

  test("ignora ciudades con datos inválidos", async () => {
    await writeFile(
      file,
      JSON.stringify({
        version: 1,
        unit: "celsius",
        defaultCityId: null,
        cities: [
          { id: 1, name: "Ottawa", country: "Canadá", latitude: 45.4, longitude: -75.7 },
          { id: "malo", name: "Madrid" },
        ],
      }),
    );

    const { config } = await loadConfig();

    expect(config.cities).toHaveLength(1);
    expect(config.cities[0]?.name).toBe("Ottawa");
  });
});

describe("saveConfig", () => {
  test("guarda y vuelve a cargar la configuración", async () => {
    const config: Config = {
      version: 1,
      unit: "fahrenheit",
      defaultCityId: 1,
      cities: [
        {
          id: 1,
          name: "Ottawa",
          admin1: "Ontario",
          country: "Canadá",
          latitude: 45.41117,
          longitude: -75.69812,
        },
      ],
    };

    await saveConfig(config);
    const { config: loaded } = await loadConfig();

    expect(loaded).toEqual(config);
  });
});
