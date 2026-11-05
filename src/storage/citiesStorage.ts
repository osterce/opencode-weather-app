import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";

export function findDefaultCity(config: Config): City | undefined {
  return config.cities.find((city) => city.id === config.defaultCityId);
}

export function addCityToConfig(config: Config, city: City): Config {
  if (config.cities.some((item) => item.id === city.id)) return config;
  return { ...config, cities: [...config.cities, city] };
}

export function removeCityFromConfig(config: Config, cityId: number): Config {
  const cities = config.cities.filter((city) => city.id !== cityId);

  return {
    ...config,
    cities,
    defaultCityId:
      config.defaultCityId === cityId ? null : config.defaultCityId,
  };
}

export function setDefaultCityInConfig(config: Config, cityId: number): Config {
  return { ...config, defaultCityId: cityId };
}
