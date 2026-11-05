import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Config } from "../../types/Config.ts";
import { changeSettings } from "../../actions/settings.ts";
import { loadConfig } from "../../storage/settingsStorage.ts";
import { captureConsole } from "../helpers/captureConsole.ts";
import type { ConsoleCapture } from "../helpers/captureConsole.ts";
import { ottawa } from "../helpers/fixtures.ts";
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
  cities: [ottawa],
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

describe("changeSettings", () => {
  test("vuelve con 0 sin cambiar la unidad", async () => {
    const prompt = createFakePrompt({ answers: ["0"] });

    expect(await changeSettings(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain("AJUSTES");
  });

  test("vuelve con una respuesta vacía", async () => {
    const prompt = createFakePrompt({ answers: [""] });

    expect(await changeSettings(prompt, config)).toBe(config);
  });

  test("rechaza opciones inválidas y repite el menú", async () => {
    const prompt = createFakePrompt({ answers: ["x", "0"] });

    expect(await changeSettings(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain("Opción inválida.");
    expect(prompt.asked).toHaveLength(2);
  });

  test("avisa si la unidad ya está activa y luego permite cambiarla", async () => {
    const prompt = createFakePrompt({ answers: ["1", "2"] });

    const next = await changeSettings(prompt, config);

    expect(next.unit).toBe("fahrenheit");
    expect(consoleCapture?.output()).toContain("Ya estás usando °C.");
    expect(consoleCapture?.output()).toContain("Unidad cambiada a °F.");
    expect((await loadConfig()).config.unit).toBe("fahrenheit");
  });

  test("cambia de °F a °C", async () => {
    const prompt = createFakePrompt({ answers: ["1"] });

    const next = await changeSettings(prompt, { ...config, unit: "fahrenheit" });

    expect(next.unit).toBe("celsius");
    expect(consoleCapture?.output()).toContain("Unidad cambiada a °C.");
  });
});
