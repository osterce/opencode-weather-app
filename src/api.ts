import type {
  City,
  CurrentWeather,
  DailyWeather,
  WeatherData,
} from "./types.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 10_000;

const CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "weather_code",
  "wind_speed_10m",
].join(",");

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
].join(",");

export class WeatherApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherApiError";
  }
}

async function fetchJson(url: string): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new WeatherApiError(
        "El servicio tardó demasiado en responder. Inténtalo de nuevo.",
      );
    }
    throw new WeatherApiError(
      "No se pudo conectar con el servicio. Revisa tu conexión a internet.",
    );
  }

  if (!response.ok) {
    throw new WeatherApiError(
      `El servicio respondió con un error (HTTP ${response.status}).`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new WeatherApiError("El servicio devolvió una respuesta inválida.");
  }
}

function parseCity(raw: unknown): City | null {
  if (typeof raw !== "object" || raw === null) return null;
  const data = raw as Record<string, unknown>;

  const { id, name, country, latitude, longitude } = data;
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
    admin1: typeof data.admin1 === "string" ? data.admin1 : undefined,
  };
}

export async function searchCities(query: string, count = 5): Promise<City[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  const data = await fetchJson(url.toString());
  if (typeof data !== "object" || data === null) {
    throw new WeatherApiError("El servicio de búsqueda devolvió datos inválidos.");
  }

  const results = (data as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];

  const cities: City[] = [];
  for (const entry of results) {
    const city = parseCity(entry);
    if (city) cities.push(city);
  }
  return cities;
}

function requireNumber(data: Record<string, unknown>, key: string): number {
  const value = data[key];
  if (typeof value !== "number") {
    throw new WeatherApiError("Los datos del clima están incompletos.");
  }
  return value;
}

function requireNumberArray(
  data: Record<string, unknown>,
  key: string,
): number[] {
  const value = data[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "number")) {
    throw new WeatherApiError("Los datos del clima están incompletos.");
  }
  return value as number[];
}

function requireStringArray(
  data: Record<string, unknown>,
  key: string,
): string[] {
  const value = data[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new WeatherApiError("Los datos del clima están incompletos.");
  }
  return value as string[];
}

function parseCurrent(raw: unknown): CurrentWeather {
  if (typeof raw !== "object" || raw === null) {
    throw new WeatherApiError("Los datos actuales del clima están incompletos.");
  }
  const data = raw as Record<string, unknown>;
  const time = data.time;
  if (typeof time !== "string") {
    throw new WeatherApiError("Los datos actuales del clima están incompletos.");
  }

  return {
    time,
    temperature_2m: requireNumber(data, "temperature_2m"),
    relative_humidity_2m: requireNumber(data, "relative_humidity_2m"),
    apparent_temperature: requireNumber(data, "apparent_temperature"),
    is_day: requireNumber(data, "is_day"),
    precipitation: requireNumber(data, "precipitation"),
    weather_code: requireNumber(data, "weather_code"),
    wind_speed_10m: requireNumber(data, "wind_speed_10m"),
  };
}

function parseDaily(raw: unknown): DailyWeather {
  if (typeof raw !== "object" || raw === null) {
    throw new WeatherApiError("Los datos diarios del clima están incompletos.");
  }
  const data = raw as Record<string, unknown>;

  return {
    time: requireStringArray(data, "time"),
    weather_code: requireNumberArray(data, "weather_code"),
    temperature_2m_max: requireNumberArray(data, "temperature_2m_max"),
    temperature_2m_min: requireNumberArray(data, "temperature_2m_min"),
  };
}

export async function fetchWeather(city: City): Promise<WeatherData> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("current", CURRENT_FIELDS);
  url.searchParams.set("daily", DAILY_FIELDS);
  url.searchParams.set("timezone", "auto");

  const data = await fetchJson(url.toString());
  if (typeof data !== "object" || data === null) {
    throw new WeatherApiError("El servicio del clima devolvió datos inválidos.");
  }

  const payload = data as Record<string, unknown>;
  return {
    current: parseCurrent(payload.current),
    daily: parseDaily(payload.daily),
  };
}
