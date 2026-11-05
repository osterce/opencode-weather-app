import { afterEach, describe, expect, test } from "bun:test";
import { WeatherApiError, fetchJson } from "../../api/client.ts";
import { jsonResponse } from "../helpers/fixtures.ts";
import { mockFetch } from "../helpers/mockFetch.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("fetchJson", () => {
  test("devuelve el JSON de una respuesta exitosa", async () => {
    mockFetch(() => jsonResponse({ ok: true }));

    expect(await fetchJson("https://example.com")).toEqual({ ok: true });
  });

  test("lanza WeatherApiError si la respuesta HTTP no es exitosa", async () => {
    mockFetch(() => new Response("", { status: 503 }));

    const error = fetchJson("https://example.com");

    await expect(error).rejects.toBeInstanceOf(WeatherApiError);
    await expect(error).rejects.toThrow(
      "El servicio respondió con un error (HTTP 503).",
    );
  });

  test("lanza WeatherApiError si el cuerpo no es JSON", async () => {
    mockFetch(() => new Response("no es json", { status: 200 }));

    await expect(fetchJson("https://example.com")).rejects.toThrow(
      "El servicio devolvió una respuesta inválida.",
    );
  });

  test("lanza WeatherApiError si no se puede conectar", async () => {
    mockFetch(() => {
      throw new Error("network down");
    });

    await expect(fetchJson("https://example.com")).rejects.toThrow(
      "No se pudo conectar con el servicio. Revisa tu conexión a internet.",
    );
  });

  test("traduce los errores de timeout y abort", async () => {
    for (const name of ["TimeoutError", "AbortError"]) {
      mockFetch(() => {
        const error = new Error("timeout");
        error.name = name;
        throw error;
      });

      await expect(fetchJson("https://example.com")).rejects.toThrow(
        "El servicio tardó demasiado en responder. Inténtalo de nuevo.",
      );
    }
  });
});
