// Programme managers (dummy data for the front end). Each manager "champions" one or more programs
// (AdminProgram.managerIds). The Program Managers page shows every program; the Incubation Management
// page shows only the programs the signed-in manager champions. When the backend arrives, `managerIds`
// becomes a program↔manager link table and `programsFor` becomes a server-side filter.
import type { AdminProgram } from "../types";

export interface Manager { id: string; name: string; email: string; title: string }

export const SEED_MANAGERS: Manager[] = [
  { id: "MGR-001", name: "Chikondi Mwale", email: "chikondi.mwale@emergelivelihoods.org", title: "Programme Manager" },
  { id: "MGR-002", name: "Thandiwe Kalua", email: "thandiwe.kalua@emergelivelihoods.org", title: "Programme Manager" },
  { id: "MGR-003", name: "Yohane Phiri", email: "yohane.phiri@emergelivelihoods.org", title: "Senior Programme Manager" },
];

/** Who champions the programs that ship with the app. A program can have several managers. */
export const SEED_OWNERS: Record<string, string[]> = {
  "emerge4biz-core": ["MGR-001", "MGR-003"],
  "shemerge-incubation": ["MGR-002"],
  "agri-incubation": ["MGR-003"],
};

/** Gives the sample programs their managers; leaves anything that already has managers (or was created without one) alone. */
export const withSeedOwners = (programs: AdminProgram[]): AdminProgram[] =>
  programs.map(p => (p.managerIds === undefined && SEED_OWNERS[p.id] ? { ...p, managerIds: SEED_OWNERS[p.id] } : p));

export const managerById = (id?: string | null) => SEED_MANAGERS.find(m => m.id === id);
/** Programs nobody champions yet (created before manager accounts existed). They show on the Program Managers page, where any manager can take them on. */
export const isUnassigned = (p: AdminProgram) => !p.managerIds || p.managerIds.length === 0;
export const manages = (p: AdminProgram, managerId?: string | null) => !!managerId && !!p.managerIds?.includes(managerId);
export const programsFor = (programs: AdminProgram[], managerId?: string | null) => programs.filter(p => manages(p, managerId));
export const managerNames = (p: AdminProgram) => (p.managerIds ?? []).map(id => managerById(id)?.name).filter(Boolean) as string[];
