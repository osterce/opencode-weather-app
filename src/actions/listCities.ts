import type { SavedCityEntry } from "../types/City.ts";
import type { Config } from "../types/Config.ts";

export function listCities(config: Config): SavedCityEntry[] {
  return config.cities.map((city, index) => ({
    index: index + 1,
    city,
    isDefault: city.id === config.defaultCityId,
  }));
}
