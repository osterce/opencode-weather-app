import { loadConfig, saveConfig } from "./src/config.ts";
import { fetchWeather, searchCities } from "./src/api.ts";
import { ansi, paint } from "./src/colors.ts";
import {
  formatCityLabel,
  formatCityTable,
  formatWeatherCard,
  unitSymbol,
} from "./src/format.ts";
import type { CityRow } from "./src/format.ts";
import {
  createPrompt,
  EOFError,
  printError,
  printInfo,
  printSuccess,
  renderMenu,
  renderSavedCities,
  renderSearchResults,
  renderSettings,
} from "./src/ui.ts";
import type { Prompt } from "./src/ui.ts";
import type { City, Config, Unit } from "./src/types.ts";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function findDefault(config: Config): City | undefined {
  return config.cities.find((city) => city.id === config.defaultCityId);
}

async function trySave(next: Config, current: Config): Promise<Config> {
  try {
    await saveConfig(next);
    return next;
  } catch (error) {
    printError(errorMessage(error));
    return current;
  }
}

async function askIndex(
  prompt: Prompt,
  max: number,
  label: string,
): Promise<number | null> {
  const answer = await prompt.ask(
    `  ${label} [1-${max}] ${paint(ansi.dim, "(0 para cancelar)")}: `,
  );
  if (answer === "" || answer === "0") return null;

  if (!/^\d+$/.test(answer)) {
    printError("Opción inválida.");
    return null;
  }

  const index = Number.parseInt(answer, 10);
  if (index < 1 || index > max) {
    printError("Opción inválida.");
    return null;
  }

  return index;
}

async function searchAndAdd(
  prompt: Prompt,
  config: Config,
  makeDefault: boolean,
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
          { ...config, defaultCityId: existing.id },
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

  const saved = await trySave(
    { ...config, cities: [...config.cities, selected] },
    config,
  );
  if (saved === config) return config;

  printSuccess(`Guardada: ${formatCityLabel(selected)}`);

  if (makeDefault || saved.defaultCityId === null) {
    const yes = await prompt.confirm("  ¿Establecerla como ciudad default?");
    if (yes) {
      const next = await trySave(
        { ...saved, defaultCityId: selected.id },
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

async function showDefault(prompt: Prompt, config: Config): Promise<Config> {
  let current = config;
  let city = findDefault(current);

  if (!city) {
    if (current.cities.length === 0) {
      printInfo("Todavía no hay ciudad default. Vamos a buscar una.");
      current = await searchAndAdd(prompt, current, true);
      city = findDefault(current);
      if (!city) return current;
    } else {
      printInfo("No hay ciudad default. Usa la opción 5 para elegir una.");
      return current;
    }
  }

  try {
    const data = await fetchWeather(city);
    console.log(formatWeatherCard(city, data, current.unit));
  } catch (error) {
    printError(errorMessage(error));
    return current;
  }

  await prompt.waitEnter();
  return current;
}

async function showAll(prompt: Prompt, config: Config): Promise<void> {
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

async function deleteCity(prompt: Prompt, config: Config): Promise<Config> {
  if (config.cities.length === 0) {
    printInfo("No hay ciudades guardadas.");
    return config;
  }

  console.log(renderSavedCities(config));
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

  const cities = config.cities.filter((item) => item.id !== city.id);
  const defaultCityId =
    config.defaultCityId === city.id ? null : config.defaultCityId;

  const next = await trySave({ ...config, cities, defaultCityId }, config);
  if (next === config) return config;

  printSuccess(`Eliminada: ${formatCityLabel(city)}`);
  if (config.defaultCityId === city.id) {
    printInfo("Era la ciudad default; ahora no hay default. Usa la opción 5.");
  }
  return next;
}

async function setDefault(prompt: Prompt, config: Config): Promise<Config> {
  if (config.cities.length === 0) {
    printInfo("No hay ciudades guardadas. Agrega una con la opción 3.");
    return config;
  }

  console.log(renderSavedCities(config));
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

  const next = await trySave({ ...config, defaultCityId: city.id }, config);
  if (next !== config) {
    printSuccess(`Ciudad default: ${formatCityLabel(city)}`);
  }
  return next;
}

async function settings(prompt: Prompt, config: Config): Promise<Config> {
  while (true) {
    console.log(renderSettings(config.unit));
    const answer = await prompt.ask("  Selecciona una opción: ");

    if (answer === "0" || answer === "") return config;

    if (answer !== "1" && answer !== "2") {
      printError("Opción inválida.");
      continue;
    }

    const unit: Unit = answer === "1" ? "celsius" : "fahrenheit";
    if (unit === config.unit) {
      printInfo(`Ya estás usando ${unitSymbol(unit)}.`);
      continue;
    }

    const next = await trySave({ ...config, unit }, config);
    if (next !== config) {
      printSuccess(`Unidad cambiada a ${unitSymbol(unit)}.`);
    }
    return next;
  }
}

async function main(): Promise<void> {
  const prompt = createPrompt();
  let { config, warning } = await loadConfig();
  if (warning) printError(warning);

  while (true) {
    console.log(renderMenu(config));
    const answer = await prompt.ask("  Selecciona una opción: ");

    switch (answer) {
      case "1":
        config = await showDefault(prompt, config);
        break;
      case "2":
        await showAll(prompt, config);
        break;
      case "3":
        config = await searchAndAdd(prompt, config, false);
        break;
      case "4":
        config = await deleteCity(prompt, config);
        break;
      case "5":
        config = await setDefault(prompt, config);
        break;
      case "8":
        config = await settings(prompt, config);
        break;
      case "9":
        prompt.close();
        console.log("\n  Hasta luego. 👋");
        return;
      default:
        printError("Opción inválida. Elige un número del menú.");
    }
  }
}

process.on("SIGINT", () => {
  console.log("\n\n  Hasta luego. 👋");
  process.exit(0);
});

main().catch((error: unknown) => {
  if (error instanceof EOFError) {
    console.log();
    process.exit(0);
  }
  console.error(`\n  Error inesperado: ${errorMessage(error)}`);
  process.exit(1);
});
