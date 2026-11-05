import type { City } from "./City.ts";

export type CurrentWeather = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
};

export type DailyWeather = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: (number | null)[];
};

export type ForecastDay = {
  date: string;
  code: number;
  max: number;
  min: number;
  precipitationProbability: number | null;
};

export type WeatherData = {
  current: CurrentWeather;
  daily: DailyWeather;
};

export type WeatherInfo = {
  label: string;
  shortLabel: string;
  icon: string;
};

export type CityRow = {
  city: City;
  data: WeatherData | null;
  error: string | null;
};
