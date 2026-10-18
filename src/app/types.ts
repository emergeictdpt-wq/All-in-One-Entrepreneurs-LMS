export type TimelineEntry = {
  id: string;
  title: string;
  date: string;
  description: string;
};

export type EntrepreneurApplication = {
  id: string;
  name: string;
  district: string;
  phone: string;
  sector: string;
  date: string;
  status: string;
  score: number;
  program: "Incubation" | "Acceleration";
  /** which admin-created programme the applicant applied to (set from the landing page card) */
  programId?: string;
  programName?: string;
  isMockup: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  /** National ID (or passport) number. Used with email and phone to reject duplicate applications. */
  nationalId?: string;
  businessName?: string;
  stage?: string;
  gender?: string;
  /** What the entrepreneur said their business does (shown to their mentor). */
  bio?: string;
  rejectionReason?: string;
  rejectedDate?: string;
  feedbackStatus?: string;
  reapplyEligible?: string;
  selectionReason?: string;
  selectedDate?: string;
  /** ── Derived from the programme store in the admin page (never typed in by hand) ── */
  matchState?: "Awaiting mentor" | "Paired" | "Re-match requested";
  pairId?: string;
  matchedMentor?: string;
  matchedMentorId?: string;
  matchScore?: number;
  introDate?: string;
  /** ── Collected on the application form (the Applications table reads these names) ── */
  /** "18-35" or "35+", chosen by the applicant */
  ageGroup?: "18-35" | "35+";
  nationality?: string;
  address?: string;
  region?: string;
  languages?: string;
  youthOwned?: boolean;
  womanOwned?: boolean;
  /** Person with disability */
  pwd?: boolean;
  locationType?: string;
  qualification?: string;
  fieldStudy?: string;
  institution?: string;
  bizExperience?: string;
  whyEntrepreneur?: string;
  yearStarted?: string;
  bizRegStatus?: string;
  targetCustomers?: string;
  bizStage?: string;
  coFounderName?: string;
  coFounderRole?: string;
  /** Everything the applicant filled in, section by section (never the password). */
  submission?: Record<string, unknown>;
};

export type MentorApplication = {
  id: string;
  name: string;
  district: string;
  phone: string;
  expertise: string;
  date: string;
  status: string;
  score: number;
  program: "Incubation" | "Acceleration";
  /** project (admin-created programme) this mentor is attached to; unset = programme-wide mentor pool */
  programId?: string;
  programName?: string;
  isMockup: boolean;
  email?: string;
  /** National ID (or passport) number. Used with email and phone to reject duplicate applications. */
  nationalId?: string;
  title?: string;
  employer?: string;
  gender?: string;
  /** Biography and expertise from the registration form; shown to the mentor's mentees. */
  bio?: string;
  expertiseAreas?: string[];
  location?: string;
  rejectionReason?: string;
  rejectedDate?: string;
  feedbackStatus?: string;
  reapplyEligible?: string;
  selectionReason?: string;
  selectedDate?: string;
  /** Maximum mentees this mentor takes (defaults to 4 when unset). */
  capacity?: number;
  /** ── Derived from the programme store in the admin page ── */
  matchState?: "Awaiting mentee" | "Mentoring" | "At capacity";
  load?: number;
  mentees?: { pairId: string; menteeId?: string; name: string; sector: string; score: number; rematch: boolean; introDate?: string }[];
  /** ── Collected on the registration form (the Applications table reads these names) ── */
  /** "18-35" or "35+", chosen by the applicant */
  ageGroup?: "18-35" | "35+";
  nationality?: string;
  address?: string;
  region?: string;
  languages?: string;
  yearsExp?: string;
  availability?: string;
  qualification?: string;
  institution?: string;
  /** Person with disability */
  pwd?: boolean;
  /** Everything the applicant filled in, section by section (never the password). */
  submission?: Record<string, unknown>;
};

export type AdminProgram = {
  id: string;
  name: string;
  sector: string;
  description: string;
  status: string;
  coverUrl: string;
  duration: string;
  location: string;
  format: string;
  overview: string;
  timelineEntries: TimelineEntry[];
  benefits: string;
  eligibility: string;
  published: boolean;
  /** Optional overrides collected in Program Setup; the public card falls back to the timeline when absent */
  startDate?: string;
  deadline?: string;
  /** number of places in the cohort */
  cohortSize?: number;
  /** id of a Cohort in Cohort Management (the shared store) */
  cohortId?: number;
  /** Programme managers who champion this program (see data/managers.ts). Only they see it in Incubation Management. */
  managerIds?: string[];
  /** Sectors applicants can pick from on this project's entrepreneur application form. Unset = the standard list. */
  applicationSectors?: string[];
};
