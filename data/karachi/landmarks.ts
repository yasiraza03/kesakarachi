import type { Landmark, LandmarkCategory } from "@/types/city";

/**
 * Landmarks. STATIC REFERENCE DATA.
 * Positions are approximate (good to a few hundred metres). Descriptions are intentionally plain.
 */
export const landmarks: Landmark[] = [
  { id: "mazar-e-quaid", name: "Mazar-e-Quaid", latitude: 24.8754, longitude: 67.0398, category: "LANDMARK", note: "Mausoleum of Muhammad Ali Jinnah." },
  { id: "frere-hall", name: "Frere Hall", latitude: 24.8467, longitude: 67.033, category: "CULTURAL", note: "Colonial-era hall and gardens near Saddar." },
  { id: "empress-market", name: "Empress Market", latitude: 24.8587, longitude: 67.0214, category: "MARKET", note: "Victorian-era market building in Saddar." },
  { id: "mohatta-palace", name: "Mohatta Palace", latitude: 24.8165, longitude: 67.03, category: "CULTURAL", note: "Museum in a 1920s palace in Clifton." },
  { id: "clifton-beach", name: "Clifton Beach", latitude: 24.789, longitude: 67.028, category: "BEACH", note: "City beach on the Arabian Sea." },
  { id: "sea-view", name: "Sea View", latitude: 24.793, longitude: 67.054, category: "BEACH", note: "Beachfront promenade near DHA." },
  { id: "manora", name: "Manora Beach", latitude: 24.799, longitude: 66.976, category: "BEACH", note: "Beach on Manora, reached by boat from Keamari." },
  { id: "do-talwar", name: "Do Talwar", latitude: 24.817, longitude: 67.0303, category: "LANDMARK", note: "Twin-sword monument in Clifton." },
  { id: "bagh-ibn-e-qasim", name: "Bagh Ibn-e-Qasim", latitude: 24.8137, longitude: 67.0373, category: "PARK", note: "Large public park in Clifton." },
  { id: "port-grand", name: "Port Grand", latitude: 24.8423, longitude: 66.9987, category: "FOOD", note: "Food and entertainment promenade by the Native Jetty Bridge." },
  { id: "boat-basin-food", name: "Boat Basin Food Street", latitude: 24.8192, longitude: 67.0337, category: "FOOD", note: "Open-air food street in Clifton." },
  { id: "ocean-mall", name: "Ocean Mall", latitude: 24.812, longitude: 67.032, category: "MARKET", note: "Shopping mall in Clifton." },
  { id: "lucky-one", name: "Lucky One Mall", latitude: 24.9285, longitude: 67.0975, category: "MARKET", note: "Shopping mall on Rashid Minhas Road." },
  { id: "national-stadium", name: "National Stadium", latitude: 24.8925, longitude: 67.0658, category: "SPORTS", note: "International cricket ground." },
  { id: "airport", name: "Jinnah International Airport", latitude: 24.9065, longitude: 67.1608, category: "TRANSIT", note: "Karachi's international airport." },
  { id: "city-station", name: "Karachi City Station", latitude: 24.8503, longitude: 67.0074, category: "TRANSIT", note: "Main railway station near the old city." },
  { id: "cantt-station", name: "Karachi Cantt Station", latitude: 24.8527, longitude: 67.036, category: "TRANSIT", note: "Railway station near Saddar." },
  { id: "ku", name: "University of Karachi", latitude: 24.945, longitude: 67.117, category: "UNIVERSITY", note: "Public university near Gulshan-e-Iqbal." },
  { id: "ned", name: "NED University", latitude: 24.9311, longitude: 67.1128, category: "UNIVERSITY", note: "Engineering university near University Road." },
  { id: "iba", name: "IBA Karachi", latitude: 24.9398, longitude: 67.114, category: "UNIVERSITY", note: "Institute of Business Administration, main campus." },
  { id: "aku", name: "Aga Khan University Hospital", latitude: 24.893, longitude: 67.0744, category: "HOSPITAL", note: "Teaching hospital on Stadium Road." },
  { id: "jpmc", name: "JPMC", latitude: 24.8476, longitude: 67.0443, category: "HOSPITAL", note: "Jinnah Postgraduate Medical Centre." },
  { id: "lnh", name: "Liaquat National Hospital", latitude: 24.888, longitude: 67.063, category: "HOSPITAL", note: "Hospital near the National Stadium." },
];

export const CATEGORY_STYLE: Record<LandmarkCategory, { label: string; glyph: string }> = {
  LANDMARK: { label: "Landmark", glyph: "◆" },
  BEACH: { label: "Beach", glyph: "≈" },
  PARK: { label: "Park", glyph: "✦" },
  MARKET: { label: "Market", glyph: "▣" },
  TRANSIT: { label: "Transit", glyph: "⇄" },
  SPORTS: { label: "Sports", glyph: "◎" },
  UNIVERSITY: { label: "University", glyph: "▲" },
  HOSPITAL: { label: "Hospital", glyph: "✚" },
  CULTURAL: { label: "Cultural", glyph: "❖" },
  FOOD: { label: "Food", glyph: "●" },
};
