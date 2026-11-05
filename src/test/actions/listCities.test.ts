import { describe, expect, test } from "bun:test";
import type { Config } from "../../types/Config.ts";
import { listCities } from "../../actions/listCities.ts";
import { madrid, ottawa } from "../helpers/fixtures.ts";

describe("listCities", () => {
  test("numera desde 1 y marca la ciudad default", () => {
    const config: Config = {
      version: 1,
      unit: "celsius",
      defaultCityId: madrid.id,
      cities: [ottawa, madrid],
    };

    expect(listCities(config)).toEqual([
      { index: 1, city: ottawa, isDefault: false },
      { index: 2, city: madrid, isDefault: true },
    ]);
  });

  test("funciona con una lista vacía", () => {
    expect(
      listCities({
        version: 1,
        unit: "celsius",
        defaultCityId: null,
        cities: [],
      }),
    ).toEqual([]);
  });
});
