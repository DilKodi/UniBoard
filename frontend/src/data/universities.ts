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

  // Extract base university name from stored placeNearestUniversity
  const baseName = placeNearestUniversity.split(" - ")[0].split(" — ")[0].trim();
  const uni = universities.find((u) => u.name.toLowerCase() === baseName.toLowerCase() || `${u.name} (${u.location})`.toLowerCase() === baseName.toLowerCase());

  if (!uni) {
    // fallback: check any search option contains query
    return universitySearchOptions.some((opt) => opt.toLowerCase().includes(q));
  }

  // Match against university name, location, abbreviations, and campuses
  if (uni.name.toLowerCase().includes(q)) return true;
  if (uni.location.toLowerCase().includes(q)) return true;
  if ((uni.abbreviations ?? []).some((a) => a.toLowerCase().includes(q))) return true;
  if ((uni.campuses ?? []).some((c) => c.toLowerCase().includes(q))) return true;

  // Also check composed display strings
  const display = `${uni.name} ${uni.location}`.toLowerCase();
  if (display.includes(q)) return true;

  return false;
};