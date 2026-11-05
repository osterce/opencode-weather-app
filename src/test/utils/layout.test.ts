import { describe, expect, test } from "bun:test";
import { stripAnsi } from "../../utils/colors.ts";
import { FRAME_LINE, FRAME_WIDTH } from "../../utils/constants.ts";
import { center, frame } from "../../utils/layout.ts";

describe("center", () => {
  test("agrega espacios a la izquierda para centrar", () => {
    expect(center("abc", 7)).toBe("  abc");
    expect(center("WEATHER CLI", FRAME_WIDTH)).toBe(
      `${" ".repeat(14)}WEATHER CLI`,
    );
  });

  test("devuelve el texto tal cual si ya ocupa el ancho o más", () => {
    expect(center("12345", 5)).toBe("12345");
    expect(center("123456", 5)).toBe("123456");
  });
});

describe("frame", () => {
  test("genera borde, título centrado y borde", () => {
    const lines = frame("WEATHER CLI").map(stripAnsi);

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(FRAME_LINE);
    expect(lines[1]).toBe(center("WEATHER CLI", FRAME_WIDTH));
    expect(lines[2]).toBe(FRAME_LINE);
  });
});
