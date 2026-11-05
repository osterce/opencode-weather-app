import { afterEach, describe, expect, test } from "bun:test";
import { askIndex } from "../../presentation/input.ts";
import { captureConsole } from "../helpers/captureConsole.ts";
import type { ConsoleCapture } from "../helpers/captureConsole.ts";
import { createFakePrompt } from "../helpers/fakePrompt.ts";

let consoleCapture: ConsoleCapture | undefined;

afterEach(() => {
  consoleCapture?.restore();
  consoleCapture = undefined;
});

describe("askIndex", () => {
  test("devuelve el índice elegido", async () => {
    const prompt = createFakePrompt({ answers: ["3"] });

    expect(await askIndex(prompt, 5, "Elige una ciudad")).toBe(3);
    expect(prompt.asked[0]).toContain("Elige una ciudad [1-5]");
  });

  test("devuelve null al cancelar con 0 o vacío", async () => {
    const withZero = createFakePrompt({ answers: ["0"] });
    const withEmpty = createFakePrompt({ answers: [""] });

    expect(await askIndex(withZero, 5, "Elige")).toBeNull();
    expect(await askIndex(withEmpty, 5, "Elige")).toBeNull();
  });

  test("muestra un error y devuelve null para valores no numéricos", async () => {
    const prompt = createFakePrompt({ answers: ["abc"] });
    consoleCapture = captureConsole();

    expect(await askIndex(prompt, 5, "Elige")).toBeNull();
    expect(consoleCapture.output()).toContain("Opción inválida.");
  });

  test("muestra un error y devuelve null fuera de rango", async () => {
    const prompt = createFakePrompt({ answers: ["6"] });
    consoleCapture = captureConsole();

    expect(await askIndex(prompt, 5, "Elige")).toBeNull();
    expect(consoleCapture.output()).toContain("Opción inválida.");
  });

  test("acepta el límite inferior y superior", async () => {
    const first = createFakePrompt({ answers: ["1"] });
    const last = createFakePrompt({ answers: ["5"] });

    expect(await askIndex(first, 5, "Elige")).toBe(1);
    expect(await askIndex(last, 5, "Elige")).toBe(5);
  });
});
