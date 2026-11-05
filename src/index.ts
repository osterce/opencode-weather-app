import { EOFError, createPrompt } from "./presentation/input.ts";
import { printError, printFarewell } from "./presentation/output.ts";
import { runMenu } from "./presentation/menu.ts";
import { loadConfig } from "./storage/settingsStorage.ts";
import { errorMessage } from "./utils/errors.ts";

async function main(): Promise<void> {
  const prompt = createPrompt();
  const { config, warning } = await loadConfig();
  if (warning) printError(warning);

  await runMenu(prompt, config);
}

process.on("SIGINT", () => {
  printFarewell(true);
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
