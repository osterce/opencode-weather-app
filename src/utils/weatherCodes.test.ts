import { describe, expect, test } from "bun:test";
import { getWeatherInfo, KNOWN_WEATHER_CODES } from "./weatherCodes.ts";

describe("getWeatherInfo", () => {
  test("todos los códigos conocidos tienen etiqueta e icono", () => {
    for (const code of KNOWN_WEATHER_CODES) {
      const info = getWeatherInfo(code);
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.shortLabel.length).toBeGreaterThan(0);
      expect(info.icon.length).toBeGreaterThan(0);
    }
  });

  test("usa el icono nocturno cuando is_day es 0", () => {
    expect(getWeatherInfo(0, 0).icon).toBe("🌙");
    expect(getWeatherInfo(0, 1).icon).toBe("☀️");
    expect(getWeatherInfo(1, 0).icon).toBe("🌙");
  });

  test("devuelve un fallback para códigos desconocidos", () => {
    expect(getWeatherInfo(1234)).toEqual({
      label: "Condición desconocida",
      shortLabel: "Desconocido",
      icon: "❓",
    });
  });
});
