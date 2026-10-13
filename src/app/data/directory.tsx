// One record per person (entrepreneur or mentor), assembled from:
//   • applications people submitted on the site (App state)
//   • the sample applications that ship with the admin page
//   • the admin's status decisions (so "Pending → Selected → Matching" is respected everywhere)
//   • the sample pairs in the programme store that have no application record
// Dashboards read bios, contact details and project names from here instead of hardcoding them by name.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EntrepreneurApplication, MentorApplication } from "../types";
import { APPS_KEY, DECISIONS_KEY, MENTOR_APPS_KEY, loadOverrides } from "./applicationTracker";

export const IN_PROGRAMME = ["Selected", "Approved", "Matching"];
export const SAMPLE_CORE = "emerge4biz-core";
export const SAMPLE_SHE = "shemerge-incubation";

export interface Person {
  id: string; role: "mentee" | "mentor"; name: string; email: string; phone: string; district: string;
  /** effective status = the admin's latest decision, else what the application says */
  status: string; appliedOn: string;
  /** true for sample people that ship with the app (they sign in with the shared demo password) */
  seeded: boolean;
  programId?: string; programName?: string; program?: "Incubation" | "Acceleration";
  // entrepreneurs
  businessName?: string; sector?: string; stage?: string; bio?: string;
  metrics?: { surveys: string; MRR: string; teamSize: number }; blockers?: string[];
  // mentors
  title?: string; employer?: string; expertise?: string; expertiseAreas?: string[]; location?: string; responseTime?: string;
  preferredStages?: string[]; industries?: string[]; hoursPerMonth?: string;
}

// ── Sample people that exist in the programme store but have no application record ─────────────
const SEED_MENTEES: Person[] = [
  { id: "APP-025", role: "mentee", name: "Kondwani Phiri", email: "kondwani.phiri@example.com", phone: "+265 999 125 025", district: "Lilongwe", status: "Matching", appliedOn: "2026-01-20", seeded: true, programId: SAMPLE_CORE, businessName: "EduBridge", sector: "EdTech", stage: "MVP",
    bio: "Building adaptive learning platforms for public secondary schools in Lilongwe and Blantyre. First paying customer secured. Needs help scaling partnerships.", metrics: { surveys: "N/A", MRR: "MWK 180,000", teamSize: 2 }, blockers: ["School partnership delays"] },
  { id: "APP-026", role: "mentee", name: "Tadala Chirwa", email: "tadala.chirwa@example.com", phone: "+265 888 126 026", district: "Dedza", status: "Matching", appliedOn: "2026-01-21", seeded: true, programId: SAMPLE_SHE, businessName: "CleanHeat", sector: "CleanEnergy", stage: "Idea",
    bio: "Early-stage clean cookstove initiative targeting rural households in Dedza and Kasungu. High-impact idea, needs technical grounding.", metrics: { surveys: "12/30", MRR: "Pre-revenue", teamSize: 1 }, blockers: ["Technical co-founder search", "Prototype cost"] },
  { id: "APP-027", role: "mentee", name: "Yamikani Mwale", email: "yamikani.mwale@example.com", phone: "+265 991 127 027", district: "Blantyre", status: "Matching", appliedOn: "2026-01-22", seeded: true, programId: SAMPLE_CORE, businessName: "LearnLoop", sector: "EdTech", stage: "Idea" },
  { id: "APP-028", role: "mentee", name: "Grace Kamwendo", email: "grace.kamwendo@example.com", phone: "+265 884 128 028", district: "Zomba", status: "Matching", appliedOn: "2026-01-23", seeded: true, programId: SAMPLE_SHE, businessName: "HealthTrack", sector: "HealthTech", stage: "MVP" },
  { id: "APP-029", role: "mentee", name: "Madalitso Chiumia", email: "madalitso.chiumia@example.com", phone: "+265 992 129 029", district: "Mzuzu", status: "Matching", appliedOn: "2026-01-24", seeded: true, programId: SAMPLE_CORE, businessName: "FarmLink", sector: "AgriTech", stage: "Idea" },
];
const SEED_MENTORS: Person[] = [
  { id: "MNT-017", role: "mentor", name: "Dr. Tiwonge Banda", email: "tiwonge.banda@example.com", phone: "+265 999 017 017", district: "Mzimba", status: "Approved", appliedOn: "2026-01-05", seeded: true, programId: SAMPLE_CORE,
    title: "Serial Entrepreneur & AgriTech Advisor", employer: "Banda Ventures", expertise: "AgriTech and Finance", expertiseAreas: ["Agricultural Finance", "Market Entry", "Product-Market Fit", "Impact Investing"], location: "Mzimba, Malawi", responseTime: "< 2 hours",
    bio: "15+ years scaling agri-ventures across Africa. Founded 3 successful startups, exited 2. Passionate about food-system innovation." },
  { id: "MNT-018", role: "mentor", name: "Prof. Patrick Likoswe", email: "patrick.likoswe@example.com", phone: "+265 888 018 018", district: "Blantyre", status: "Approved", appliedOn: "2026-01-05", seeded: true, programId: SAMPLE_CORE,
    title: "EdTech & Curriculum Specialist", employer: "University of Malawi", expertise: "EdTech & Curriculum", expertiseAreas: ["Curriculum Design", "School Partnerships", "EdTech Sales"], location: "Blantyre, Malawi", responseTime: "< 4 hours",
    bio: "Former head of curriculum development. Helps education ventures win public-school partnerships." },
  { id: "MNT-019", role: "mentor", name: "Limbani Gondwe", email: "limbani.gondwe@example.com", phone: "+265 991 019 019", district: "Lilongwe", status: "Approved", appliedOn: "2026-01-06", seeded: true, programId: SAMPLE_SHE,
    title: "CleanEnergy & Hardware Engineer", employer: "SunHearth Energy", expertise: "CleanEnergy and Hardware", expertiseAreas: ["Cookstove Design", "Hardware Prototyping", "Supply Chains"], location: "Lilongwe, Malawi", responseTime: "< 1 day",
    bio: "Hardware engineer who has shipped clean-energy products to rural households across Central Malawi." },
  { id: "MNT-020", role: "mentor", name: "Dr. Chimwemwe Phiri", email: "chimwemwe.phiri@example.com", phone: "+265 884 020 020", district: "Zomba", status: "Approved", appliedOn: "2026-01-06", seeded: true, programId: SAMPLE_SHE,
    title: "HealthTech & UX Lead", employer: "Zomba Digital Health", expertise: "HealthTech & UX", expertiseAreas: ["Health Systems", "User Research", "Clinical Pilots"], location: "Zomba, Malawi", responseTime: "< 3 hours",
    bio: "Leads digital-health pilots with district hospitals; strong on user research and product usability." },
];
/** Profile details for sample applications that also exist in the admin page's sample data. */
const SEED_EXTRAS: Record<string, Partial<Person>> = {
  "APP-001": { bio: "AgriTech founder connecting smallholder farmers to digital marketplaces across Mzimba and Lilongwe districts. Strong fieldwork hustle.", metrics: { surveys: "38/50", MRR: "Pre-revenue", teamSize: 3 }, blockers: ["Farmers resistant to digital payments", "Grant selection uncertainty"] },
};

const fromEnt = (a: EntrepreneurApplication & { bio?: string }, status: string): Person => ({
  id: a.id, role: "mentee", name: a.name, email: a.email ?? "", phone: a.phone, district: a.district, status, appliedOn: a.date, seeded: a.isMockup,
  programId: a.programId, programName: a.programName, program: a.program, businessName: a.businessName, sector: a.sector, stage: a.stage, bio: a.bio, ...SEED_EXTRAS[a.id],
});
const fromMnt = (a: MentorApplication & { bio?: string; expertiseAreas?: string[]; location?: string }, status: string): Person => ({
  id: a.id, role: "mentor", name: a.name, email: a.email ?? "", phone: a.phone, district: a.district, status, appliedOn: a.date, seeded: a.isMockup,
  programId: a.programId, program: a.program, title: a.title, employer: a.employer, expertise: a.expertise, expertiseAreas: a.expertiseAreas, bio: a.bio,
  preferredStages: a.preferredStages, industries: a.industries, hoursPerMonth: a.hoursPerMonth,
  location: a.location ?? (a.district ? `${a.district}, Malawi` : undefined), ...SEED_EXTRAS[a.id],
});

/** Later lists win on duplicate ids, so live applications override the samples. Admin decisions override the stored status. */
export function buildPeople(i: { entApps: EntrepreneurApplication[]; mntApps: MentorApplication[]; overrides: Record<string, { status: string }> }) {
  const eff = (id: string, status: string) => i.overrides[id]?.status ?? status;
  const mentees = new Map<string, Person>(), mentors = new Map<string, Person>();
  SEED_MENTEES.forEach(p => mentees.set(p.id, { ...p, status: eff(p.id, p.status) }));
  SEED_MENTORS.forEach(p => mentors.set(p.id, { ...p, status: eff(p.id, p.status) }));
  i.entApps.forEach(a => mentees.set(a.id, fromEnt(a, eff(a.id, a.status))));
  i.mntApps.forEach(a => mentors.set(a.id, fromMnt(a, eff(a.id, a.status))));
  return { mentees: [...mentees.values()], mentors: [...mentors.values()] };
}

interface Dir {
  mentees: Person[]; mentors: Person[];
  /** Match by application id first (reliable), then by exact name (older records). */
  mentee: (id?: string, name?: string) => Person | undefined;
  mentor: (id?: string, name?: string) => Person | undefined;
}
const DirCtx = createContext<Dir | null>(null);
export const useDirectory = () => { const c = useContext(DirCtx); if (!c) throw new Error("useDirectory must be used inside <DirectoryProvider>"); return c; };

export function DirectoryProvider({ entApps, mntApps, children }: { entApps: EntrepreneurApplication[]; mntApps: MentorApplication[]; children: ReactNode }) {
  // Re-read the admin's decisions when another tab changes them; same-tab changes are picked up on the next render.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const on = (e: StorageEvent) => { if (e.key === DECISIONS_KEY || e.key === APPS_KEY || e.key === MENTOR_APPS_KEY) setTick(t => t + 1); };
    window.addEventListener("storage", on); return () => window.removeEventListener("storage", on);
  }, []);
  const overrides = loadOverrides();
  const sig = JSON.stringify(overrides);
  const value = useMemo<Dir>(() => {
    const { mentees, mentors } = buildPeople({ entApps, mntApps, overrides });
    const lc = (s: string) => s.trim().toLowerCase();
    const find = (list: Person[]) => (id?: string, name?: string) => (id ? list.find(p => p.id === id) : undefined) ?? (name ? list.find(p => lc(p.name) === lc(name)) : undefined);
    return {
      mentees, mentors, mentee: find(mentees), mentor: find(mentors) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entApps, mntApps, sig, tick]);
  return <DirCtx.Provider value={value}>{children}</DirCtx.Provider>;
}
