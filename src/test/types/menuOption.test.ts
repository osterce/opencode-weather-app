import { describe, expect, test } from "bun:test";
import { MENU_OPTIONS, isMenuOption } from "../../types/MenuOption.ts";

describe("isMenuOption", () => {
  test("acepta las opciones del menú", () => {
    for (const option of MENU_OPTIONS) {
      expect(isMenuOption(option)).toBe(true);
    }
  });

  test("rechaza opciones libres, vacías o con espacios", () => {
    expect(isMenuOption("0")).toBe(false);
    expect(isMenuOption("6")).toBe(false);
    expect(isMenuOption("7")).toBe(false);
    expect(isMenuOption("")).toBe(false);
    expect(isMenuOption(" 1")).toBe(false);
    expect(isMenuOption("1 ")).toBe(false);
    expect(isMenuOption("10")).toBe(false);
  });
});
