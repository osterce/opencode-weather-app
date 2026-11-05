import { printError } from "../presentation/output.ts";
import { saveConfig } from "../storage/settingsStorage.ts";
import type { Config } from "../types/Config.ts";
import { errorMessage } from "../utils/errors.ts";

export async function trySave(
  next: Config,
  current: Config,
): Promise<Config> {
  try {
    await saveConfig(next);
    return next;
  } catch (error) {
    printError(errorMessage(error));
    return current;
  }
}
