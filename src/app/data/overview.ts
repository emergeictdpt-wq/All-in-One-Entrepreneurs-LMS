// Everything on the Projects Overview page (summary cards + charts) is derived here from the programs that were set up
// and the applications that came in. Nothing is typed in by hand: create a program or submit an application and the
// numbers move.
import type { AdminProgram, EntrepreneurApplication, MentorApplication } from "../types";
import { ALL_SCOPE, inScope, mentorInScope } from "./projectScope";

export interface RankedItem { name: string; count: number; pct: number }

export interface Overview {
  /** every program that was set up (published or not) */
  programs: number;
  /** programs that are live, i.e. published */
  implemented: number;
  entrepreneurs: number;
  mentors: number;
  districts: number;
  sectors: number;
  /** distinct organisations the mentors come from */
  organisations: number;
  female: number;
  male: number;
  /** Non-binary, prefer not to say, or left blank */
  otherGender: number;
  /** entrepreneurs who ticked "person with disability" */
  pwd: number;
  /** youth: ticked youth-owned, or chose the 18-35 age group */
  youth: number;
  /** highest first; every sector / district, not just the top few */
  topSectors: RankedItem[];
  topDistricts: RankedItem[];
}

const clean = (v?: string | null) => (v ?? "").trim().replace(/\s+/g, " ");

/** Counts values case-insensitively (so "lilongwe" and "Lilongwe" are one district). Blanks are ignored. */
function tally(values: (string | undefined | null)[]): RankedItem[] {
  const seen = new Map<string, { name: string; count: number }>();
  for (const raw of values) {
    const v = clean(raw);
    if (!v) continue;
    const key = v.toLowerCase();
    const hit = seen.get(key);
    if (hit) hit.count += 1;
    else seen.set(key, { name: v.charAt(0).toUpperCase() + v.slice(1), count: 1 });
  }
  const total = [...seen.values()].reduce((s, x) => s + x.count, 0);
  return [...seen.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map(x => ({ ...x, pct: total ? Math.round((x.count / total) * 100) : 0 }));
}

export function computeOverview(
  programs: AdminProgram[],
  entApps: EntrepreneurApplication[],
  mntApps: MentorApplication[],
): Overview {
  // Same rule as Incubation Management's "All Projects": records of a program that no longer exists are left out,
  // records that never chose a project are kept.
  const scope = { ...ALL_SCOPE, allowed: programs.map(p => p.id) };
  const ents = entApps.filter(a => inScope(scope, a));
  const mnts = mntApps.filter(a => mentorInScope(scope, a));

  const sectors = tally(ents.map(a => a.sector));
  const districts = tally(ents.map(a => a.district));
  const genderOf = (g?: string) => clean(g).toLowerCase();
  const female = ents.filter(a => genderOf(a.gender) === "female").length;
  const male = ents.filter(a => genderOf(a.gender) === "male").length;

  return {
    programs: programs.length,
    implemented: programs.filter(p => p.published).length,
    entrepreneurs: ents.length,
    mentors: mnts.length,
    districts: districts.length,
    sectors: sectors.length,
    organisations: tally(mnts.map(m => m.employer)).length,
    female,
    male,
    otherGender: ents.length - female - male,
    pwd: ents.filter(a => a.pwd).length,
    youth: ents.filter(a => a.youthOwned || a.ageGroup === "18-35").length,
    topSectors: sectors,
    topDistricts: districts,
  };
}
