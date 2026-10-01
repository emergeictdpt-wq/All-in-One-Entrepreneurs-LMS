// Scores are 0-100 and computed from what the applicant actually submitted.
// The admin page treats < 50 as below the cutoff and >= 80 as strong, so the rubric is tuned to that range.

const filled = (v: unknown, min = 1) => typeof v === "string" && v.trim().length >= min;
const num = (v: unknown) => { const m = String(v ?? "").replace(/,/g, "").match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : 0; };
const yes = (v: unknown) => /^(yes|y|true|done|completed|complete|launched|developed|built)/i.test(String(v ?? "").trim());
const pts = (cond: unknown, n: number) => (cond ? n : 0);
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

type Rec = Record<string, any>;

export function scoreEntrepreneur(a: { founder: Rec; business: Rec; team: Rec; needs: Record<string, boolean>; selectedStages: string[] }): number {
  const { founder: f, business: b, team: t, needs, selectedStages } = a;
  // Problem and solution (20)
  const problem = pts(filled(b.problem, 20), 6) + pts(filled(b.whoExperiences, 10), 4) + pts(filled(b.solution, 20), 6) + pts(filled(b.differentiation, 10), 4);
  // Market validation (20)
  const market = pts(num(b.interviewsCompleted) > 0, 6) + pts(num(b.interviewsCompleted) >= 10, 2) + pts(num(b.surveysCompleted) > 0, 4)
    + pts(filled(b.marketResearch, 10), 4) + pts(filled(b.competitors, 5), 4);
  // Traction (25)
  const traction = pts(filled(b.productDeveloped) && !/^no/i.test(b.productDeveloped), 4) + pts(yes(b.prototypeCompleted), 5) + pts(yes(b.mvpLaunched), 5)
    + pts(num(b.customersAcquired) > 0, 4) + pts(num(b.payingCustomers) > 0, 4) + pts(num(b.monthlyRevenue) > 0, 3);
  // Founder (15)
  const founderPts = pts(filled(f.qualification), 3) + pts(filled(f.businessExperience, 5), 4) + pts(filled(f.industryExperience, 3), 3)
    + pts(filled(f.whyEntrepreneur, 15), 3) + pts(filled(f.motivation, 15), 2);
  // Team and readiness (10)
  const readiness = pts(filled(t.coFounderName), 4) + pts(num(b.teamSize) > 1, 3) + pts(filled(b.registrationStatus) && !/^(not|no|unreg)/i.test(b.registrationStatus), 3);
  // Programme fit (10)
  const fit = pts(Object.values(needs).some(Boolean), 5) + pts(selectedStages.length > 0, 3) + pts(filled(b.idealCustomer, 5), 2);
  return clamp(problem + market + traction + founderPts + readiness + fit);
}

export function scoreMentor(a: {
  profile: Rec; bio: Rec; qualifications: Rec[]; experiences: Rec[]; hasMentored: string; mentoringExp: Rec;
  progInterest: string[]; stageExp: string[]; industryExp: string[]; funcExp: string[]; hoursPerMonth: string;
  availability: string[]; mentoringMode: string[]; languages: string[]; ref1: Rec; ref2: Rec; hasCv: boolean; socials: Rec;
}): number {
  const { profile: p, bio, qualifications: q, experiences: e } = a;
  // Professional experience (25)
  const years = num(p.yearsExp);
  const exp = (years >= 10 ? 10 : years >= 5 ? 7 : years > 0 ? 4 : 0) + pts(q.some(x => filled(x.institution)), 5)
    + pts(e.some(x => filled(x.org)), 5) + pts(e.some(x => filled(x.achievements, 10)), 5);
  // Mentoring track record (20)
  const track = pts(a.hasMentored === "yes", 10) + pts(num(a.mentoringExp.years) > 0, 5) + pts(num(a.mentoringExp.startups) > 0, 5);
  // Fit and breadth (20)
  const fit = pts(a.progInterest.length > 0, 5) + pts(a.stageExp.length > 0, 5) + pts(a.industryExp.length > 0, 5) + pts(a.funcExp.length > 0, 5);
  // Commitment (15)
  const hrs = num(a.hoursPerMonth);
  const commit = (hrs >= 6 ? 8 : hrs >= 3 ? 6 : hrs > 0 ? 3 : 0) + pts(a.availability.length > 0, 4) + pts(a.mentoringMode.length > 0, 2) + pts(a.languages.length > 0, 1);
  // Credibility (20)
  const refOk = (r: Rec) => filled(r.name) && filled(r.email);
  const cred = pts(a.hasCv, 6) + pts(refOk(a.ref1), 4) + pts(refOk(a.ref2), 4)
    + pts(filled(a.socials.linkedin) || filled(a.socials.website), 3) + pts(filled(bio.motivation, 20), 2) + pts(filled(bio.biography, 20), 1);
  return clamp(exp + track + fit + commit + cred);
}
