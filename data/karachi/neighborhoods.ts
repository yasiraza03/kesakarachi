import type { Neighborhood } from "@/types/city";

/**
 * Neighbourhood anchor points. STATIC REFERENCE DATA.
 * Positions are approximate (centre of the area, not a surveyed boundary).
 * `district` is an informal geographic zone - see districts.ts.
 * No population or other statistics are stored on purpose.
 */
export const neighborhoods: Neighborhood[] = [
  { id: "saddar", name: "Saddar", district: "South", latitude: 24.8572, longitude: 67.0187, rank: 1, note: "Historic commercial centre of the old city." },
  { id: "clifton", name: "Clifton", district: "Coast", latitude: 24.8138, longitude: 67.03, rank: 1, note: "Seafront residential area near Clifton Beach." },
  { id: "dha", name: "DHA", district: "Coast", latitude: 24.8, longitude: 67.065, rank: 1, note: "Defence Housing Authority - planned phases running down to the coast." },
  { id: "boat-basin", name: "Boat Basin", district: "South", latitude: 24.8195, longitude: 67.0285, rank: 3, note: "Khayaban-e-Roomi area, known for its food street." },
  { id: "gulshan", name: "Gulshan-e-Iqbal", district: "East", latitude: 24.9205, longitude: 67.092, rank: 1, note: "Large residential area in the east, near the university belt." },
  { id: "johar", name: "Gulistan-e-Johar", district: "East", latitude: 24.9165, longitude: 67.128, rank: 1, note: "Residential area east of Gulshan-e-Iqbal." },
  { id: "north-nazimabad", name: "North Nazimabad", district: "Central", latitude: 24.9395, longitude: 67.0395, rank: 1, note: "Planned residential blocks in Central Karachi." },
  { id: "nazimabad", name: "Nazimabad", district: "Central", latitude: 24.9085, longitude: 67.0285, rank: 2, note: "Older planned neighbourhood just south of North Nazimabad." },
  { id: "pechs", name: "PECHS", district: "East", latitude: 24.8705, longitude: 67.062, rank: 2, note: "Pakistan Employees Cooperative Housing Society, off Tariq Road." },
  { id: "korangi", name: "Korangi", district: "Korangi", latitude: 24.831, longitude: 67.132, rank: 1, note: "Industrial and residential area on the south-east side." },
  { id: "landhi", name: "Landhi", district: "Korangi", latitude: 24.846, longitude: 67.2, rank: 2, note: "Industrial and residential area on the far east." },
  { id: "malir", name: "Malir", district: "Malir", latitude: 24.896, longitude: 67.199, rank: 1, note: "Eastern district around the Malir river." },
  { id: "lyari", name: "Lyari", district: "South", latitude: 24.86, longitude: 66.999, rank: 2, note: "Dense historic neighbourhood by the Lyari river." },
  { id: "orangi", name: "Orangi", district: "West", latitude: 24.95, longitude: 66.99, rank: 2, note: "Large residential area on the north-west side." },
  { id: "site", name: "SITE", district: "West", latitude: 24.904, longitude: 66.978, rank: 2, note: "Sindh Industrial Trading Estate, one of the city's main industrial zones." },
  { id: "shah-faisal", name: "Shah Faisal", district: "Korangi", latitude: 24.88, longitude: 67.15, rank: 3, note: "Residential colony along the airport-side corridor." },
  { id: "federal-b", name: "Federal B Area", district: "Central", latitude: 24.931, longitude: 67.08, rank: 2, note: "Planned residential blocks in Central Karachi." },
  { id: "bahadurabad", name: "Bahadurabad", district: "East", latitude: 24.88, longitude: 67.07, rank: 3, note: "Commercial and residential area off Shahrah-e-Faisal." },
  { id: "tariq-road", name: "Tariq Road", district: "East", latitude: 24.875, longitude: 67.064, rank: 3, note: "Shopping street in PECHS." },
  { id: "burns-road", name: "Burns Road", district: "South", latitude: 24.861, longitude: 67.0145, rank: 3, note: "Old city street known for its food." },
  { id: "keamari", name: "Keamari", district: "Coast", latitude: 24.84, longitude: 66.98, rank: 2, note: "Port-side area and gateway to Manora." },
  { id: "karsaz", name: "Karsaz", district: "East", latitude: 24.868, longitude: 67.1, rank: 3, note: "Area along Shahrah-e-Faisal between PECHS and the airport side." },
  { id: "north-karachi", name: "North Karachi", district: "Central", latitude: 24.983, longitude: 67.062, rank: 3, note: "Large residential township in the north." },
];
