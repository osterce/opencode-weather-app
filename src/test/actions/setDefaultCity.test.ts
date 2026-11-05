import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Config } from "../../types/Config.ts";
import { setDefaultCity } from "../../actions/setDefaultCity.ts";
import { loadConfig } from "../../storage/settingsStorage.ts";
import { captureConsole } from "../helpers/captureConsole.ts";
import type { ConsoleCapture } from "../helpers/captureConsole.ts";
import { madrid, ottawa } from "../helpers/fixtures.ts";
import { createFakePrompt } from "../helpers/fakePrompt.ts";
import {
  createTempConfig,
  removeTempConfig,
  restoreConfigOverride,
} from "../helpers/tempConfig.ts";
import type { TempConfig } from "../helpers/tempConfig.ts";

const originalOverride = process.env.WEATHER_CLI_CONFIG;
let temp: TempConfig;
let consoleCapture: ConsoleCapture | undefined;

const config: Config = {
  version: 1,
  unit: "celsius",
  defaultCityId: ottawa.id,
  cities: [ottawa, madrid],
};

beforeEach(async () => {
  temp = await createTempConfig();
  consoleCapture = captureConsole();
});

afterEach(async () => {
  consoleCapture?.restore();
  consoleCapture = undefined;
  restoreConfigOverride(originalOverride);
  await removeTempConfig(temp.dir);
});

describe("setDefaultCity", () => {
  test("avisa si no hay ciudades guardadas", async () => {
    const empty: Config = { ...config, defaultCityId: null, cities: [] };
    const prompt = createFakePrompt();

    expect(await setDefaultCity(prompt, empty)).toBe(empty);
    expect(consoleCapture?.output()).toContain(
      "No hay ciudades guardadas. Agrega una con la opción 3.",
    );
    expect(prompt.asked).toHaveLength(0);
  });

  test("cancela con 0 sin guardar cambios", async () => {
    const prompt = createFakePrompt({ answers: ["0"] });

    expect(await setDefaultCity(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain("Ciudades guardadas:");
  });

  test("muestra un error y cancela con un índice inválido", async () => {
    const prompt = createFakePrompt({ answers: ["9"] });

    expect(await setDefaultCity(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain("Opción inválida.");
  });

  test("avisa si la ciudad ya es la default", async () => {
    const prompt = createFakePrompt({ answers: ["1"] });

    expect(await setDefaultCity(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain(
      '"Ottawa, Ontario, Canadá" ya es la ciudad default.',
    );
  });

  test("cambia la ciudad default y la persiste", async () => {
    const prompt = createFakePrompt({ answers: ["2"] });

    const next = await setDefaultCity(prompt, config);

    expect(next.defaultCityId).toBe(madrid.id);
    expect(next.cities).toEqual(config.cities);
    expect((await loadConfig()).config).toEqual(next);
    expect(consoleCapture?.output()).toContain("Ciudad default: Madrid, España");
  });
});
