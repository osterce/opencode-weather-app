import type { WeatherInfo } from "../types/Weather.ts";

type Entry = {
  label: string;
  shortLabel: string;
  icon: string;
  nightIcon?: string;
};

/**
 * Códigos WMO usados por Open-Meteo.
 * https://open-meteo.com/en/docs#weathervariables
 */
const WMO: Record<number, Entry> = {
  0: { label: "Cielo despejado", shortLabel: "Despejado", icon: "☀️", nightIcon: "🌙" },
  1: { label: "Principalmente despejado", shortLabel: "Mayormente despejado", icon: "🌤️", nightIcon: "🌙" },
  2: { label: "Parcialmente nublado", shortLabel: "Parcialmente nublado", icon: "⛅", nightIcon: "☁️" },
  3: { label: "Nublado", shortLabel: "Nublado", icon: "☁️" },
  45: { label: "Niebla", shortLabel: "Niebla", icon: "🌫️" },
  48: { label: "Niebla con escarcha", shortLabel: "Niebla", icon: "🌫️" },
  51: { label: "Llovizna ligera", shortLabel: "Llovizna", icon: "🌦️" },
  53: { label: "Llovizna moderada", shortLabel: "Llovizna", icon: "🌦️" },
  55: { label: "Llovizna intensa", shortLabel: "Llovizna", icon: "🌧️" },
  56: { label: "Llovizna helada ligera", shortLabel: "Llovizna helada", icon: "🌨️" },
  57: { label: "Llovizna helada intensa", shortLabel: "Llovizna helada", icon: "🌨️" },
  61: { label: "Lluvia ligera", shortLabel: "Lluvia", icon: "🌦️" },
  63: { label: "Lluvia moderada", shortLabel: "Lluvia", icon: "🌧️" },
  65: { label: "Lluvia intensa", shortLabel: "Lluvia", icon: "🌧️" },
  66: { label: "Lluvia helada ligera", shortLabel: "Lluvia helada", icon: "🌨️" },
  67: { label: "Lluvia helada intensa", shortLabel: "Lluvia helada", icon: "🌨️" },
  71: { label: "Nieve ligera", shortLabel: "Nieve", icon: "🌨️" },
  73: { label: "Nieve moderada", shortLabel: "Nieve", icon: "🌨️" },
  75: { label: "Nieve intensa", shortLabel: "Nieve", icon: "❄️" },
  77: { label: "Granos de nieve", shortLabel: "Nieve", icon: "❄️" },
  80: { label: "Chubascos ligeros", shortLabel: "Chubascos", icon: "🌦️" },
  81: { label: "Chubascos moderados", shortLabel: "Chubascos", icon: "🌧️" },
  82: { label: "Chubascos violentos", shortLabel: "Chubascos", icon: "⛈️" },
  85: { label: "Chubascos de nieve ligeros", shortLabel: "Chubascos de nieve", icon: "🌨️" },
  86: { label: "Chubascos de nieve intensos", shortLabel: "Chubascos de nieve", icon: "🌨️" },
  95: { label: "Tormenta", shortLabel: "Tormenta", icon: "⛈️" },
  96: { label: "Tormenta con granizo ligero", shortLabel: "Tormenta", icon: "⛈️" },
  99: { label: "Tormenta con granizo intenso", shortLabel: "Tormenta", icon: "⛈️" },
};

export const KNOWN_WEATHER_CODES: ReadonlyArray<number> = Object.keys(WMO).map(Number);

export function getWeatherInfo(code: number, isDay: number = 1): WeatherInfo {
  const entry = WMO[code];
  if (!entry) {
    return {
      label: "Condición desconocida",
      shortLabel: "Desconocido",
      icon: "❓",
    };
  }
  const icon = isDay === 0 && entry.nightIcon ? entry.nightIcon : entry.icon;
  return { label: entry.label, shortLabel: entry.shortLabel, icon };
}
