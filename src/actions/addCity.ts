import { searchCities } from "../api/geocoding.ts";
import { askIndex } from "../presentation/input.ts";
import type { Prompt } from "../presentation/input.ts";
import {
  printError,
  printInfo,
  printSuccess,
  renderSearchResults,
} from "../presentation/output.ts";
import {
  addCityToConfig,
  setDefaultCityInConfig,
} from "../storage/citiesStorage.ts";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";
import { errorMessage } from "../utils/errors.ts";
import { formatCityLabel } from "../utils/format.ts";
import { trySave } from "./helpers.ts";

export async function addCity(
  prompt: Prompt,
  config: Config,
  makeDefault = false,
): Promise<Config> {
  const query = await prompt.ask("  Busca una ciudad (ej. Madrid): ");
  if (!query) {
    printInfo("Búsqueda cancelada.");
    return config;
  }

  let results: City[];
  try {
    results = await searchCities(query);
  } catch (error) {
    printError(errorMessage(error));
    return config;
  }

  if (results.length === 0) {
    printInfo(`No se encontró "${query}". Prueba con otro nombre.`);
    return config;
  }

  let selected: City | null;
  if (results.length === 1) {
    selected = results[0] ?? null;
  } else {
    console.log(renderSearchResults(results));
    const index = await askIndex(prompt, results.length, "Elige una ciudad");
    selected = index === null ? null : (results[index - 1] ?? null);
  }

  if (!selected) {
    printInfo("Búsqueda cancelada.");
    return config;
  }

  const existing = config.cities.find((city) => city.id === selected.id);
  if (existing) {
    printInfo(`"${formatCityLabel(existing)}" ya está guardada.`);
    if (makeDefault || config.defaultCityId === null) {
      const yes = await prompt.confirm("  ¿Establecerla como ciudad default?");
      if (yes) {
        const next = await trySave(
          setDefaultCityInConfig(config, existing.id),
          config,
        );
        if (next !== config) {
          printSuccess(`Ciudad default: ${formatCityLabel(existing)}`);
        }
        return next;
      }
    }
    return config;
  }

  const saved = await trySave(addCityToConfig(config, selected), config);
  if (saved === config) return config;

  printSuccess(`Guardada: ${formatCityLabel(selected)}`);

  if (makeDefault || saved.defaultCityId === null) {
    const yes = await prompt.confirm("  ¿Establecerla como ciudad default?");
    if (yes) {
      const next = await trySave(
        setDefaultCityInConfig(saved, selected.id),
        saved,
      );
      if (next !== saved) {
        printSuccess(`Ciudad default: ${formatCityLabel(selected)}`);
      }
      return next;
    }
  }

  return saved;
}
