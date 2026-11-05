import type { City, SavedCityEntry } from "../types/City.ts";
import type { Unit } from "../types/Config.ts";
import { ansi, paint } from "../utils/colors.ts";
import { FRAME_LINE } from "../utils/constants.ts";
import { formatCityLabel, unitSymbol } from "../utils/format.ts";
import { frame } from "../utils/layout.ts";

export function printError(message: string): void {
  console.log(`\n  ${paint(ansi.red, "✖")} ${message}`);
}

export function printSuccess(message: string): void {
  console.log(`\n  ${paint(ansi.green, "✔")} ${message}`);
}

export function printInfo(message: string): void {
  console.log(`\n  ${paint(ansi.dim, "•")} ${message}`);
}

export function printFarewell(extraBlankLine = false): void {
  console.log(`${extraBlankLine ? "\n" : ""}\n  Hasta luego. 👋`);
}

export function renderSettings(unit: Unit): string {
  const celsiusMark = unit === "celsius" ? paint(ansi.green, "  ← actual") : "";
  const fahrenheitMark =
    unit === "fahrenheit" ? paint(ansi.green, "  ← actual") : "";

  const lines = frame("AJUSTES");
  lines.push(`  1. Usar °C${celsiusMark}`);
  lines.push(`  2. Usar °F${fahrenheitMark}`);
  lines.push("  0. Volver");
  lines.push(paint(ansi.cyan, FRAME_LINE));

  return `\n${lines.join("\n")}`;
}

export function renderSavedCities(entries: SavedCityEntry[]): string {
  const lines = ["\n  Ciudades guardadas:"];
  entries.forEach(({ index, city, isDefault }) => {
    const marker = isDefault ? "★" : " ";
    lines.push(
      `  ${String(index).padStart(2)}. ${marker} ${formatCityLabel(city)}`,
    );
  });
  return lines.join("\n");
}

export function renderSearchResults(cities: City[]): string {
  const lines = ["\n  Resultados:"];
  cities.forEach((city, index) => {
    lines.push(`  ${String(index + 1).padStart(2)}. ${formatCityLabel(city)}`);
  });
  return lines.join("\n");
}
