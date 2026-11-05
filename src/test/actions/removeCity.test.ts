import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Config } from "../../types/Config.ts";
import { removeCity } from "../../actions/removeCity.ts";
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

describe("removeCity", () => {
  test("avisa si no hay ciudades guardadas", async () => {
    const empty: Config = { ...config, defaultCityId: null, cities: [] };
    const prompt = createFakePrompt();

    expect(await removeCity(prompt, empty)).toBe(empty);
    expect(consoleCapture?.output()).toContain("No hay ciudades guardadas.");
    expect(prompt.asked).toHaveLength(0);
  });

  test("cancela con 0 y no guarda cambios", async () => {
    const prompt = createFakePrompt({ answers: ["0"] });

    expect(await removeCity(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain("Ciudades guardadas:");
  });

  test("muestra un error y cancela con un índice inválido", async () => {
    const prompt = createFakePrompt({ answers: ["9"] });

    expect(await removeCity(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain("Opción inválida.");
  });

  test("respeta la cancelación de la confirmación", async () => {
    const prompt = createFakePrompt({ answers: ["1"], confirms: [false] });

    expect(await removeCity(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain("Cancelado.");
  });

  test("elimina una ciudad que no es la default", async () => {
    const prompt = createFakePrompt({ answers: ["2"], confirms: [true] });

    const next = await removeCity(prompt, config);

    expect(next.cities).toEqual([ottawa]);
    expect(next.defaultCityId).toBe(ottawa.id);
    expect((await loadConfig()).config).toEqual(next);
    expect(consoleCapture?.output()).toContain("Eliminada: Madrid, España");
  });

  test("limpia la default al eliminar la ciudad default", async () => {
    const prompt = createFakePrompt({ answers: ["1"], confirms: [true] });

    const next = await removeCity(prompt, config);

    expect(next.cities).toEqual([madrid]);
    expect(next.defaultCityId).toBeNull();
    expect(consoleCapture?.output()).toContain(
      "Era la ciudad default; ahora no hay default. Usa la opción 5.",
    );
  });
});
