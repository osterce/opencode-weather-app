import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { mkdir, rename, unlink } from "node:fs/promises";
import type { City, Config, Unit } from "./types.ts";

export function configFilePath(): string {
  const override = process.env.WEATHER_CLI_CONFIG;
  if (override) return override;

  const base = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(base, "weather-cli", "config.json");
}

export function defaultConfig(): Config {
  return { version: 1, unit: "celsius", defaultCityId: null, cities: [] };
}

export type LoadConfigResult = {
  config: Config;
  warning?: string;
};

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

  if (data.version !== 1 || !isUnit(data.unit) || !Array.isArray(data.cities)) {
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

  return { version: 1, unit: data.unit, defaultCityId, cities };
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
