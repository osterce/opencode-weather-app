import { askIndex } from "../presentation/input.ts";
import type { Prompt } from "../presentation/input.ts";
import {
  printInfo,
  printSuccess,
  renderSavedCities,
} from "../presentation/output.ts";
import { setDefaultCityInConfig } from "../storage/citiesStorage.ts";
import type { Config } from "../types/Config.ts";
import { formatCityLabel } from "../utils/format.ts";
import { trySave } from "./helpers.ts";
import { listCities } from "./listCities.ts";

export async function setDefaultCity(
  prompt: Prompt,
  config: Config,
): Promise<Config> {
  if (config.cities.length === 0) {
    printInfo("No hay ciudades guardadas. Agrega una con la opción 3.");
    return config;
  }

  console.log(renderSavedCities(listCities(config)));
  const index = await askIndex(
    prompt,
    config.cities.length,
    "¿Cuál será la ciudad default?",
  );
  if (index === null) return config;

  const city = config.cities[index - 1];
  if (!city) return config;

  if (city.id === config.defaultCityId) {
    printInfo(`"${formatCityLabel(city)}" ya es la ciudad default.`);
    return config;
  }

  const next = await trySave(setDefaultCityInConfig(config, city.id), config);
  if (next !== config) {
    printSuccess(`Ciudad default: ${formatCityLabel(city)}`);
  }
  return next;
}
