import { addCity } from "../actions/addCity.ts";
import { showAllWeather, showDefaultWeather } from "../actions/getWeather.ts";
import { removeCity } from "../actions/removeCity.ts";
import { setDefaultCity } from "../actions/setDefaultCity.ts";
import { changeSettings } from "../actions/settings.ts";
import type { Config } from "../types/Config.ts";
import { isMenuOption } from "../types/MenuOption.ts";
import { ansi, paint } from "../utils/colors.ts";
import { FRAME_LINE } from "../utils/constants.ts";
import { formatCityLabel, unitSymbol } from "../utils/format.ts";
import { frame } from "../utils/layout.ts";
import type { Prompt } from "./input.ts";
import { printError, printFarewell } from "./output.ts";

export function renderMenu(config: Config): string {
  const defaultCity = config.cities.find(
    (city) => city.id === config.defaultCityId,
  );

  const lines = frame("WEATHER CLI");
  lines.push("  1. Clima de ciudad default");
  lines.push(
    `  2. Clima de todas las ciudades ${paint(ansi.dim, `(${config.cities.length})`)}`,
  );
  lines.push("  3. Buscar y agregar ciudad");
  lines.push("  4. Eliminar ciudad");
  lines.push("  5. Establecer ciudad default");
  lines.push(
    `  8. Ajustes ${paint(ansi.dim, `(${unitSymbol(config.unit)})`)}`,
  );
  lines.push("  9. Salir");
  lines.push(paint(ansi.cyan, FRAME_LINE));

  if (defaultCity) {
    lines.unshift(
      paint(ansi.dim, `  ★ Default: ${formatCityLabel(defaultCity)}`),
    );
  }

  return `\n${lines.join("\n")}`;
}

export async function runMenu(
  prompt: Prompt,
  initialConfig: Config,
): Promise<void> {
  let config = initialConfig;

  while (true) {
    console.log(renderMenu(config));
    const answer = await prompt.ask("  Selecciona una opción: ");

    if (!isMenuOption(answer)) {
      printError("Opción inválida. Elige un número del menú.");
      continue;
    }

    switch (answer) {
      case "1":
        config = await showDefaultWeather(prompt, config);
        break;
      case "2":
        await showAllWeather(prompt, config);
        break;
      case "3":
        config = await addCity(prompt, config, false);
        break;
      case "4":
        config = await removeCity(prompt, config);
        break;
      case "5":
        config = await setDefaultCity(prompt, config);
        break;
      case "8":
        config = await changeSettings(prompt, config);
        break;
      case "9":
        prompt.close();
        printFarewell();
        return;
    }
  }
}
