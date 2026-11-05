import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type TempConfig = {
  dir: string;
  file: string;
};

export async function createTempConfig(): Promise<TempConfig> {
  const dir = await mkdtemp(join(tmpdir(), "weather-cli-test-"));
  const file = join(dir, "config.json");
  process.env.WEATHER_CLI_CONFIG = file;
  return { dir, file };
}

export async function removeTempConfig(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

export function restoreConfigOverride(original: string | undefined): void {
  if (original === undefined) {
    delete process.env.WEATHER_CLI_CONFIG;
  } else {
    process.env.WEATHER_CLI_CONFIG = original;
  }
}
