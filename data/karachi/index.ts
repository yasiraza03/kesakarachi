import type { CityData } from "@/types/city";
import { KARACHI } from "./coordinates";
import { districts } from "./districts";
import { landmarks } from "./landmarks";
import { neighborhoods } from "./neighborhoods";

export const cityData: CityData = {
  center: { latitude: KARACHI.latitude, longitude: KARACHI.longitude },
  neighborhoods,
  landmarks,
  districts,
};

export * from "./coordinates";
export { districts, landmarks, neighborhoods };
