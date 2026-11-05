import type { City } from "../types/City.ts";
import type {
  CurrentWeather,
  DailyWeather,
  WeatherData,
} from "../types/Weather.ts";
import { fetchJson, WeatherApiError } from "./client.ts";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

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
  "precipitation_probability_max",
].join(",");

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

function parseNullableNumberArray(
  data: Record<string, unknown>,
  key: string,
  length: number,
): (number | null)[] {
  const value = data[key];
  const result: (number | null)[] = [];

  for (let index = 0; index < length; index += 1) {
    const item = Array.isArray(value) ? value[index] : undefined;
    result.push(typeof item === "number" ? item : null);
  }

  return result;
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

  const time = requireStringArray(data, "time");
  const weatherCode = requireNumberArray(data, "weather_code");
  const max = requireNumberArray(data, "temperature_2m_max");
  const min = requireNumberArray(data, "temperature_2m_min");

  if (
    weatherCode.length !== time.length ||
    max.length !== time.length ||
    min.length !== time.length
  ) {
    throw new WeatherApiError("Los datos del clima están incompletos.");
  }

  return {
    time,
    weather_code: weatherCode,
    temperature_2m_max: max,
    temperature_2m_min: min,
    precipitation_probability_max: parseNullableNumberArray(
      data,
      "precipitation_probability_max",
      time.length,
    ),
  };
}

export async function fetchWeather(city: City): Promise<WeatherData> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("current", CURRENT_FIELDS);
  url.searchParams.set("daily", DAILY_FIELDS);
  url.searchParams.set("forecast_days", "7");
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
