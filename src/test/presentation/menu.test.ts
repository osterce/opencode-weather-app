import { afterEach, describe, expect, test } from "bun:test";
import type { Config } from "../../types/Config.ts";
import { renderMenu, runMenu } from "../../presentation/menu.ts";
import { stripAnsi } from "../../utils/colors.ts";
import { captureConsole } from "../helpers/captureConsole.ts";
import type { ConsoleCapture } from "../helpers/captureConsole.ts";
import { madrid, ottawa } from "../helpers/fixtures.ts";
import { createFakePrompt } from "../helpers/fakePrompt.ts";

let consoleCapture: ConsoleCapture | undefined;

afterEach(() => {
  consoleCapture?.restore();
  consoleCapture = undefined;
});

function config(overrides: Partial<Config> = {}): Config {
  return {
    version: 1,
    unit: "celsius",
    defaultCityId: ottawa.id,
    cities: [ottawa, madrid],
    ...overrides,
  };
}

describe("renderMenu", () => {
  test("muestra las opciones del menú y el contador de ciudades", () => {
    const menu = stripAnsi(renderMenu(config()));

    expect(menu).toContain("1. Clima de ciudad default");
    expect(menu).toContain("2. Clima de todas las ciudades (2)");
    expect(menu).toContain("3. Buscar y agregar ciudad");
    expect(menu).toContain("4. Eliminar ciudad");
    expect(menu).toContain("5. Establecer ciudad default");
    expect(menu).toContain("8. Ajustes (°C)");
    expect(menu).toContain("9. Salir");
    expect(menu).not.toContain("6.");
    expect(menu).not.toContain("7.");
  });

  test("muestra la ciudad default y la unidad configurada", () => {
    const menu = stripAnsi(renderMenu(config({ unit: "fahrenheit" })));

    expect(menu).toContain("★ Default: Ottawa, Ontario, Canadá");
    expect(menu).toContain("8. Ajustes (°F)");
  });

  test("omite la ciudad default si no existe", () => {
    const menu = stripAnsi(renderMenu(config({ defaultCityId: null })));

    expect(menu).not.toContain("★ Default:");
  });
});

describe("runMenu", () => {
  test("la opción 9 cierra el prompt y se despide", async () => {
    consoleCapture = captureConsole();
    const prompt = createFakePrompt({ answers: ["9"] });

    await runMenu(prompt, config());

    expect(prompt.closed).toBe(true);
    expect(consoleCapture.output()).toContain("Hasta luego. 👋");
  });

  test("las opciones inválidas se rechazan y el menú continúa", async () => {
    consoleCapture = captureConsole();
    const prompt = createFakePrompt({ answers: ["x", "9"] });

    await runMenu(prompt, config());

    expect(consoleCapture.output()).toContain(
      "Opción inválida. Elige un número del menú.",
    );
    expect(prompt.closed).toBe(true);
  });

  test("la opción 2 avisa cuando no hay ciudades", async () => {
    consoleCapture = captureConsole();
    const prompt = createFakePrompt({ answers: ["2", "9"] });

    await runMenu(prompt, config({ cities: [], defaultCityId: null }));

    expect(consoleCapture.output()).toContain(
      "No hay ciudades guardadas. Usa la opción 3 para agregar una.",
    );
    expect(prompt.waits).toBe(0);
  });

  test("la opción 3 cancela una búsqueda vacía", async () => {
    consoleCapture = captureConsole();
    const prompt = createFakePrompt({ answers: ["3", "", "9"] });

    await runMenu(prompt, config());

    expect(consoleCapture.output()).toContain("Búsqueda cancelada.");
  });

  test("la opción 4 avisa cuando no hay ciudades", async () => {
    consoleCapture = captureConsole();
    const prompt = createFakePrompt({ answers: ["4", "9"] });

    await runMenu(prompt, config({ cities: [], defaultCityId: null }));

    expect(consoleCapture.output()).toContain("No hay ciudades guardadas.");
  });

  test("la opción 5 avisa cuando no hay ciudades", async () => {
    consoleCapture = captureConsole();
    const prompt = createFakePrompt({ answers: ["5", "9"] });

    await runMenu(prompt, config({ cities: [], defaultCityId: null }));

    expect(consoleCapture.output()).toContain(
      "No hay ciudades guardadas. Agrega una con la opción 3.",
    );
  });

  test("la opción 8 abre ajustes y permite volver", async () => {
    consoleCapture = captureConsole();
    const prompt = createFakePrompt({ answers: ["8", "0", "9"] });

    await runMenu(prompt, config());

    expect(consoleCapture.output()).toContain("AJUSTES");
    expect(prompt.closed).toBe(true);
  });

  test("la opción 1 inicia la búsqueda cuando no hay ciudad default", async () => {
    consoleCapture = captureConsole();
    const prompt = createFakePrompt({
      answers: ["1", "", "9"],
      confirms: [],
    });

    await runMenu(prompt, config({ cities: [], defaultCityId: null }));

    expect(consoleCapture.output()).toContain(
      "Todavía no hay ciudad default. Vamos a buscar una.",
    );
    expect(consoleCapture.output()).toContain("Búsqueda cancelada.");
  });
});
