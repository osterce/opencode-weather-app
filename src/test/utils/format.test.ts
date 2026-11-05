import { describe, expect, test } from "bun:test";
import type { City } from "../../types/City.ts";
import type { DailyWeather, WeatherData } from "../../types/Weather.ts";
import { stripAnsi } from "../../utils/colors.ts";
import {
  dayLabel,
  formatCityLabel,
  formatCityTable,
  formatForecastTable,
  formatPercent,
  formatTemperature,
  formatTemperatureRangeCompact,
  formatWeatherCard,
  toDisplayTemperature,
  toForecastDays,
} from "../../utils/format.ts";

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
    precipitation_probability_max: [35],
  },
};

const forecastDaily: DailyWeather = {
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

describe("pronóstico extendido", () => {
  test("etiqueta Hoy, Mañana y el resto con día de la semana", () => {
    expect(dayLabel("2026-11-05", 0)).toBe("Hoy");
    expect(dayLabel("2026-11-06", 1)).toBe("Mañana");
    expect(dayLabel("2026-11-07", 2)).toBe("Sáb 7");
    expect(dayLabel("2026-11-08", 3)).toBe("Dom 8");
  });

  test("devuelve la fecha tal cual si no se puede interpretar", () => {
    expect(dayLabel("fecha-invalida", 2)).toBe("fecha-invalida");
  });

  test("formatea porcentajes y valores nulos", () => {
    expect(formatPercent(35)).toBe("35 %");
    expect(formatPercent(null)).toBe("—");
  });

  test("formatea el rango compacto de temperatura", () => {
    expect(formatTemperatureRangeCompact(15.7, 2.6, "celsius")).toBe(
      "15,7 / 2,6 °C",
    );
    expect(formatTemperatureRangeCompact(15.7, 2.6, "fahrenheit")).toBe(
      "60,3 / 36,7 °F",
    );
  });

  test("mapea los días disponibles sin inventar filas", () => {
    const days = toForecastDays(forecastDaily);
    expect(days).toHaveLength(7);
    expect(days[0]?.date).toBe("2026-11-05");
    expect(days[5]?.precipitationProbability).toBeNull();

    const partial = toForecastDays(
      { ...forecastDaily, time: forecastDaily.time.slice(0, 3) },
      7,
    );
    expect(partial).toHaveLength(3);
  });

  test("la tabla incluye días, etiqueta corta, temperaturas y lluvia", () => {
    const table = stripAnsi(formatForecastTable(forecastDaily, "celsius"));

    expect(table).toContain("PRONÓSTICO 7 DÍAS");
    expect(table).toContain("Hoy");
    expect(table).toContain("Mañana");
    expect(table).toContain("Sáb 7");
    expect(table).toContain("Lluvia");
    expect(table).toContain("15,7 / 2,6 °C");
    expect(table).toContain("35 %");
    expect(table).toContain("—");
  });

  test("la tabla respeta la unidad configurada", () => {
    const table = stripAnsi(formatForecastTable(forecastDaily, "fahrenheit"));
    expect(table).toContain("60,3 / 36,7 °F");
  });

  test("muestra un aviso si no hay días", () => {
    const table = stripAnsi(
      formatForecastTable(
        {
          time: [],
          weather_code: [],
          temperature_2m_max: [],
          temperature_2m_min: [],
          precipitation_probability_max: [],
        },
        "celsius",
      ),
    );

    expect(table).toContain("Sin pronóstico disponible.");
  });
});
