import type { City } from "../types/City.ts";
import { fetchJson, WeatherApiError } from "./client.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

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
