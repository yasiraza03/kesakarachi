import type { District } from "@/types/city";

/**
 * Informal geographic zones used to group neighbourhoods for orientation.
 * These are NOT official administrative boundaries (those have been redrawn several times).
 * STATIC REFERENCE DATA.
 */
export const districts: District[] = [
  { id: "south", name: "South", note: "Old city, the port approaches and the seafront." },
  { id: "east", name: "East", note: "Large residential belt running toward the airport side." },
  { id: "central", name: "Central", note: "Planned grid neighbourhoods north of the old city." },
  { id: "west", name: "West", note: "Industrial estates and dense residential areas on the western side." },
  { id: "korangi", name: "Korangi", note: "Industrial and residential area on the south-east edge." },
  { id: "malir", name: "Malir", note: "Eastern edge of the city along the Malir river." },
  { id: "coast", name: "Coast", note: "Sea-facing areas and the port." },
];
