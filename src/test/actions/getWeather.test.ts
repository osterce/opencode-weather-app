import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Config } from "../../types/Config.ts";
import {
  showAllWeather,
  showDefaultWeather,
} from "../../actions/getWeather.ts";
import { captureConsole } from "../helpers/captureConsole.ts";
import type { ConsoleCapture } from "../helpers/captureConsole.ts";
import { forecastPayload, jsonResponse, madrid, ottawa } from "../helpers/fixtures.ts";
import { createFakePrompt } from "../helpers/fakePrompt.ts";
import { mockFetch } from "../helpers/mockFetch.ts";
import {
  createTempConfig,
  removeTempConfig,
  restoreConfigOverride,
} from "../helpers/tempConfig.ts";
import type { TempConfig } from "../helpers/tempConfig.ts";

const originalFetch = globalThis.fetch;
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
  globalThis.fetch = originalFetch;
  restoreConfigOverride(originalOverride);
  await removeTempConfig(temp.dir);
});

describe("showDefaultWeather", () => {
  test("muestra la tarjeta y el pronóstico de la ciudad default", async () => {
    mockFetch(() => jsonResponse(forecastPayload));
    const prompt = createFakePrompt();

    expect(await showDefaultWeather(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain("Ottawa, Ontario, Canadá");
    expect(consoleCapture?.output()).toContain("17,6 °C");
    expect(consoleCapture?.output()).toContain("PRONÓSTICO 7 DÍAS");
    expect(prompt.waits).toBe(1);
  });

  test("inicia el alta de una ciudad si no hay ninguna guardada", async () => {
    const prompt = createFakePrompt({ answers: [""] });
    const empty: Config = { ...config, defaultCityId: null, cities: [] };

    expect(await showDefaultWeather(prompt, empty)).toBe(empty);
    expect(consoleCapture?.output()).toContain(
      "Todavía no hay ciudad default. Vamos a buscar una.",
    );
    expect(consoleCapture?.output()).toContain("Búsqueda cancelada.");
  });

  test("pide elegir la default si hay ciudades pero ninguna marcada", async () => {
    const prompt = createFakePrompt();
    const withoutDefault: Config = { ...config, defaultCityId: null };

    expect(await showDefaultWeather(prompt, withoutDefault)).toBe(
      withoutDefault,
    );
    expect(consoleCapture?.output()).toContain(
      "No hay ciudad default. Usa la opción 5 para elegir una.",
    );
    expect(prompt.waits).toBe(0);
  });

  test("muestra el error de la API y no espera Enter", async () => {
    mockFetch(() => new Response("", { status: 500 }));
    const prompt = createFakePrompt();

    expect(await showDefaultWeather(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain(
      "El servicio respondió con un error (HTTP 500).",
    );
    expect(prompt.waits).toBe(0);
  });
});

describe("showAllWeather", () => {
  test("avisa si no hay ciudades guardadas", async () => {
    const prompt = createFakePrompt();
    const empty: Config = { ...config, defaultCityId: null, cities: [] };

    await showAllWeather(prompt, empty);

    expect(consoleCapture?.output()).toContain(
      "No hay ciudades guardadas. Usa la opción 3 para agregar una.",
    );
    expect(prompt.waits).toBe(0);
  });

  test("combina éxitos y errores de cada ciudad", async () => {
    mockFetch((url) =>
      url.includes("latitude=45.41117")
        ? jsonResponse(forecastPayload)
        : new Response("", { status: 500 }),
    );
    const prompt = createFakePrompt();

    await showAllWeather(prompt, config);

    const output = consoleCapture?.output() ?? "";
    expect(output).toContain("CLIMA DE TODAS LAS CIUDADES (2)");
    expect(output).toContain("★");
    expect(output).toContain("Ottawa, Ontario, Canadá");
    expect(output).toContain("Madrid, España");
    expect(output).toContain("sin datos");
    expect(output).toContain("El servicio respondió con un error (HTTP 500).");
    expect(prompt.waits).toBe(1);
  });
});
