import { mkdir, rename, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { City } from "../types/City.ts";
import type { Config, LoadConfigResult, Unit } from "../types/Config.ts";
import {
  CONFIG_DIR_NAME,
  CONFIG_FILE_NAME,
  CONFIG_VERSION,
  DEFAULT_UNIT,
} from "../utils/constants.ts";

export function configFilePath(): string {
  const override = process.env.WEATHER_CLI_CONFIG;
  if (override) return override;

  const base = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(base, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
}

export function defaultConfig(): Config {
  return {
    version: CONFIG_VERSION,
    unit: DEFAULT_UNIT,
    defaultCityId: null,
    cities: [],
  };
}

function isUnit(value: unknown): value is Unit {
  return value === "celsius" || value === "fahrenheit";
}

function parseCity(raw: unknown): City | null {
  if (typeof raw !== "object" || raw === null) return null;
  const city = raw as Record<string, unknown>;

  const { id, name, country, latitude, longitude } = city;
  if (
    typeof id !== "number" ||
    typeof name !== "string" ||
    typeof country !== "string" ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return null;
  }

  return {
    id,
    name,
    country,
    latitude,
    longitude,
    admin1: typeof city.admin1 === "string" ? city.admin1 : undefined,
  };
}

function parseConfig(raw: unknown): Config | null {
  if (typeof raw !== "object" || raw === null) return null;
  const data = raw as Record<string, unknown>;

  if (
    data.version !== CONFIG_VERSION ||
    !isUnit(data.unit) ||
    !Array.isArray(data.cities)
  ) {
    return null;
  }

  const cities: City[] = [];
  for (const entry of data.cities) {
    const city = parseCity(entry);
    if (city) cities.push(city);
  }

  const requestedDefault =
    typeof data.defaultCityId === "number" ? data.defaultCityId : null;
  const defaultCityId =
    requestedDefault !== null && cities.some((city) => city.id === requestedDefault)
      ? requestedDefault
      : null;

  return { version: CONFIG_VERSION, unit: data.unit, defaultCityId, cities };
}

async function backupBrokenConfig(file: string): Promise<void> {
  await rename(file, `${file}.bak`).catch(() => {
    // Si no se puede respaldar, se ignora y se arranca con valores por defecto.
  });
}

export async function loadConfig(): Promise<LoadConfigResult> {
  const file = configFilePath();

  let content: string;
  try {
    content = await Bun.file(file).text();
  } catch {
    return { config: defaultConfig() };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    await backupBrokenConfig(file);
    return {
      config: defaultConfig(),
      warning: `La configuración estaba dañada; se guardó una copia en ${file}.bak y se empezó de cero.`,
    };
  }

  const config = parseConfig(raw);
  if (!config) {
    await backupBrokenConfig(file);
    return {
      config: defaultConfig(),
      warning: `La configuración tenía un formato desconocido; se guardó una copia en ${file}.bak y se empezó de cero.`,
    };
  }

  return { config };
}

export async function saveConfig(config: Config): Promise<void> {
  const file = configFilePath();
  const dir = dirname(file);
  const tmp = join(dir, `.config-${process.pid}-${Date.now()}.tmp`);

  try {
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await Bun.write(tmp, `${JSON.stringify(config, null, 2)}\n`);
    await rename(tmp, file);
  } catch {
    await unlink(tmp).catch(() => {});
    throw new Error(
      `No se pudo guardar la configuración en ${dir}. Revisa los permisos del directorio.`,
    );
  }
}

export function setUnit(config: Config, unit: Unit): Config {
  return { ...config, unit };
}
