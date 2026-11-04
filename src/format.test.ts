import { describe, expect, test } from "bun:test";
import { stripAnsi } from "./colors.ts";
import {
  formatCityLabel,
  formatCityTable,
  formatTemperature,
  formatWeatherCard,
  toDisplayTemperature,
} from "./format.ts";
import type { City, WeatherData } from "./types.ts";

const city: City = {
  id: 1,
  name: "Ottawa",
  admin1: "Ontario",
  country: "Canadá",
  latitude: 45.41117,
  longitude: -75.69812,
};

const data: WeatherData = {
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
  },
};

describe("temperaturas", () => {
  test("convierte °C a °F", () => {
    expect(toDisplayTemperature(0, "fahrenheit")).toBe(32);
    expect(toDisplayTemperature(100, "fahrenheit")).toBe(212);
    expect(toDisplayTemperature(17.6, "fahrenheit")).toBeCloseTo(63.68, 2);
  });

  test("no convierte cuando la unidad es celsius", () => {
    expect(toDisplayTemperature(17.6, "celsius")).toBe(17.6);
  });

  test("formatea con coma decimal y símbolo de unidad", () => {
    expect(formatTemperature(17.6, "celsius")).toBe("17,6 °C");
    expect(formatTemperature(0, "fahrenheit")).toBe("32,0 °F");
  });
});

describe("etiquetas de ciudad", () => {
  test("incluye nombre, región y país", () => {
    expect(formatCityLabel(city)).toBe("Ottawa, Ontario, Canadá");
  });

  test("omite la región cuando no existe", () => {
    expect(formatCityLabel({ ...city, admin1: undefined })).toBe(
      "Ottawa, Canadá",
    );
  });
});

describe("tarjetas", () => {
  test("la tarjeta del clima incluye los datos principales", () => {
    const card = stripAnsi(formatWeatherCard(city, data, "celsius"));

    expect(card).toContain("Ottawa, Ontario, Canadá");
    expect(card).toContain("Parcialmente nublado");
    expect(card).toContain("17,6 °C");
    expect(card).toContain("21,4 °C / 10,9 °C");
    expect(card).toContain("71 %");
    expect(card).toContain("7,2 km/h");
    expect(card).toContain("17:45");
  });

  test("la tarjeta respeta la unidad configurada", () => {
    const card = stripAnsi(formatWeatherCard(city, data, "fahrenheit"));
    expect(card).toContain("63,7 °F");
  });

  test("la tabla marca la ciudad default y muestra errores por ciudad", () => {
    const table = stripAnsi(
      formatCityTable(
        [
          { city, data, error: null },
          {
            city: { ...city, id: 2, name: "Madrid", admin1: undefined },
            data: null,
            error: "Tiempo de espera agotado",
          },
        ],
        1,
        "celsius",
      ),
    );

    expect(table).toContain("CLIMA DE TODAS LAS CIUDADES (2)");
    expect(table).toContain("★");
    expect(table).toContain("17,6 °C");
    expect(table).toContain("✖ sin datos");
    expect(table).toContain("Tiempo de espera agotado");
  });
});
