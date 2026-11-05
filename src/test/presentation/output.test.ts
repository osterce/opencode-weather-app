import { afterEach, describe, expect, test } from "bun:test";
import type { City, SavedCityEntry } from "../../types/City.ts";
import {
  printError,
  printFarewell,
  printInfo,
  printSuccess,
  renderSavedCities,
  renderSearchResults,
  renderSettings,
} from "../../presentation/output.ts";
import { stripAnsi } from "../../utils/colors.ts";
import { captureConsole } from "../helpers/captureConsole.ts";
import type { ConsoleCapture } from "../helpers/captureConsole.ts";

const city: City = {
  id: 1,
  name: "Ottawa",
  admin1: "Ontario",
  country: "Canadá",
  latitude: 45.41117,
  longitude: -75.69812,
};

let consoleCapture: ConsoleCapture | undefined;

afterEach(() => {
  consoleCapture?.restore();
  consoleCapture = undefined;
});

describe("mensajes de consola", () => {
  test("imprime error, éxito, información y despedida", () => {
    consoleCapture = captureConsole();

    printError("algo falló");
    printSuccess("guardado");
    printInfo("nota");
    printFarewell();

    expect(consoleCapture.output()).toContain("✖ algo falló");
    expect(consoleCapture.output()).toContain("✔ guardado");
    expect(consoleCapture.output()).toContain("• nota");
    expect(consoleCapture.output()).toContain("Hasta luego. 👋");
  });

  test("la despedida puede añadir una línea en blanco", () => {
    consoleCapture = captureConsole();

    printFarewell(true);

    expect(consoleCapture.logs[0]).toStartWith("\n");
  });
});

describe("renderSettings", () => {
  test("marca la unidad activa", () => {
    const settings = stripAnsi(renderSettings("celsius"));

    expect(settings).toContain("1. Usar °C  ← actual");
    expect(settings).not.toContain("2. Usar °F  ← actual");
  });

  test("marca °F cuando está activa", () => {
    const settings = stripAnsi(renderSettings("fahrenheit"));

    expect(settings).toContain("2. Usar °F  ← actual");
    expect(settings).not.toContain("1. Usar °C  ← actual");
  });
});

describe("listas renderizadas", () => {
  test("renderSavedCities numera, alinea y marca la default", () => {
    const entries: SavedCityEntry[] = [
      { index: 1, city, isDefault: true },
      {
        index: 2,
        city: {
          ...city,
          id: 2,
          name: "Madrid",
          admin1: undefined,
          country: "España",
        },
        isDefault: false,
      },
    ];

    const rendered = renderSavedCities(entries);

    expect(rendered).toContain("Ciudades guardadas:");
    expect(rendered).toContain("   1. ★ Ottawa, Ontario, Canadá");
    expect(rendered).toContain("   2.   Madrid, España");
  });

  test("renderSearchResults numera los resultados", () => {
    const rendered = renderSearchResults([
      city,
      {
        ...city,
        id: 2,
        name: "Madrid",
        admin1: undefined,
        country: "España",
      },
    ]);

    expect(rendered).toContain("Resultados:");
    expect(rendered).toContain("   1. Ottawa, Ontario, Canadá");
    expect(rendered).toContain("   2. Madrid, España");
  });
});
