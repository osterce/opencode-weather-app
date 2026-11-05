import type { City } from "../types/City.ts";
import type { Unit } from "../types/Config.ts";
import type {
  CityRow,
  DailyWeather,
  ForecastDay,
  WeatherData,
} from "../types/Weather.ts";
import { ansi, paint } from "./colors.ts";
import { FORECAST_LINE, FRAME_LINE } from "./constants.ts";
import { getWeatherInfo } from "./weatherCodes.ts";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

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

export function formatTemperatureRangeCompact(
  max: number,
  min: number,
  unit: Unit,
): string {
  const symbol = unitSymbol(unit);
  const maxValue = oneDecimal.format(toDisplayTemperature(max, unit));
  const minValue = oneDecimal.format(toDisplayTemperature(min, unit));
  return `${maxValue} / ${minValue} ${symbol}`;
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${noDecimals.format(value)} %`;
}

export function formatCityLabel(city: City): string {
  return [city.name, city.admin1, city.country]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

export function formatHumidity(value: number): string {
  return formatPercent(value);
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

export function dayLabel(date: string, index: number): string {
  if (index === 0) return "Hoy";
  if (index === 1) return "Mañana";

  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;

  const weekday = WEEKDAYS[parsed.getUTCDay()] ?? "";
  return `${weekday} ${parsed.getUTCDate()}`;
}

export function toForecastDays(
  daily: DailyWeather,
  days: number = 7,
): ForecastDay[] {
  const forecast: ForecastDay[] = [];
  const total = Math.min(days, daily.time.length);

  for (let index = 0; index < total; index += 1) {
    const date = daily.time[index];
    const code = daily.weather_code[index];
    const max = daily.temperature_2m_max[index];
    const min = daily.temperature_2m_min[index];

    if (
      date === undefined ||
      code === undefined ||
      max === undefined ||
      min === undefined
    ) {
      continue;
    }

    forecast.push({
      date,
      code,
      max,
      min,
      precipitationProbability:
        daily.precipitation_probability_max[index] ?? null,
    });
  }

  return forecast;
}

export function formatForecastTable(
  daily: DailyWeather,
  unit: Unit,
  days: number = 7,
): string {
  const forecast = toForecastDays(daily, days);
  const lines = [
    paint(ansi.cyan, FORECAST_LINE),
    `  ${paint(ansi.bold, `PRONÓSTICO ${forecast.length} DÍAS`)}`,
    paint(ansi.cyan, FORECAST_LINE),
  ];

  if (forecast.length === 0) {
    lines.push("  Sin pronóstico disponible.");
    lines.push(paint(ansi.cyan, FORECAST_LINE));
    return `\n${lines.join("\n")}`;
  }

  lines.push(
    `  ${"Día".padEnd(8)}${"Clima".padEnd(24)}${"Máx / Mín".padEnd(16)}Lluvia`,
  );

  forecast.forEach((day, index) => {
    const info = getWeatherInfo(day.code, 1);
    const label = info.shortLabel.slice(0, 22).padEnd(24);
    const dayColumn = dayLabel(day.date, index).padEnd(8);
    const temperatures = formatTemperatureRangeCompact(
      day.max,
      day.min,
      unit,
    ).padEnd(16);

    lines.push(
      `  ${dayColumn}${info.icon} ${label}${temperatures}${formatPercent(day.precipitationProbability)}`,
    );
  });

  lines.push(paint(ansi.cyan, FORECAST_LINE));
  return `\n${lines.join("\n")}`;
}
