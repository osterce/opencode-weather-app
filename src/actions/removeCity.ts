import { askIndex } from "../presentation/input.ts";
import type { Prompt } from "../presentation/input.ts";
import {
  printInfo,
  printSuccess,
  renderSavedCities,
} from "../presentation/output.ts";
import { removeCityFromConfig } from "../storage/citiesStorage.ts";
import type { Config } from "../types/Config.ts";
import { formatCityLabel } from "../utils/format.ts";
import { trySave } from "./helpers.ts";
import { listCities } from "./listCities.ts";

export async function removeCity(
  prompt: Prompt,
  config: Config,
): Promise<Config> {
  if (config.cities.length === 0) {
    printInfo("No hay ciudades guardadas.");
    return config;
  }

  console.log(renderSavedCities(listCities(config)));
  const index = await askIndex(
    prompt,
    config.cities.length,
    "¿Qué ciudad quieres eliminar?",
  );
  if (index === null) return config;

  const city = config.cities[index - 1];
  if (!city) return config;

  const confirmed = await prompt.confirm(
    `  ¿Eliminar "${formatCityLabel(city)}"?`,
  );
  if (!confirmed) {
    printInfo("Cancelado.");
    return config;
  }

  const next = await trySave(removeCityFromConfig(config, city.id), config);
  if (next === config) return config;

  printSuccess(`Eliminada: ${formatCityLabel(city)}`);
  if (config.defaultCityId === city.id) {
    printInfo("Era la ciudad default; ahora no hay default. Usa la opción 5.");
  }
  return next;
}
