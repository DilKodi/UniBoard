export interface UniversityEntry {
  name: string;
  location: string;
  abbreviations?: string[];
  campuses?: string[];
}

export const universities: UniversityEntry[] = [
  { name: "APIIT Sri Lanka", location: "Kandy" },
  { name: "Buddhist and Pali University of Sri Lanka", location: "Colombo 7", campuses: ["Colombo Campus"] },
  { name: "CINEC Campus", location: "Malabe" },
  { name: "Eastern University, Sri Lanka", location: "Batticaloa" },
  { name: "General Sir John Kotelawala Defence University", location: "Ratmalana" },
  { name: "Horizon Campus", location: "Malabe", campuses: ["Malabe Campus"] },
  { name: "ICBT Campus", location: "Colombo 4", campuses: ["Colombo Campus"] },
  {
    name: "Informatics Institute of Technology",
    location: "Colombo 4",
    abbreviations: ["IIT"],
    campuses: ["Colombo 4 Campus", "Malabe Campus"],
  },
  { name: "Open University of Sri Lanka", location: "Nawala" },
  { name: "NSBM Green University", location: "Homagama", abbreviations: ["NSBM"], campuses: ["Homagama Main Campus", "Colombo Metro Campus"] },
  { name: "National Institute of Business Management", location: "Colombo 7", abbreviations: ["NIBM"], campuses: ["Colombo 7 Campus", "Galle Branch"] },
  { name: "Sabaragamuwa University of Sri Lanka", location: "Belihuloya", campuses: ["Belihuloya Campus"] },
  {
    name: "Sri Lanka Institute of Information Technology",
    location: "Malabe",
    abbreviations: ["SLIIT"],
    campuses: ["Malabe Campus", "Colombo Campus"],
  },
  { name: "South Eastern University of Sri Lanka", location: "Oluvil", campuses: ["Oluvil Campus"] },
  { name: "University of Colombo", location: "Colombo 03" },
  { name: "University of Jaffna", location: "Jaffna" },
  { name: "University of Kelaniya", location: "Kelaniya" },
  { name: "University of Moratuwa", location: "Moratuwa" },
  { name: "University of Peradeniya", location: "Peradeniya" },
  { name: "University of Ruhuna", location: "Matara" },
  { name: "University of Sri Jayewardenepura", location: "Nugegoda" },
  { name: "University of the Visual and Performing Arts", location: "Colombo 7" },
  { name: "University of Vavuniya", location: "Vavuniya" },
  { name: "Uva Wellassa University", location: "Badulla" },
  { name: "Wayamba University of Sri Lanka", location: "Kuliyapitiya" },
];

export const universityDisplayOptions = universities.map((university) =>
  `${university.name} (${university.location})`,
);

// Build a set of searchable tokens for each university and campus
export const universitySearchOptions = universities.flatMap((university) => {
  const base = `${university.name} (${university.location})`;
  const campusOptions = (university.campuses ?? []).map((campus) => `${university.name} — ${campus} (${university.location})`);
  const abbrevOptions = (university.abbreviations ?? []).flatMap((abbr) => [
    `${abbr} — ${university.name} (${university.location})`,
    ...((university.campuses ?? []).map((campus) => `${abbr} — ${campus} — ${university.location}`)),
  ]);

  return [base, ...campusOptions, ...abbrevOptions];
});

export const matchesUniversitySearch = (query: string, placeNearestUniversity: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const normalizedQuery = q
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const baseName = placeNearestUniversity.split(" - ")[0].split(" — ")[0].trim();
  const uni = universities.find((u) => u.name.toLowerCase() === baseName.toLowerCase() || `${u.name} (${u.location})`.toLowerCase() === baseName.toLowerCase());

  if (!uni) {
    // fallback: check if any part of the query matches the place name
    const placeLower = placeNearestUniversity.toLowerCase();
    return placeLower.includes(q) || q.includes(placeLower);
  }

  const uniNameLower = uni.name.toLowerCase();
  const uniLocationLower = uni.location.toLowerCase();

  // 1. Exact or substring match in name (either way)
  if (uniNameLower.includes(normalizedQuery) || normalizedQuery.includes(uniNameLower)) return true;

  // 2. Exact or substring match in location (either way)
  if (uniLocationLower.includes(normalizedQuery) || normalizedQuery.includes(uniLocationLower)) return true;

  // 3. Match against abbreviations (either way)
  if ((uni.abbreviations ?? []).some((abbr) => {
    const abbrLower = abbr.toLowerCase();
    return abbrLower.includes(normalizedQuery) || normalizedQuery.includes(abbrLower);
  })) return true;

  // 4. Match against campuses (either way)
  if ((uni.campuses ?? []).some((campus) => {
    const campusLower = campus.toLowerCase();
    return campusLower.includes(normalizedQuery) || normalizedQuery.includes(campusLower);
  })) return true;

  // 5. Match composed display/search strings
  const searchKey = `${uni.name} ${uni.location} ${(uni.abbreviations ?? []).join(" ")} ${(uni.campuses ?? []).join(" ")}`.toLowerCase();
  if (searchKey.includes(normalizedQuery) || normalizedQuery.includes(uniNameLower)) return true;

  return false;
};

export const UNIVERSITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "University of Moratuwa": { lat: 6.7951, lng: 79.9008 },
  "University of Colombo": { lat: 6.9020, lng: 79.8612 },
  "University of Peradeniya": { lat: 7.2548, lng: 80.5987 },
  "University of Sri Jayewardenepura": { lat: 6.8529, lng: 79.9021 },
  "Sri Lanka Institute of Information Technology": { lat: 6.9064, lng: 79.9706 },
  "NSBM Green University": { lat: 6.8213, lng: 80.0416 },
  "APIIT Sri Lanka": { lat: 6.9189, lng: 79.8530 },
  "Informatics Institute of Technology": { lat: 6.9634, lng: 79.8703 },
  "University of Kelaniya": { lat: 6.9741, lng: 79.9161 },
  "Open University of Sri Lanka": { lat: 6.8824, lng: 79.8825 },
};