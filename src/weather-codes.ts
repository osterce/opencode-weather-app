export type WeatherInfo = {
  label: string;
  icon: string;
};

type Entry = {
  label: string;
  icon: string;
  nightIcon?: string;
};

/**
 * Códigos WMO usados por Open-Meteo.
 * https://open-meteo.com/en/docs#weathervariables
 */
const WMO: Record<number, Entry> = {
  0: { label: "Cielo despejado", icon: "☀️", nightIcon: "🌙" },
  1: { label: "Principalmente despejado", icon: "🌤️", nightIcon: "🌙" },
  2: { label: "Parcialmente nublado", icon: "⛅", nightIcon: "☁️" },
  3: { label: "Nublado", icon: "☁️" },
  45: { label: "Niebla", icon: "🌫️" },
  48: { label: "Niebla con escarcha", icon: "🌫️" },
  51: { label: "Llovizna ligera", icon: "🌦️" },
  53: { label: "Llovizna moderada", icon: "🌦️" },
  55: { label: "Llovizna intensa", icon: "🌧️" },
  56: { label: "Llovizna helada ligera", icon: "🌨️" },
  57: { label: "Llovizna helada intensa", icon: "🌨️" },
  61: { label: "Lluvia ligera", icon: "🌦️" },
  63: { label: "Lluvia moderada", icon: "🌧️" },
  65: { label: "Lluvia intensa", icon: "🌧️" },
  66: { label: "Lluvia helada ligera", icon: "🌨️" },
  67: { label: "Lluvia helada intensa", icon: "🌨️" },
  71: { label: "Nieve ligera", icon: "🌨️" },
  73: { label: "Nieve moderada", icon: "🌨️" },
  75: { label: "Nieve intensa", icon: "❄️" },
  77: { label: "Granos de nieve", icon: "❄️" },
  80: { label: "Chubascos ligeros", icon: "🌦️" },
  81: { label: "Chubascos moderados", icon: "🌧️" },
  82: { label: "Chubascos violentos", icon: "⛈️" },
  85: { label: "Chubascos de nieve ligeros", icon: "🌨️" },
  86: { label: "Chubascos de nieve intensos", icon: "🌨️" },
  95: { label: "Tormenta", icon: "⛈️" },
  96: { label: "Tormenta con granizo ligero", icon: "⛈️" },
  99: { label: "Tormenta con granizo intenso", icon: "⛈️" },
};

export const KNOWN_WEATHER_CODES: ReadonlyArray<number> = Object.keys(WMO).map(Number);

export function getWeatherInfo(code: number, isDay: number = 1): WeatherInfo {
  const entry = WMO[code];
  if (!entry) {
    return { label: "Condición desconocida", icon: "❓" };
  }
  const icon = isDay === 0 && entry.nightIcon ? entry.nightIcon : entry.icon;
  return { label: entry.label, icon };
}
