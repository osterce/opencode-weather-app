import type { City } from "../../types/City.ts";
import type { WeatherData } from "../../types/Weather.ts";

export const ottawa: City = {
  id: 1,
  name: "Ottawa",
  admin1: "Ontario",
  country: "Canadá",
  latitude: 45.41117,
  longitude: -75.69812,
};

export const madrid: City = {
  id: 2,
  name: "Madrid",
  country: "España",
  latitude: 40.4168,
  longitude: -3.7038,
};

export const forecastPayload: WeatherData = {
  current: {
    time: "2026-11-05T17:45",
    temperature_2m: 17.6,
    relative_humidity_2m: 71,
    apparent_temperature: 17.3,
    is_day: 0,
    precipitation: 0,
    weather_code: 2,
    wind_speed_10m: 7.2,
  },
  daily: {
    time: [
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
    ],
    weather_code: [1, 3, 61, 61, 95, 95, 61],
    temperature_2m_max: [15.7, 16.1, 14.3, 14.2, 17.5, 15.7, 14.9],
    temperature_2m_min: [2.6, 3.1, 8, 7.2, 12.8, 12.6, 9.6],
    precipitation_probability_max: [0, 3, 35, 64, 100, null, 77],
  },
};

export function geocodingPayload(cities: City[]): { results: City[] } {
  return { results: cities };
}

export function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status });
}
