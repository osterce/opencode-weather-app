import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Config } from "../../types/Config.ts";
import {
  configFilePath,
  defaultConfig,
  loadConfig,
  saveConfig,
  setUnit,
} from "../../storage/settingsStorage.ts";

let dir: string;
let file: string;
const originalOverride = process.env.WEATHER_CLI_CONFIG;
const originalXdg = process.env.XDG_CONFIG_HOME;

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
  if (originalXdg === undefined) {
    delete process.env.XDG_CONFIG_HOME;
  } else {
    process.env.XDG_CONFIG_HOME = originalXdg;
  }
  await rm(dir, { recursive: true, force: true });
});

describe("configFilePath", () => {
  test("usa WEATHER_CLI_CONFIG cuando está definida", () => {
    expect(configFilePath()).toBe(file);
  });

  test("usa XDG_CONFIG_HOME cuando no hay override", () => {
    const xdg = join(dir, "xdg");
    delete process.env.WEATHER_CLI_CONFIG;
    process.env.XDG_CONFIG_HOME = xdg;

    expect(configFilePath()).toBe(
      join(xdg, "weather-cli", "config.json"),
    );
  });

  test("cae en ~/.config cuando no hay variables de entorno", () => {
    delete process.env.WEATHER_CLI_CONFIG;
    delete process.env.XDG_CONFIG_HOME;

    expect(configFilePath()).toEndWith(
      join(".config", "weather-cli", "config.json"),
    );
  });
});

describe("loadConfig", () => {
  test("devuelve la configuración por defecto si el archivo no existe", async () => {
    const { config, warning } = await loadConfig();

    expect(config).toEqual(defaultConfig());
    expect(warning).toBeUndefined();
    expect(await Bun.file(`${file}.bak`).exists()).toBe(false);
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

  test("lanza un error claro si no puede escribir", async () => {
    const blocked = join(dir, "blocked");
    await writeFile(blocked, "no es un directorio");
    process.env.WEATHER_CLI_CONFIG = join(blocked, "config.json");

    await expect(saveConfig(defaultConfig())).rejects.toThrow(
      "No se pudo guardar la configuración",
    );
  });
});

describe("setUnit", () => {
  test("devuelve una configuración nueva con la unidad cambiada", () => {
    const config = defaultConfig();

    const next = setUnit(config, "fahrenheit");

    expect(next).not.toBe(config);
    expect(next.unit).toBe("fahrenheit");
    expect(config.unit).toBe("celsius");
  });
});
