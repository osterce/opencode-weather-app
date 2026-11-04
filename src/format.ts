import { ansi, paint } from "./colors.ts";
import { FRAME_LINE } from "./layout.ts";
import { getWeatherInfo } from "./weather-codes.ts";
import type { City, Unit, WeatherData } from "./types.ts";

const oneDecimal = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const noDecimals = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 0,
});

const twoDecimals = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function unitSymbol(unit: Unit): string {
  return unit === "celsius" ? "°C" : "°F";
}

export function toDisplayTemperature(celsius: number, unit: Unit): number {
  return unit === "celsius" ? celsius : (celsius * 9) / 5 + 32;
}

export function formatTemperature(celsius: number, unit: Unit): string {
  return `${oneDecimal.format(toDisplayTemperature(celsius, unit))} ${unitSymbol(unit)}`;
}

export function formatTemperatureRange(
  max: number,
  min: number,
  unit: Unit,
): string {
  return `${formatTemperature(max, unit)} / ${formatTemperature(min, unit)}`;
}

export function formatCityLabel(city: City): string {
  return [city.name, city.admin1, city.country]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

export function formatHumidity(value: number): string {
  return `${noDecimals.format(value)} %`;
}

export function formatWind(value: number): string {
  return `${oneDecimal.format(value)} km/h`;
}

export function formatPrecipitation(value: number): string {
  return `${twoDecimals.format(value)} mm`;
}

function row(label: string, value: string): string {
  return `  ${label.padEnd(17)}${value}`;
}

export function formatWeatherCard(
  city: City,
  data: WeatherData,
  unit: Unit,
): string {
  const { current, daily } = data;
  const info = getWeatherInfo(current.weather_code, current.is_day);
  const max = daily.temperature_2m_max[0];
  const min = daily.temperature_2m_min[0];
  const localTime = current.time.slice(11, 16) || current.time;

  const lines = [
    paint(ansi.cyan, FRAME_LINE),
    `  ${paint(ansi.bold, formatCityLabel(city))}`,
    paint(ansi.cyan, FRAME_LINE),
    `  ${info.icon}  ${paint(ansi.bold, info.label)}`,
    "",
    row("Temperatura:", formatTemperature(current.temperature_2m, unit)),
    row("Sensación:", formatTemperature(current.apparent_temperature, unit)),
    row(
      "Máx / Mín hoy:",
      max !== undefined && min !== undefined
        ? formatTemperatureRange(max, min, unit)
        : "—",
    ),
    row("Humedad:", formatHumidity(current.relative_humidity_2m)),
    row("Viento:", formatWind(current.wind_speed_10m)),
    row("Precipitación:", formatPrecipitation(current.precipitation)),
    row("Hora local:", localTime),
    paint(ansi.cyan, FRAME_LINE),
  ];

  return `\n${lines.join("\n")}`;
}

export type CityRow = {
  city: City;
  data: WeatherData | null;
  error: string | null;
};

export function formatCityTable(
  rows: CityRow[],
  defaultCityId: number | null,
  unit: Unit,
): string {
  const maxLabel = rows.reduce(
    (max, row) => Math.max(max, formatCityLabel(row.city).length),
    0,
  );

  const lines = [
    paint(ansi.cyan, FRAME_LINE),
    `  ${paint(ansi.bold, `CLIMA DE TODAS LAS CIUDADES (${rows.length})`)}`,
    paint(ansi.cyan, FRAME_LINE),
  ];

  for (const row of rows) {
    const marker = row.city.id === defaultCityId ? "★" : " ";
    const label = formatCityLabel(row.city).padEnd(maxLabel + 2);

    if (row.data) {
      const info = getWeatherInfo(
        row.data.current.weather_code,
        row.data.current.is_day,
      );
      const temp = formatTemperature(row.data.current.temperature_2m, unit);
      lines.push(`  ${marker} ${label}${info.icon}  ${temp}`);
    } else {
      lines.push(`  ${marker} ${label}${paint(ansi.red, "✖ sin datos")}`);
      if (row.error) {
        lines.push(`      ${paint(ansi.dim, row.error)}`);
      }
    }
  }

  lines.push(paint(ansi.cyan, FRAME_LINE));
  return `\n${lines.join("\n")}`;
}
