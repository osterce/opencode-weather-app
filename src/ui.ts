import * as readline from "node:readline/promises";
import { ansi, paint } from "./colors.ts";
import { center, FRAME_LINE, FRAME_WIDTH } from "./layout.ts";
import { formatCityLabel, unitSymbol } from "./format.ts";
import type { City, Config } from "./types.ts";

export class EOFError extends Error {
  constructor() {
    super("Fin de la entrada");
    this.name = "EOFError";
  }
}

export type Prompt = {
  ask(question: string): Promise<string>;
  confirm(question: string): Promise<boolean>;
  waitEnter(message?: string): Promise<void>;
  close(): void;
};

export function createPrompt(): Prompt {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  const lines = rl[Symbol.asyncIterator]();

  async function nextLine(question: string): Promise<string> {
    process.stdout.write(question);
    const result = await lines.next();
    if (result.done) throw new EOFError();
    return result.value.trim();
  }

  return {
    ask: nextLine,
    async confirm(question: string): Promise<boolean> {
      const answer = await nextLine(
        `${question} ${paint(ansi.dim, "(s/n)")} `,
      );
      return /^[sy]/i.test(answer);
    },
    async waitEnter(
      message = "Presiona Enter para volver al menú",
    ): Promise<void> {
      await nextLine(`\n  ${paint(ansi.dim, `${message}...`)} `);
    },
    close(): void {
      rl.close();
    },
  };
}

export function printError(message: string): void {
  console.log(`\n  ${paint(ansi.red, "✖")} ${message}`);
}

export function printSuccess(message: string): void {
  console.log(`\n  ${paint(ansi.green, "✔")} ${message}`);
}

export function printInfo(message: string): void {
  console.log(`\n  ${paint(ansi.dim, "•")} ${message}`);
}

function frame(title: string): string[] {
  return [
    paint(ansi.cyan, FRAME_LINE),
    paint(ansi.cyan, center(title, FRAME_WIDTH)),
    paint(ansi.cyan, FRAME_LINE),
  ];
}

export function renderMenu(config: Config): string {
  const defaultCity = config.cities.find(
    (city) => city.id === config.defaultCityId,
  );

  const lines = frame("WEATHER CLI");
  lines.push("  1. Clima de ciudad default");
  lines.push(
    `  2. Clima de todas las ciudades ${paint(ansi.dim, `(${config.cities.length})`)}`,
  );
  lines.push("  3. Buscar y agregar ciudad");
  lines.push("  4. Eliminar ciudad");
  lines.push("  5. Establecer ciudad default");
  lines.push(
    `  8. Ajustes ${paint(ansi.dim, `(${unitSymbol(config.unit)})`)}`,
  );
  lines.push("  9. Salir");
  lines.push(paint(ansi.cyan, FRAME_LINE));

  if (defaultCity) {
    lines.unshift(
      paint(ansi.dim, `  ★ Default: ${formatCityLabel(defaultCity)}`),
    );
  }

  return `\n${lines.join("\n")}`;
}

export function renderSettings(unit: "celsius" | "fahrenheit"): string {
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

export function renderSavedCities(config: Config): string {
  const lines = ["\n  Ciudades guardadas:"];
  config.cities.forEach((city, index) => {
    const marker = city.id === config.defaultCityId ? "★" : " ";
    lines.push(`  ${String(index + 1).padStart(2)}. ${marker} ${formatCityLabel(city)}`);
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
