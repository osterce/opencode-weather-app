import { afterEach, describe, expect, test } from "bun:test";
import type { City } from "../../types/City.ts";
import { WeatherApiError } from "../../api/client.ts";
import { searchCities } from "../../api/geocoding.ts";
import { fetchWeather } from "../../api/weather.ts";

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string) => Response): void {
  globalThis.fetch = ((input: unknown) =>
    Promise.resolve(handler(String(input)))) as unknown as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const city: City = {
  id: 1,
  name: "Ottawa",
  country: "Canadá",
  latitude: 45.41117,
  longitude: -75.69812,
};

const forecastPayload = {
  current: {
    time: "2026-11-04T17:45",
    temperature_2m: 17.6,
    relative_humidity_2m: 71,
    apparent_temperature: 17.3,
    is_day: 0,
    precipitation: 0,
    weather_code: 2,
    wind_speed_10m: 7.2,
  },
  daily: {
    time: ["2026-11-04"],
    weather_code: [2],
    temperature_2m_max: [21.4],
    temperature_2m_min: [10.9],
    precipitation_probability_max: [35],
  },
};

describe("searchCities", () => {
  test("mapea los resultados del geocoding", async () => {
    mockFetch(
      () =>
        new Response(
          JSON.stringify({
            results: [
              {
                id: 6094817,
                name: "Ottawa",
                admin1: "Ontario",
                country: "Canadá",
                latitude: 45.41117,
                longitude: -75.69812,
              },
            ],
          }),
          { status: 200 },
        ),
    );

    const cities = await searchCities("Ottawa");

    expect(cities).toEqual([
      {
        id: 6094817,
        name: "Ottawa",
        admin1: "Ontario",
        country: "Canadá",
        latitude: 45.41117,
        longitude: -75.69812,
      },
    ]);
  });

  test("devuelve una lista vacía cuando no hay resultados", async () => {
    mockFetch(() => new Response(JSON.stringify({}), { status: 200 }));

    expect(await searchCities("zzzz")).toEqual([]);
  });

  test("lanza WeatherApiError si la respuesta no es exitosa", async () => {
    mockFetch(() => new Response("", { status: 500 }));

    expect(searchCities("Ottawa")).rejects.toBeInstanceOf(WeatherApiError);
  });

  test("lanza WeatherApiError si el JSON es inválido", async () => {
    mockFetch(() => new Response("no es json", { status: 200 }));

    expect(searchCities("Ottawa")).rejects.toBeInstanceOf(WeatherApiError);
  });
});

describe("fetchWeather", () => {
  test("mapea los datos actuales y diarios", async () => {
    mockFetch(
      () => new Response(JSON.stringify(forecastPayload), { status: 200 }),
    );

    const data = await fetchWeather(city);

    expect(data.current.temperature_2m).toBe(17.6);
    expect(data.current.weather_code).toBe(2);
    expect(data.daily.temperature_2m_max[0]).toBe(21.4);
    expect(data.daily.temperature_2m_min[0]).toBe(10.9);
    expect(data.daily.precipitation_probability_max[0]).toBe(35);
  });

  test("acepta probabilidades nulas y rellena las que faltan", async () => {
    mockFetch(
      () =>
        new Response(
          JSON.stringify({
            ...forecastPayload,
            daily: {
              ...forecastPayload.daily,
              precipitation_probability_max: [null],
            },
          }),
          { status: 200 },
        ),
    );

    const data = await fetchWeather(city);
    expect(data.daily.precipitation_probability_max).toEqual([null]);
  });

  test("rellena con null si falta el array de probabilidad", async () => {
    const { precipitation_probability_max, ...dailyWithoutProbability } =
      forecastPayload.daily;

    mockFetch(
      () =>
        new Response(
          JSON.stringify({
            ...forecastPayload,
            daily: dailyWithoutProbability,
          }),
          { status: 200 },
        ),
    );

    const data = await fetchWeather(city);
    expect(data.daily.precipitation_probability_max).toEqual([null]);
  });

  test("lanza WeatherApiError si los arrays diarios no coinciden", async () => {
    mockFetch(
      () =>
        new Response(
          JSON.stringify({
            ...forecastPayload,
            daily: {
              ...forecastPayload.daily,
              temperature_2m_max: [21.4, 18.1],
            },
          }),
          { status: 200 },
        ),
    );

    expect(fetchWeather(city)).rejects.toBeInstanceOf(WeatherApiError);
  });

  test("lanza WeatherApiError si faltan datos", async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ current: {}, daily: {} }), {
          status: 200,
        }),
    );

    expect(fetchWeather(city)).rejects.toBeInstanceOf(WeatherApiError);
  });
});
