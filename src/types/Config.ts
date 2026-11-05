import type { City } from "./City.ts";

export type Unit = "celsius" | "fahrenheit";

export type Config = {
  version: 1;
  unit: Unit;
  defaultCityId: number | null;
  cities: City[];
};

export type LoadConfigResult = {
  config: Config;
  warning?: string;
};
