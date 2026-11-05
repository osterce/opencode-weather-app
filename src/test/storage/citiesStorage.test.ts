import { describe, expect, test } from "bun:test";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";
import {
  addCityToConfig,
  findDefaultCity,
  removeCityFromConfig,
  setDefaultCityInConfig,
} from "./citiesStorage.ts";

const ottawa: City = {
  id: 1,
  name: "Ottawa",
  admin1: "Ontario",
  country: "Canadá",
  latitude: 45.41117,
  longitude: -75.69812,
};

const madrid: City = {
  id: 2,
  name: "Madrid",
  country: "España",
  latitude: 40.4168,
  longitude: -3.7038,
};

const config: Config = {
  version: 1,
  unit: "celsius",
  defaultCityId: 1,
  cities: [ottawa],
};

describe("findDefaultCity", () => {
  test("encuentra la ciudad default", () => {
    expect(findDefaultCity(config)).toEqual(ottawa);
  });

  test("devuelve undefined si no hay default", () => {
    expect(findDefaultCity({ ...config, defaultCityId: null })).toBeUndefined();
  });
});

describe("addCityToConfig", () => {
  test("agrega una ciudad nueva", () => {
    const next = addCityToConfig(config, madrid);

    expect(next.cities).toEqual([ottawa, madrid]);
    expect(next).not.toBe(config);
  });

  test("ignora una ciudad que ya existe", () => {
    expect(addCityToConfig(config, ottawa)).toBe(config);
  });
});

describe("removeCityFromConfig", () => {
  test("elimina la ciudad y limpia el default si era la default", () => {
    const next = removeCityFromConfig(config, ottawa.id);

    expect(next.cities).toEqual([]);
    expect(next.defaultCityId).toBeNull();
  });

  test("mantiene el default si se elimina otra ciudad", () => {
    const next = removeCityFromConfig(
      { ...config, cities: [ottawa, madrid] },
      madrid.id,
    );

    expect(next.cities).toEqual([ottawa]);
    expect(next.defaultCityId).toBe(ottawa.id);
  });
});

describe("setDefaultCityInConfig", () => {
  test("cambia la ciudad default", () => {
    const next = setDefaultCityInConfig(config, madrid.id);

    expect(next.defaultCityId).toBe(madrid.id);
    expect(next.cities).toEqual(config.cities);
  });
});
