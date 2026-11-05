export type City = {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type SavedCityEntry = {
  index: number;
  city: City;
  isDefault: boolean;
};
