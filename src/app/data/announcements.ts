// Programme announcements and funding opportunities shown on the entrepreneur dashboard.
// SAMPLE CONTENT: the programme team has no page to publish these yet, so they ship as examples dated
// relative to today. When that page exists, replace SAMPLE_ANNOUNCEMENTS and SAMPLE_FUNDING with its data.

import { addDays, todayISO } from "./clock";

export type AnnouncementKind = "Course" | "Funding" | "Event" | "Programme";
export interface Announcement { id: string; kind: AnnouncementKind; title: string; body: string; /** ISO day posted */ at: string }

const ago = (n: number) => addDays(todayISO(), -n);
export const sampleAnnouncements = (): Announcement[] => [
  { id: "a1", kind: "Event", title: "Demo Day registration is open", body: "Founders who have completed Customer Discovery can register to pitch. Ask your mentor to review your deck first.", at: ago(1) },
  { id: "a2", kind: "Course", title: "New course released: Pricing for Early Customers", body: "Four short modules on setting your first prices. It will appear in Tasks and Learning once your mentor assigns it.", at: ago(3) },
  { id: "a3", kind: "Funding", title: "Seed grant call is open", body: "See Funding for the deadline and who can apply.", at: ago(4) },
  { id: "a4", kind: "Programme", title: "Mid-programme reviews start next month", body: "Your programme manager will ask for an up-to-date goal list and evidence for completed tasks.", at: ago(8) },
];

export type FundingType = "Grant" | "Loan" | "Competition" | "Investor";
export interface FundingOpportunity {
  id: string; title: string; funder: string; type: FundingType; amount: string; /** ISO closing day */ deadline: string;
  eligibility: string; /** earliest roadmap step (index) at which it fits */ fromStep: number;
}
const ahead = (n: number) => addDays(todayISO(), n);
export const sampleFunding = (): FundingOpportunity[] => [
  { id: "f1", title: "Seed Grant: Early-Stage Ventures", funder: "Programme partner (sample)", type: "Grant", amount: "Up to MWK 3,000,000", deadline: ahead(12), eligibility: "Registered business with at least one mentor session logged.", fromStep: 1 },
  { id: "f2", title: "Youth Enterprise Loan Window", funder: "Development finance partner (sample)", type: "Loan", amount: "MWK 500,000 to 2,000,000", deadline: ahead(30), eligibility: "Founders aged 18 to 35 with a working prototype or first customers.", fromStep: 4 },
  { id: "f3", title: "Demo Day Pitch Competition", funder: "Emerge Livelihoods (sample)", type: "Competition", amount: "Prize pool MWK 5,000,000", deadline: ahead(45), eligibility: "Completed Customer Discovery and a reviewed pitch deck.", fromStep: 3 },
  { id: "f4", title: "Angel Investor Introductions", funder: "Investor network (sample)", type: "Investor", amount: "Equity, terms vary", deadline: ahead(75), eligibility: "Revenue or strong validation evidence, and an investor-ready deck.", fromStep: 5 },
];
