// The sectors an applicant can choose from on the entrepreneur application form.
// Each project (admin programme) can replace this list in Program Setup; projects without their own list use these.

export const DEFAULT_APPLICATION_SECTORS: string[] = [
  "Agriculture & Agribusiness", "Technology & ICT", "Health & Wellbeing", "Education & Training",
  "Manufacturing", "Trade & Commerce", "Creative Industries", "Tourism & Hospitality",
  "Financial Services", "Energy & Environment", "Other",
];

/** Trims, drops blanks and removes repeats (ignoring case), keeping the admin's order. */
export function cleanSectors(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const s = raw.trim().replace(/\s+/g, " ");
    const k = s.toLowerCase();
    if (!s || seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

/** The list a project's application form should offer. */
export function sectorsFor(project?: { applicationSectors?: string[] } | null): string[] {
  const own = cleanSectors(project?.applicationSectors ?? []);
  return own.length ? own : DEFAULT_APPLICATION_SECTORS;
}
