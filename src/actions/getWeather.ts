import { fetchWeather } from "../api/weather.ts";
import type { Prompt } from "../presentation/input.ts";
import { printError, printInfo } from "../presentation/output.ts";
import { findDefaultCity } from "../storage/citiesStorage.ts";
import type { Config } from "../types/Config.ts";
import type { CityRow } from "../types/Weather.ts";
import { errorMessage } from "../utils/errors.ts";
import {
  formatCityTable,
  formatForecastTable,
  formatWeatherCard,
} from "../utils/format.ts";
import { addCity } from "./addCity.ts";

export async function showDefaultWeather(
  prompt: Prompt,
  config: Config,
): Promise<Config> {
  let current = config;
  let city = findDefaultCity(current);

  if (!city) {
    if (current.cities.length === 0) {
      printInfo("Todavía no hay ciudad default. Vamos a buscar una.");
      current = await addCity(prompt, current, true);
      city = findDefaultCity(current);
      if (!city) return current;
    } else {
      printInfo("No hay ciudad default. Usa la opción 5 para elegir una.");
      return current;
    }
  }

  try {
    const data = await fetchWeather(city);
    console.log(formatWeatherCard(city, data, current.unit));
    console.log(formatForecastTable(data.daily, current.unit));
  } catch (error) {
    printError(errorMessage(error));
    return current;
  }

  await prompt.waitEnter();
  return current;
}

export async function showAllWeather(
  prompt: Prompt,
  config: Config,
): Promise<void> {
  if (config.cities.length === 0) {
    printInfo("No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }

  const results = await Promise.allSettled(
    config.cities.map((city) => fetchWeather(city)),
  );

  const rows: CityRow[] = config.cities.map((city, index) => {
    const result = results[index];
    if (result && result.status === "fulfilled") {
      return { city, data: result.value, error: null };
    }
    return { city, data: null, error: errorMessage(result?.reason) };
  });

  console.log(formatCityTable(rows, config.defaultCityId, config.unit));
  await prompt.waitEnter();
}
