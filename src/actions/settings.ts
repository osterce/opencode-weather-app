import type { Prompt } from "../presentation/input.ts";
import {
  printError,
  printInfo,
  printSuccess,
  renderSettings,
} from "../presentation/output.ts";
import { setUnit } from "../storage/settingsStorage.ts";
import type { Config, Unit } from "../types/Config.ts";
import { unitSymbol } from "../utils/format.ts";
import { trySave } from "./helpers.ts";

export async function changeSettings(
  prompt: Prompt,
  config: Config,
): Promise<Config> {
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

    const next = await trySave(setUnit(config, unit), config);
    if (next !== config) {
      printSuccess(`Unidad cambiada a ${unitSymbol(unit)}.`);
    }
    return next;
  }
}
