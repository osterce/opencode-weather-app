const TIMEOUT_MS = 10_000;

export class WeatherApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherApiError";
  }
}

export async function fetchJson(url: string): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new WeatherApiError(
        "El servicio tardó demasiado en responder. Inténtalo de nuevo.",
      );
    }
    throw new WeatherApiError(
      "No se pudo conectar con el servicio. Revisa tu conexión a internet.",
    );
  }

  if (!response.ok) {
    throw new WeatherApiError(
      `El servicio respondió con un error (HTTP ${response.status}).`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new WeatherApiError("El servicio devolvió una respuesta inválida.");
  }
}
