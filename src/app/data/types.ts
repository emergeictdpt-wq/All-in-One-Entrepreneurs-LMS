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
  isMockup: boolean;
  email?: string;
  title?: string;
  employer?: string;
  gender?: string;
  /** Biography and expertise from the registration form; shown to the mentor's mentees. */
  bio?: string;
  expertiseAreas?: string[];
  location?: string;
  /** Matching preferences from the registration form (shown on the mentor's own profile). */
  preferredStages?: string[];
  industries?: string[];
  hoursPerMonth?: string;
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
};
