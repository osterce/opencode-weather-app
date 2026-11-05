import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Config } from "../../types/Config.ts";
import { addCity } from "../../actions/addCity.ts";
import { loadConfig } from "../../storage/settingsStorage.ts";
import { captureConsole } from "../helpers/captureConsole.ts";
import type { ConsoleCapture } from "../helpers/captureConsole.ts";
import {
  geocodingPayload,
  jsonResponse,
  madrid,
  ottawa,
} from "../helpers/fixtures.ts";
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

const emptyConfig: Config = {
  version: 1,
  unit: "celsius",
  defaultCityId: null,
  cities: [],
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

describe("addCity", () => {
  test("cancela la búsqueda si la consulta está vacía", async () => {
    const prompt = createFakePrompt({ answers: [""] });

    expect(await addCity(prompt, emptyConfig)).toBe(emptyConfig);
    expect(consoleCapture?.output()).toContain("Búsqueda cancelada.");
  });

  test("avisa cuando no hay resultados", async () => {
    mockFetch(() => jsonResponse({}));
    const prompt = createFakePrompt({ answers: ["zzzz"] });

    expect(await addCity(prompt, emptyConfig)).toBe(emptyConfig);
    expect(consoleCapture?.output()).toContain(
      'No se encontró "zzzz". Prueba con otro nombre.',
    );
  });

  test("muestra el error de la API sin romper la acción", async () => {
    mockFetch(() => new Response("", { status: 500 }));
    const prompt = createFakePrompt({ answers: ["Ottawa"] });

    expect(await addCity(prompt, emptyConfig)).toBe(emptyConfig);
    expect(consoleCapture?.output()).toContain(
      "El servicio respondió con un error (HTTP 500).",
    );
  });

  test("guarda un resultado único y permite hacerlo default", async () => {
    mockFetch(() => jsonResponse(geocodingPayload([ottawa])));
    const prompt = createFakePrompt({
      answers: ["Ottawa"],
      confirms: [true],
    });

    const next = await addCity(prompt, emptyConfig);

    expect(next.cities).toEqual([ottawa]);
    expect(next.defaultCityId).toBe(ottawa.id);
    expect((await loadConfig()).config).toEqual(next);
    expect(consoleCapture?.output()).toContain("Guardada: Ottawa, Ontario, Canadá");
    expect(consoleCapture?.output()).toContain(
      "Ciudad default: Ottawa, Ontario, Canadá",
    );
  });

  test("guarda un resultado único sin default si el usuario rechaza", async () => {
    mockFetch(() => jsonResponse(geocodingPayload([ottawa])));
    const prompt = createFakePrompt({
      answers: ["Ottawa"],
      confirms: [false],
    });

    const next = await addCity(prompt, emptyConfig);

    expect(next.cities).toEqual([ottawa]);
    expect(next.defaultCityId).toBeNull();
  });

  test("permite elegir entre varios resultados", async () => {
    mockFetch(() => jsonResponse(geocodingPayload([ottawa, madrid])));
    const prompt = createFakePrompt({
      answers: ["Canada", "2"],
      confirms: [false],
    });

    const next = await addCity(prompt, emptyConfig);

    expect(next.cities).toEqual([madrid]);
    expect(prompt.asked[1]).toContain("Elige una ciudad [1-2]");
    expect(consoleCapture?.output()).toContain("Resultados:");
  });

  test("cancela la selección cuando se elige 0", async () => {
    mockFetch(() => jsonResponse(geocodingPayload([ottawa, madrid])));
    const prompt = createFakePrompt({ answers: ["Canada", "0"] });

    expect(await addCity(prompt, emptyConfig)).toBe(emptyConfig);
    expect(consoleCapture?.output()).toContain("Búsqueda cancelada.");
  });

  test("avisa si la ciudad ya está guardada", async () => {
    mockFetch(() => jsonResponse(geocodingPayload([ottawa])));
    const config: Config = {
      ...emptyConfig,
      defaultCityId: ottawa.id,
      cities: [ottawa],
    };
    const prompt = createFakePrompt({ answers: ["Ottawa"] });

    expect(await addCity(prompt, config)).toBe(config);
    expect(consoleCapture?.output()).toContain('"Ottawa, Ontario, Canadá" ya está guardada.');
  });

  test("puede establecer como default una ciudad ya guardada", async () => {
    mockFetch(() => jsonResponse(geocodingPayload([ottawa])));
    const config: Config = {
      ...emptyConfig,
      defaultCityId: null,
      cities: [ottawa],
    };
    const prompt = createFakePrompt({
      answers: ["Ottawa"],
      confirms: [true],
    });

    const next = await addCity(prompt, config, true);

    expect(next.defaultCityId).toBe(ottawa.id);
    expect(next.cities).toEqual([ottawa]);
    expect(consoleCapture?.output()).toContain(
      "Ciudad default: Ottawa, Ontario, Canadá",
    );
  });

  test("no modifica la configuración si falla el guardado", async () => {
    mockFetch(() => jsonResponse(geocodingPayload([ottawa])));
    const blocked = join(temp.dir, "blocked");
    await writeFile(blocked, "no es un directorio");
    process.env.WEATHER_CLI_CONFIG = join(blocked, "config.json");
    const prompt = createFakePrompt({ answers: ["Ottawa"] });

    expect(await addCity(prompt, emptyConfig)).toBe(emptyConfig);
    expect(consoleCapture?.output()).toContain(
      "No se pudo guardar la configuración",
    );
  });
});
