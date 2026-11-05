import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Config } from "../../types/Config.ts";
import { trySave } from "../../actions/helpers.ts";
import { loadConfig } from "../../storage/settingsStorage.ts";
import { captureConsole } from "../helpers/captureConsole.ts";
import type { ConsoleCapture } from "../helpers/captureConsole.ts";
import { ottawa } from "../helpers/fixtures.ts";
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
});

afterEach(async () => {
  consoleCapture?.restore();
  consoleCapture = undefined;
  restoreConfigOverride(originalOverride);
  await removeTempConfig(temp.dir);
});

describe("trySave", () => {
  test("guarda y devuelve la configuración nueva", async () => {
    const next: Config = { ...config, unit: "fahrenheit" };

    expect(await trySave(next, config)).toBe(next);
    expect((await loadConfig()).config).toEqual(next);
  });

  test("si falla la escritura devuelve la configuración original", async () => {
    const blocked = join(temp.dir, "blocked");
    await writeFile(blocked, "no es un directorio");
    process.env.WEATHER_CLI_CONFIG = join(blocked, "config.json");
    consoleCapture = captureConsole();

    const next: Config = { ...config, unit: "fahrenheit" };

    expect(await trySave(next, config)).toBe(config);
    expect(consoleCapture.output()).toContain(
      "No se pudo guardar la configuración",
    );
  });
});
