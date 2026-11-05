import { describe, expect, test } from "bun:test";
import { errorMessage } from "../../utils/errors.ts";

describe("errorMessage", () => {
  test("usa el mensaje de un Error", () => {
    expect(errorMessage(new Error("fallo de red"))).toBe("fallo de red");
  });

  test("convierte valores que no son Error a texto", () => {
    expect(errorMessage("texto plano")).toBe("texto plano");
    expect(errorMessage(42)).toBe("42");
    expect(errorMessage(undefined)).toBe("undefined");
    expect(errorMessage({ code: 1 })).toBe("[object Object]");
  });
});
