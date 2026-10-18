import { useState } from "react";
import type { EntrepreneurApplication } from "../types";
import { AccountFields, accountProblem } from "./AccountFields";
import { nationalIdProblem, phoneProblem, type ApplicantIdentity, type DuplicateHit } from "../data/duplicates";
import {
  ArrowRight, Check, Rocket, Building, TrendingUp,
  DollarSign, Users, BarChart2, Globe, Zap, Target, ChevronDown
} from "lucide-react";

type GrowthStage = "early" | "growth" | "scaleup" | "investment";

const growthStages: { id: GrowthStage; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { id: "early" as GrowthStage, label: "Early Startup", icon: Rocket,      desc: "Launched, first customers, beginning to generate revenue.", color: "#4C808A" },
  { id: "growth" as GrowthStage, label: "Growth Stage", icon: TrendingUp,  desc: "Revenue growing, team expanding, entering new markets.", color: "#3B4167" },
  { id: "scaleup" as GrowthStage, label: "Scale-Up Stage", icon: Globe,    desc: "Multiple regions, established distribution, operational systems.", color: "#4C808A" },
  { id: "investment" as GrowthStage, label: "Investment Ready", icon: DollarSign, desc: "Preparing to raise external capital, need investor readiness.", color: "#3B4167" },
];

const sections = [
  { id: "stage", label: "Growth Stage", icon: Rocket },
  { id: "stageDetails", label: "Stage Details", icon: Target },
  { id: "company", label: "Company Profile", icon: Building },
  { id: "team", label: "Leadership Team", icon: Users },
  { id: "traction", label: "Commercial Traction", icon: TrendingUp },
  { id: "financials", label: "Financial Performance", icon: DollarSign },
  { id: "kpis", label: "KPIs and Impact", icon: BarChart2 },
  { id: "digital", label: "Digital and Operations", icon: Zap },
  { id: "funding", label: "Funding and Investment", icon: Globe },
  { id: "goals", label: "Growth Goals", icon: Target },
];

const inputCls = "w-full bg-[#0f1528] border border-white/20 rounded-md px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#4C808A] focus:ring-1 focus:ring-[#4C808A]/30 transition-all placeholder-white/30";
const selectCls = inputCls + " appearance-none cursor-pointer";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-white/70 text-[10px] font-semibold uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-[#4C808A] ml-1">*</span>}
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-md border border-white/10 p-6 mb-5">
      <h4 className="text-white font-bold text-sm mb-4 pb-3 border-b border-white/10">{title}</h4>
      {children}
    </div>
  );
}

function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return <div className={`grid gap-4 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>;
}

function YesNo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        {["Yes", "No"].map(v => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`flex-1 py-2 rounded-md text-xs font-bold border transition-all ${value === v ? "border-[#4C808A] bg-[#4C808A]/20 text-[#4C808A]" : "border-white/20 text-white/50 hover:border-white/40"}`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AccelerationApplicationForm({ onBack, onSubmitApplication, checkDuplicate }: { onBack: () => void; onSubmitApplication?: (app: EntrepreneurApplication, password: string) => DuplicateHit | null | void; checkDuplicate?: (who: ApplicantIdentity) => DuplicateHit | null }) {
  const [activeSection, setActiveSection] = useState("stage");
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState("");
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  // Form state
  const [stage, setStage] = useState<GrowthStage | null>(null);
  const [company, setCompany] = useState({ name: "", regNumber: "", taxId: "", dateEstablished: "", country: "Malawi", industry: "", sector: "", businessModel: "", website: "", uniqueValue: "", ip: "", technology: "" });
  const [account, setAccount] = useState({ password: "", confirm: "" });
  const [founder, setFounder] = useState({ name: "", email: "", phone: "", nationalId: "", position: "", education: "", entrepreneurialExp: "", industryYears: "" });
  const [executives, setExecutives] = useState([{ name: "", position: "", department: "", yearsExp: "", responsibilities: "" }]);
  const [traction, setTraction] = useState({ totalCustomers: "", payingCustomers: "", enterpriseCustomers: "", retentionRate: "", markets: "Local", segment: "B2C", competitors: "", competitiveAdvantage: "", marketShare: "" });
  const [financials, setFinancials] = useState({ monthlyRevenue: "", annualRevenue: "", revenueGrowth: "", revenueSources: "", avgMonthlySales: "", grossProfit: "", netProfit: "", cashflow: "" });
  const [kpis, setKpis] = useState({ customersAcquired: "", customerRetention: "", arr: "", conversionRate: "", avgOrderValue: "", fullTimeEmployees: "", partTimeEmployees: "", interns: "", contractors: "", jobsCreated: "", womenEmployed: "", youthEmployed: "", beneficiaries: "" });
  const [digital, setDigital] = useState({ website: "", mobileApp: "", erp: "", crm: "", accountingSoftware: "", ecommerce: "", digitalMarketing: "", productionCapacity: "", supplyChain: "", qualityAssurance: "", sops: "" });
  const [funding, setFunding] = useState({ amountRequired: "", fundingType: "", purpose: "", timeline: "", previousGrants: "", angelInvestment: "", ventureCapital: "", loans: "", bootstrapped: "", valuation: "", capTable: "" });
  const [goals, setGoals] = useState({ objective1: "", objective2: "", objective3: "", baselineRevenue: "", baselineProfit: "", baselineInvestment: "", baselineEmployees: "", baselineCustomers: "", baselineCountries: "", growthBarriers: [] as string[], supportNeeds: [] as string[], mentorPreferences: [] as string[] });

  // Stage-specific dynamic state
  const [stageDetails, setStageDetails] = useState({
    // Early Startup
    productLaunched: "", numCustomers: "", payingCustomers: "", monthlyRevenue: "", registrationStatus: "",
    challengeCustomerAcq: false, challengeMarketing: false, challengeTeamBuilding: false, challengeCashflow: false, challengeProduct: false,
    goalIncreaseCustomers: false, goalIncreaseRevenue: false, goalImproveOps: false, goalPrepareScaling: false,
    // Growth Stage
    revenueGrowth: "", customerGrowth: "", teamSize: "", newMarketsEntered: "", operationalChallenges: "", growthPriorities: "",
    // Scale-Up Stage
    countriesServed: "", distributionChannels: "", numBranches: "", existingPartnerships: "", operationalSystems: "", leadershipStructure: "",
    // Investment Ready
    fundingRequired: "", previousInvestments: "", investorMeetings: "", businessValuation: "", financialProjections: "", pitchReadiness: "",
  });

  const setSD = (k: string, v: string | boolean) => setStageDetails(prev => ({ ...prev, [k]: v }));

  // Duplicate check: the same email, phone number or National ID as an application already in the system is rejected right away.
  const [rejectedAtSubmit, setRejectedAtSubmit] = useState<DuplicateHit | null>(null);
  const duplicate = checkDuplicate?.({ email: founder.email, phone: founder.phone, nationalId: founder.nationalId }) ?? rejectedAtSubmit;
  const submitProblem = !founder.name.trim() ? "Add the founder's full name in Leadership Team."
    : accountProblem("mentee", founder.email, account.password, account.confirm)
    || ((phoneProblem(founder.phone) || nationalIdProblem(founder.nationalId)) && `Leadership Team: ${phoneProblem(founder.phone) || nationalIdProblem(founder.nationalId)}`)
    || duplicate?.message || "";
  const markDone = (id: string) => setCompletedSections(prev => new Set([...prev, id]));
  const readiness = Math.round((completedSections.size / sections.length) * 100);

  const toggleArr = (arr: string[], val: string) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const barrierOptions = ["Sales", "Marketing", "Hiring", "Operations", "Leadership", "Technology", "Finance", "Export", "Manufacturing", "Regulatory Compliance"];
  const supportOptions = ["Scaling Strategy", "Market Expansion", "Export Readiness", "Investment Readiness", "Financial Modelling", "Sales Strategy", "Leadership Development", "Corporate Governance", "Process Improvement", "Product Scaling", "Strategic Partnerships", "Technology Adoption"];
  const mentorOptions = ["Scaling Businesses", "Fundraising", "Venture Capital", "International Markets", "Manufacturing", "Technology", "Legal and Compliance", "Corporate Governance", "Human Resources", "Digital Transformation"];

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1e2340] flex items-center justify-center px-4" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#4C808A]/20 border-2 border-[#4C808A] flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-[#4C808A]" />
          </div>
          <h2 className="text-white font-bold mb-3" style={{ fontSize: "1.5rem" }}>Application Submitted!</h2>
          <p className="text-white/60 text-sm mb-2">
            Thank you, <strong className="text-white">{founder.name || company.name}</strong>. Your Acceleration Program application has been received.
          </p>
          <p className="text-white/60 text-sm mb-8">
            Our investment committee will review your financial data and contact you at your registered details within <strong className="text-white">5 business days</strong>.
          </p>
          {refId && <p className="text-white/60 text-xs mb-6">Your reference number: <strong className="text-white">{refId}</strong>. Keep it to track your application.</p>}
          <div className="bg-white/5 rounded-md border border-white/10 p-6 mb-6 text-left space-y-2.5">
            <h4 className="text-white font-bold text-sm mb-3">Application Summary</h4>
            {[
              { label: "Company", value: company.name || "—" },
              { label: "Stage", value: growthStages.find(s => s.id === stage)?.label || "—" },
              { label: "Sector", value: company.sector || "—" },
              { label: "Monthly Revenue", value: financials.monthlyRevenue || "—" },
              { label: "Team Size", value: kpis.fullTimeEmployees ? `${kpis.fullTimeEmployees} full-time` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs border-b border-white/5 pb-2">
                <span className="text-white/40">{label}</span>
                <span className="text-white font-semibold">{value}</span>
              </div>
            ))}
          </div>
          <button onClick={onBack} className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#4C808A] text-white text-sm font-bold hover:bg-[#3d6b74] transition-all">
            Return to Acceleration Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e2340]" style={{ fontFamily: "Verdana, Geneva, Tahoma, sans-serif" }}>
      {/* Top header */}
      <div className="bg-[#3B4167] border-b border-white/10 px-4 lg:px-8 py-4 flex items-center justify-between pt-20">
        <div>
          <button onClick={onBack} className="text-white/50 hover:text-white text-xs transition-colors mb-1 block">Back to Acceleration Programs</button>
          <h1 className="text-white font-bold text-sm">Acceleration Program Application</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-white/40 uppercase tracking-wide">Readiness Score</div>
            <div className="text-[#4C808A] font-bold text-lg">{readiness}%</div>
          </div>
          <div className="w-16 h-16 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#4C808A" strokeWidth="3"
                strokeDasharray={`${readiness} ${100 - readiness}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-[#4C808A]" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left sidebar */}
        <div className="w-56 shrink-0 bg-[#0f1528] border-r border-white/8 p-4 hidden lg:block">
          <p className="text-white/30 text-[9px] font-bold tracking-widest uppercase mb-4">Sections</p>
          <div className="space-y-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-left transition-all ${
                  activeSection === s.id ? "bg-[#4C808A] text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                <s.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold">{s.label}</span>
                {completedSections.has(s.id) && <Check className="w-3 h-3 ml-auto text-green-400 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="mt-6 p-3 bg-white/5 rounded-md border border-white/10">
            <p className="text-white/40 text-[9px] uppercase tracking-wide mb-2">Completion</p>
            <div className="space-y-1">
              {sections.map(s => (
                <div key={s.id} className={`h-1.5 rounded-full transition-all ${completedSections.has(s.id) ? "bg-[#4C808A]" : "bg-white/10"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Main form area */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* Mobile section tabs */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-6">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold shrink-0 transition-all ${activeSection === s.id ? "bg-[#4C808A] text-white" : "bg-white/8 text-white/50"}`}>
                <s.icon className="w-3 h-3" />
                {s.label}
              </button>
            ))}
          </div>

          {/* STAGE SECTION */}
          {activeSection === "stage" && (
            <div>
              <h2 className="text-white font-bold mb-2" style={{ fontSize: "1.1rem" }}>Business Growth Stage</h2>
              <p className="text-white/50 text-xs mb-6">This determines which fields and questions will be most relevant to your application.</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {growthStages.map(s => (
                  <button key={s.id} type="button" onClick={() => setStage(s.id)}
                    className={`text-left p-5 rounded-md border-2 transition-all ${stage === s.id ? "border-[#4C808A] bg-[#4C808A]/10 shadow-lg shadow-[#4C808A]/10" : "border-white/15 bg-white/3 hover:border-white/30"}`}>
                    <div className="mb-3"><s.icon size={28} color="#4C808A" /></div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-white font-bold text-sm">{s.label}</h3>
                      {stage === s.id && <Check className="w-4 h-4 text-[#4C808A]" />}
                    </div>
                    <p className="text-white/40 text-[10px] leading-relaxed">{s.desc}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => { markDone("stage"); setActiveSection("stageDetails"); }}
                disabled={!stage}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-md text-xs font-bold text-white transition-all ${stage ? "bg-[#4C808A] hover:bg-[#3d6b74]" : "bg-white/10 cursor-not-allowed opacity-50"}`}>
                Save and Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* STAGE DETAILS SECTION */}
          {activeSection === "stageDetails" && (
            <div>
              <h2 className="text-white font-bold mb-1" style={{ fontSize: "1.1rem" }}>
                {growthStages.find(s => s.id === stage)?.label} — Stage Details
              </h2>
              <p className="text-white/50 text-xs mb-6">Answer the questions specific to your current business stage. These help our selection panel assess your readiness for acceleration.</p>

              {/* EARLY STARTUP */}
              {stage === "early" && (
                <div className="space-y-5">
                  <Card title="Current Status">
                    <Grid cols={3}>
                      <YesNo label="Product launched?" value={stageDetails.productLaunched} onChange={v => setSD("productLaunched", v)} />
                      <div><Label required>Number of Customers</Label><input type="number" className={inputCls} value={stageDetails.numCustomers} onChange={e => setSD("numCustomers", e.target.value)} placeholder="Total customers to date" /></div>
                      <div><Label required>Paying Customers</Label><input type="number" className={inputCls} value={stageDetails.payingCustomers} onChange={e => setSD("payingCustomers", e.target.value)} placeholder="Currently paying" /></div>
                      <div><Label required>Monthly Revenue (MK)</Label><input className={inputCls} value={stageDetails.monthlyRevenue} onChange={e => setSD("monthlyRevenue", e.target.value)} placeholder="MK 450,000" /></div>
                      <div className="sm:col-span-2">
                        <Label>Business Registration Status</Label>
                        <div className="relative">
                          <select className={selectCls} value={stageDetails.registrationStatus} onChange={e => setSD("registrationStatus", e.target.value)}>
                            <option value="">Select status</option>
                            <option>Not yet registered</option>
                            <option>Registration in progress</option>
                            <option>Registered — sole trader</option>
                            <option>Registered — limited company</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                        </div>
                      </div>
                    </Grid>
                  </Card>

                  <Card title="Current Challenges — Select All That Apply">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { key: "challengeCustomerAcq", label: "Customer Acquisition" },
                        { key: "challengeMarketing", label: "Marketing" },
                        { key: "challengeTeamBuilding", label: "Team Building" },
                        { key: "challengeCashflow", label: "Cash Flow" },
                        { key: "challengeProduct", label: "Product Refinement" },
                      ].map(({ key, label }) => (
                        <button key={key} type="button" onClick={() => setSD(key, !stageDetails[key as keyof typeof stageDetails])}
                          className={`p-3 rounded-md border text-[10px] font-semibold text-left transition-all ${stageDetails[key as keyof typeof stageDetails] ? "border-[#4C808A] bg-[#4C808A]/15 text-[#4C808A]" : "border-white/15 text-white/40 hover:border-white/30"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card title="Goals During Acceleration — Select All That Apply">
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                      {[
                        { key: "goalIncreaseCustomers", label: "Increase customers" },
                        { key: "goalIncreaseRevenue", label: "Increase revenue" },
                        { key: "goalImproveOps", label: "Improve operations" },
                        { key: "goalPrepareScaling", label: "Prepare for scaling" },
                      ].map(({ key, label }) => (
                        <button key={key} type="button" onClick={() => setSD(key, !stageDetails[key as keyof typeof stageDetails])}
                          className={`p-3 rounded-md border text-[10px] font-semibold text-left transition-all ${stageDetails[key as keyof typeof stageDetails] ? "border-[#4C808A] bg-[#4C808A]/15 text-[#4C808A]" : "border-white/15 text-white/40 hover:border-white/30"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* GROWTH STAGE */}
              {stage === "growth" && (
                <div className="space-y-5">
                  <Card title="Growth Metrics">
                    <Grid cols={3}>
                      <div><Label required>Revenue Growth Rate (%)</Label><input type="number" className={inputCls} value={stageDetails.revenueGrowth} onChange={e => setSD("revenueGrowth", e.target.value)} placeholder="65" /></div>
                      <div><Label required>Customer Growth Rate (%)</Label><input type="number" className={inputCls} value={stageDetails.customerGrowth} onChange={e => setSD("customerGrowth", e.target.value)} placeholder="40" /></div>
                      <div><Label required>Current Team Size</Label><input type="number" className={inputCls} value={stageDetails.teamSize} onChange={e => setSD("teamSize", e.target.value)} placeholder="Full-time headcount" /></div>
                      <div className="sm:col-span-3"><Label>New Markets Entered (last 12 months)</Label><input className={inputCls} value={stageDetails.newMarketsEntered} onChange={e => setSD("newMarketsEntered", e.target.value)} placeholder="Lilongwe, Blantyre, Zomba — or export markets" /></div>
                    </Grid>
                  </Card>
                  <Card title="Challenges and Priorities">
                    <div className="space-y-4">
                      <div><Label>Operational Challenges</Label><textarea className={inputCls + " resize-none"} rows={2} value={stageDetails.operationalChallenges} onChange={e => setSD("operationalChallenges", e.target.value)} placeholder="What bottlenecks are slowing your growth?" /></div>
                      <div><Label>Growth Priorities for Acceleration</Label><textarea className={inputCls + " resize-none"} rows={2} value={stageDetails.growthPriorities} onChange={e => setSD("growthPriorities", e.target.value)} placeholder="What are your top 2–3 priorities during this program?" /></div>
                    </div>
                  </Card>
                </div>
              )}

              {/* SCALE-UP STAGE */}
              {stage === "scaleup" && (
                <div className="space-y-5">
                  <Card title="Scale and Reach">
                    <Grid>
                      <div><Label required>Countries / Regions Served</Label><input className={inputCls} value={stageDetails.countriesServed} onChange={e => setSD("countriesServed", e.target.value)} placeholder="Malawi, Zambia, Mozambique" /></div>
                      <div><Label>Number of Branches / Locations</Label><input type="number" className={inputCls} value={stageDetails.numBranches} onChange={e => setSD("numBranches", e.target.value)} placeholder="4" /></div>
                      <div><Label>Distribution Channels</Label><input className={inputCls} value={stageDetails.distributionChannels} onChange={e => setSD("distributionChannels", e.target.value)} placeholder="Agents, online, retail, wholesale" /></div>
                      <div><Label>Existing Strategic Partnerships</Label><input className={inputCls} value={stageDetails.existingPartnerships} onChange={e => setSD("existingPartnerships", e.target.value)} placeholder="Airtel, TNM, Shoprite, government agencies" /></div>
                    </Grid>
                  </Card>
                  <Card title="Operations and Leadership">
                    <div className="space-y-4">
                      <div><Label>Operational Systems in Place</Label><input className={inputCls} value={stageDetails.operationalSystems} onChange={e => setSD("operationalSystems", e.target.value)} placeholder="ERP, CRM, HR systems, SOPs, ISO certification" /></div>
                      <div><Label>Leadership Structure</Label><textarea className={inputCls + " resize-none"} rows={2} value={stageDetails.leadershipStructure} onChange={e => setSD("leadershipStructure", e.target.value)} placeholder="Describe your executive team structure and governance" /></div>
                    </div>
                  </Card>
                </div>
              )}

              {/* INVESTMENT READY */}
              {stage === "investment" && (
                <div className="space-y-5">
                  <Card title="Investment Requirements">
                    <Grid>
                      <div><Label required>Total Funding Required (MK)</Label><input className={inputCls} value={stageDetails.fundingRequired} onChange={e => setSD("fundingRequired", e.target.value)} placeholder="MK 15,000,000" /></div>
                      <div><Label>Business Valuation (MK)</Label><input className={inputCls} value={stageDetails.businessValuation} onChange={e => setSD("businessValuation", e.target.value)} placeholder="MK 75,000,000" /></div>
                    </Grid>
                  </Card>
                  <Card title="Investment History and Readiness">
                    <div className="space-y-4">
                      <div><Label>Previous Investments Received</Label><input className={inputCls} value={stageDetails.previousInvestments} onChange={e => setSD("previousInvestments", e.target.value)} placeholder="MK 2M angel, MK 500K grant from UNDP" /></div>
                      <div><Label>Investor Meetings Completed (last 6 months)</Label><input type="number" className={inputCls} value={stageDetails.investorMeetings} onChange={e => setSD("investorMeetings", e.target.value)} placeholder="8" /></div>
                      <div><Label>Financial Projections Available?</Label>
                        <div className="flex gap-2 mt-1.5">
                          {["Yes — 3-year model ready", "Yes — 1-year only", "In progress", "Not yet"].map(v => (
                            <button key={v} type="button" onClick={() => setSD("financialProjections", v)}
                              className={`flex-1 py-2 rounded-md border text-[9px] font-bold transition-all text-center ${stageDetails.financialProjections === v ? "border-[#4C808A] bg-[#4C808A]/20 text-[#4C808A]" : "border-white/20 text-white/40 hover:border-white/40"}`}>{v}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Pitch Readiness</Label>
                        <div className="flex gap-2 mt-1.5">
                          {["Pitch deck ready", "Deck in progress", "Not started"].map(v => (
                            <button key={v} type="button" onClick={() => setSD("pitchReadiness", v)}
                              className={`flex-1 py-2 rounded-md border text-[10px] font-bold transition-all ${stageDetails.pitchReadiness === v ? "border-[#4C808A] bg-[#4C808A]/20 text-[#4C808A]" : "border-white/20 text-white/40 hover:border-white/40"}`}>{v}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              <button onClick={() => { markDone("stageDetails"); setActiveSection("company"); }}
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-md text-xs font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all">
                Save and Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* COMPANY SECTION */}
          {activeSection === "company" && (
            <div>
              <h2 className="text-white font-bold mb-2" style={{ fontSize: "1.1rem" }}>Company Profile</h2>
              <p className="text-white/50 text-xs mb-6">Legal and business registration details of your startup.</p>

              <Card title="Registration Details">
                <Grid>
                  <div><Label required>Business Name</Label><input className={inputCls} value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} placeholder="SwiftPay Malawi Ltd" /></div>
                  <div><Label>Registration Number</Label><input className={inputCls} value={company.regNumber} onChange={e => setCompany(c => ({ ...c, regNumber: e.target.value }))} placeholder="MB/2023/001" /></div>
                  <div><Label>Tax Identification Number</Label><input className={inputCls} value={company.taxId} onChange={e => setCompany(c => ({ ...c, taxId: e.target.value }))} placeholder="TIN-12345678" /></div>
                  <div><Label>Date Established</Label><input type="date" className={inputCls} value={company.dateEstablished} onChange={e => setCompany(c => ({ ...c, dateEstablished: e.target.value }))} /></div>
                  <div>
                    <Label required>Industry</Label>
                    <div className="relative">
                      <select className={selectCls} value={company.industry} onChange={e => setCompany(c => ({ ...c, industry: e.target.value }))}>
                        <option value="">Select industry</option>
                        {["Agriculture", "Technology and ICT", "Health", "Education", "Manufacturing", "Trade", "Creative Industries", "Tourism", "Financial Services", "Energy and Environment"].map(i => <option key={i}>{i}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                    </div>
                  </div>
                  <div><Label>Website</Label><input className={inputCls} value={company.website} onChange={e => setCompany(c => ({ ...c, website: e.target.value }))} placeholder="https://yoursite.com" /></div>
                </Grid>
              </Card>

              <Card title="Product and Value Proposition">
                <div className="space-y-4">
                  <div><Label required>Unique Value Proposition</Label><textarea className={inputCls + " resize-none"} rows={2} value={company.uniqueValue} onChange={e => setCompany(c => ({ ...c, uniqueValue: e.target.value }))} placeholder="What makes your product or service uniquely valuable?" /></div>
                  <div><Label>Intellectual Property (patents, trademarks, copyrights)</Label><input className={inputCls} value={company.ip} onChange={e => setCompany(c => ({ ...c, ip: e.target.value }))} placeholder="Describe any IP you hold" /></div>
                  <div><Label>Key Technology Used</Label><input className={inputCls} value={company.technology} onChange={e => setCompany(c => ({ ...c, technology: e.target.value }))} placeholder="Mobile app, USSD, AI, IoT" /></div>
                </div>
              </Card>

              <button onClick={() => { markDone("company"); setActiveSection("team"); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-xs font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all">
                Save and Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TEAM SECTION */}
          {activeSection === "team" && (
            <div>
              <h2 className="text-white font-bold mb-2" style={{ fontSize: "1.1rem" }}>Leadership Team</h2>
              <p className="text-white/50 text-xs mb-6">Acceleration evaluates the team's ability to scale — not just the idea.</p>

              <Card title="Founder / CEO">
                <Grid>
                  <div><Label required>Full Name</Label><input className={inputCls} value={founder.name} onChange={e => setFounder(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" /></div>
                  <div><Label required>Email</Label><input type="email" className={inputCls} value={founder.email} onChange={e => setFounder(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" /></div>
                  <div><Label required>Phone Number</Label><input type="tel" className={inputCls} value={founder.phone} onChange={e => setFounder(f => ({ ...f, phone: e.target.value }))} placeholder="+265 88 000 0000" /></div>
                  <div><Label required>National ID Number</Label><input className={inputCls} value={founder.nationalId} onChange={e => { setRejectedAtSubmit(null); setFounder(f => ({ ...f, nationalId: e.target.value })); }} placeholder="e.g. V32N6SM4" /></div>
                  {duplicate && <p role="alert" className="md:col-span-2 text-xs rounded-md px-3 py-2.5 border border-red-400/40 bg-red-500/10 text-red-300">{duplicate.message}</p>}
                  <AccountFields role="mentee" variant="dark" email={founder.email} password={account.password} confirm={account.confirm} onChange={setAccount} />
                  <div><Label>Position</Label><input className={inputCls} value={founder.position} onChange={e => setFounder(f => ({ ...f, position: e.target.value }))} placeholder="CEO and Co-founder" /></div>
                  <div><Label>Highest Education</Label><input className={inputCls} value={founder.education} onChange={e => setFounder(f => ({ ...f, education: e.target.value }))} placeholder="MBA, Finance" /></div>
                  <div><Label>Entrepreneurial Experience</Label><input className={inputCls} value={founder.entrepreneurialExp} onChange={e => setFounder(f => ({ ...f, entrepreneurialExp: e.target.value }))} placeholder="3 previous ventures" /></div>
                  <div><Label>Years in Industry</Label><input type="number" className={inputCls} value={founder.industryYears} onChange={e => setFounder(f => ({ ...f, industryYears: e.target.value }))} placeholder="8" /></div>
                </Grid>
              </Card>

              <Card title="Executive Team Members">
                <p className="text-white/40 text-[10px] mb-4">Add key executives (CEO, COO, CTO, CFO, Marketing Lead, Sales Lead, etc.)</p>
                {executives.map((exec, i) => (
                  <div key={i} className="bg-white/5 rounded-md p-4 mb-3 border border-white/10">
                    <div className="text-white/40 text-[10px] font-bold uppercase mb-3">Executive {i + 1}</div>
                    <Grid cols={3}>
                      <div><Label>Name</Label><input className={inputCls} value={exec.name} onChange={e => setExecutives(ex => ex.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Full name" /></div>
                      <div><Label>Position</Label><input className={inputCls} value={exec.position} onChange={e => setExecutives(ex => ex.map((x, j) => j === i ? { ...x, position: e.target.value } : x))} placeholder="CTO" /></div>
                      <div><Label>Years Experience</Label><input type="number" className={inputCls} value={exec.yearsExp} onChange={e => setExecutives(ex => ex.map((x, j) => j === i ? { ...x, yearsExp: e.target.value } : x))} placeholder="5" /></div>
                    </Grid>
                    <div className="mt-3"><Label>Key Responsibilities</Label><input className={inputCls} value={exec.responsibilities} onChange={e => setExecutives(ex => ex.map((x, j) => j === i ? { ...x, responsibilities: e.target.value } : x))} placeholder="Main duties and areas of ownership" /></div>
                  </div>
                ))}
                <button type="button" onClick={() => setExecutives(ex => [...ex, { name: "", position: "", department: "", yearsExp: "", responsibilities: "" }])}
                  className="text-[#4C808A] text-xs font-bold hover:text-white transition-colors">+ Add Another Executive</button>
              </Card>

              <button onClick={() => { markDone("team"); setActiveSection("traction"); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-xs font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all">
                Save and Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TRACTION SECTION */}
          {activeSection === "traction" && (
            <div>
              <h2 className="text-white font-bold mb-2" style={{ fontSize: "1.1rem" }}>Commercial Traction</h2>
              <p className="text-white/50 text-xs mb-6">Evidence that the market wants your product. This is the heart of an acceleration application.</p>

              <Card title="Customer Data">
                <Grid cols={3}>
                  <div><Label required>Total Customers</Label><input type="number" className={inputCls} value={traction.totalCustomers} onChange={e => setTraction(t => ({ ...t, totalCustomers: e.target.value }))} placeholder="All-time total" /></div>
                  <div><Label required>Paying Customers</Label><input type="number" className={inputCls} value={traction.payingCustomers} onChange={e => setTraction(t => ({ ...t, payingCustomers: e.target.value }))} placeholder="Active paying" /></div>
                  <div><Label>Enterprise / B2B Customers</Label><input type="number" className={inputCls} value={traction.enterpriseCustomers} onChange={e => setTraction(t => ({ ...t, enterpriseCustomers: e.target.value }))} placeholder="If applicable" /></div>
                  <div><Label>Customer Retention Rate (%)</Label><input type="number" className={inputCls} value={traction.retentionRate} onChange={e => setTraction(t => ({ ...t, retentionRate: e.target.value }))} placeholder="78" /></div>
                </Grid>
              </Card>

              <Card title="Market and Competition">
                <div className="space-y-4">
                  <div>
                    <Label>Market Reach</Label>
                    <div className="flex gap-2 flex-wrap">
                      {["Local", "Regional", "International"].map(v => (
                        <button key={v} type="button" onClick={() => setTraction(t => ({ ...t, markets: v }))}
                          className={`px-4 py-2 rounded-md text-xs font-bold border transition-all ${traction.markets === v ? "border-[#4C808A] bg-[#4C808A]/20 text-[#4C808A]" : "border-white/20 text-white/50 hover:border-white/40"}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Customer Segment</Label>
                    <div className="flex gap-2 flex-wrap">
                      {["B2C", "B2B", "Government", "NGOs", "Mixed"].map(v => (
                        <button key={v} type="button" onClick={() => setTraction(t => ({ ...t, segment: v }))}
                          className={`px-4 py-2 rounded-md text-xs font-bold border transition-all ${traction.segment === v ? "border-[#4C808A] bg-[#4C808A]/20 text-[#4C808A]" : "border-white/20 text-white/50 hover:border-white/40"}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <Grid>
                    <div><Label>Main Competitors (3 max)</Label><input className={inputCls} value={traction.competitors} onChange={e => setTraction(t => ({ ...t, competitors: e.target.value }))} placeholder="Airtel Money, TNM Mpamba" /></div>
                    <div><Label>Estimated Market Share (%)</Label><input type="number" className={inputCls} value={traction.marketShare} onChange={e => setTraction(t => ({ ...t, marketShare: e.target.value }))} placeholder="5" /></div>
                  </Grid>
                  <div><Label>Competitive Advantage</Label><textarea className={inputCls + " resize-none"} rows={2} value={traction.competitiveAdvantage} onChange={e => setTraction(t => ({ ...t, competitiveAdvantage: e.target.value }))} placeholder="Why do customers choose you over competitors?" /></div>
                </div>
              </Card>

              <button onClick={() => { markDone("traction"); setActiveSection("financials"); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-xs font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all">
                Save and Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* FINANCIALS SECTION */}
          {activeSection === "financials" && (
            <div>
              <h2 className="text-white font-bold mb-2" style={{ fontSize: "1.1rem" }}>Financial Performance</h2>
              <p className="text-white/50 text-xs mb-6">Accurate financials are required. All data is treated confidentially.</p>

              <Card title="Revenue">
                <Grid cols={3}>
                  <div><Label required>Monthly Revenue (MK)</Label><input className={inputCls} value={financials.monthlyRevenue} onChange={e => setFinancials(f => ({ ...f, monthlyRevenue: e.target.value }))} placeholder="MK 2,500,000" /></div>
                  <div><Label>Annual Revenue (MK)</Label><input className={inputCls} value={financials.annualRevenue} onChange={e => setFinancials(f => ({ ...f, annualRevenue: e.target.value }))} placeholder="MK 30,000,000" /></div>
                  <div><Label>Revenue Growth Rate (%)</Label><input type="number" className={inputCls} value={financials.revenueGrowth} onChange={e => setFinancials(f => ({ ...f, revenueGrowth: e.target.value }))} placeholder="45" /></div>
                  <div className="sm:col-span-3"><Label>Revenue Sources</Label><input className={inputCls} value={financials.revenueSources} onChange={e => setFinancials(f => ({ ...f, revenueSources: e.target.value }))} placeholder="Product sales 60%, Subscriptions 30%, Services 10%" /></div>
                </Grid>
              </Card>

              <Card title="Profitability and Cash Flow">
                <Grid cols={3}>
                  <div><Label>Gross Profit (MK)</Label><input className={inputCls} value={financials.grossProfit} onChange={e => setFinancials(f => ({ ...f, grossProfit: e.target.value }))} placeholder="MK 1,200,000" /></div>
                  <div><Label>Net Profit / Loss (MK)</Label><input className={inputCls} value={financials.netProfit} onChange={e => setFinancials(f => ({ ...f, netProfit: e.target.value }))} placeholder="Positive or negative" /></div>
                  <div>
                    <Label>Cash Flow Status</Label>
                    <div className="relative">
                      <select className={selectCls} value={financials.cashflow} onChange={e => setFinancials(f => ({ ...f, cashflow: e.target.value }))}>
                        <option value="">Select</option>
                        <option>Positive — generating surplus</option>
                        <option>Break-even</option>
                        <option>Negative — burning cash</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                    </div>
                  </div>
                </Grid>
              </Card>

              <button onClick={() => { markDone("financials"); setActiveSection("kpis"); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-xs font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all">
                Save and Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* KPIs SECTION */}
          {activeSection === "kpis" && (
            <div>
              <h2 className="text-white font-bold mb-2" style={{ fontSize: "1.1rem" }}>KPIs and Impact</h2>
              <p className="text-white/50 text-xs mb-6">These metrics become your baseline against which program impact will be measured.</p>

              <Card title="Business KPIs">
                <Grid cols={3}>
                  <div><Label>Customers Acquired (last 3 months)</Label><input type="number" className={inputCls} value={kpis.customersAcquired} onChange={e => setKpis(k => ({ ...k, customersAcquired: e.target.value }))} placeholder="120" /></div>
                  <div><Label>Customer Retention Rate (%)</Label><input type="number" className={inputCls} value={kpis.customerRetention} onChange={e => setKpis(k => ({ ...k, customerRetention: e.target.value }))} placeholder="72" /></div>
                  <div><Label>Annual Recurring Revenue (MK)</Label><input className={inputCls} value={kpis.arr} onChange={e => setKpis(k => ({ ...k, arr: e.target.value }))} placeholder="If subscription model" /></div>
                  <div><Label>Conversion Rate (%)</Label><input type="number" className={inputCls} value={kpis.conversionRate} onChange={e => setKpis(k => ({ ...k, conversionRate: e.target.value }))} placeholder="8" /></div>
                  <div><Label>Average Order Value (MK)</Label><input className={inputCls} value={kpis.avgOrderValue} onChange={e => setKpis(k => ({ ...k, avgOrderValue: e.target.value }))} placeholder="MK 45,000" /></div>
                </Grid>
              </Card>

              <Card title="Employment KPIs">
                <Grid cols={2}>
                  <div><Label required>Full-Time Employees</Label><input type="number" className={inputCls} value={kpis.fullTimeEmployees} onChange={e => setKpis(k => ({ ...k, fullTimeEmployees: e.target.value }))} placeholder="12" /></div>
                  <div><Label>Part-Time Employees</Label><input type="number" className={inputCls} value={kpis.partTimeEmployees} onChange={e => setKpis(k => ({ ...k, partTimeEmployees: e.target.value }))} placeholder="5" /></div>
                  <div><Label>Interns</Label><input type="number" className={inputCls} value={kpis.interns} onChange={e => setKpis(k => ({ ...k, interns: e.target.value }))} placeholder="3" /></div>
                  <div><Label>Contractors / Freelancers</Label><input type="number" className={inputCls} value={kpis.contractors} onChange={e => setKpis(k => ({ ...k, contractors: e.target.value }))} placeholder="4" /></div>
                </Grid>
              </Card>

              <Card title="Impact KPIs (for donor reporting)">
                <Grid cols={2}>
                  <div><Label>Total Jobs Created</Label><input type="number" className={inputCls} value={kpis.jobsCreated} onChange={e => setKpis(k => ({ ...k, jobsCreated: e.target.value }))} placeholder="Since founding" /></div>
                  <div><Label>Women Employed</Label><input type="number" className={inputCls} value={kpis.womenEmployed} onChange={e => setKpis(k => ({ ...k, womenEmployed: e.target.value }))} placeholder="Number" /></div>
                  <div><Label>Youth Employed (under 35)</Label><input type="number" className={inputCls} value={kpis.youthEmployed} onChange={e => setKpis(k => ({ ...k, youthEmployed: e.target.value }))} placeholder="Number" /></div>
                  <div><Label>Beneficiaries Served</Label><input type="number" className={inputCls} value={kpis.beneficiaries} onChange={e => setKpis(k => ({ ...k, beneficiaries: e.target.value }))} placeholder="Total people impacted" /></div>
                </Grid>
              </Card>

              <button onClick={() => { markDone("kpis"); setActiveSection("digital"); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-xs font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all">
                Save and Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* DIGITAL SECTION */}
          {activeSection === "digital" && (
            <div>
              <h2 className="text-white font-bold mb-2" style={{ fontSize: "1.1rem" }}>Digital Maturity and Operations</h2>
              <p className="text-white/50 text-xs mb-6">Assess how ready your business systems and operations are for scale.</p>

              <Card title="Digital Systems">
                <Grid cols={3}>
                  <YesNo label="Do you have a website?" value={digital.website} onChange={v => setDigital(d => ({ ...d, website: v }))} />
                  <YesNo label="Mobile app?" value={digital.mobileApp} onChange={v => setDigital(d => ({ ...d, mobileApp: v }))} />
                  <YesNo label="ERP system?" value={digital.erp} onChange={v => setDigital(d => ({ ...d, erp: v }))} />
                  <YesNo label="CRM system?" value={digital.crm} onChange={v => setDigital(d => ({ ...d, crm: v }))} />
                  <YesNo label="Accounting software?" value={digital.accountingSoftware} onChange={v => setDigital(d => ({ ...d, accountingSoftware: v }))} />
                  <YesNo label="E-commerce platform?" value={digital.ecommerce} onChange={v => setDigital(d => ({ ...d, ecommerce: v }))} />
                </Grid>
                <div className="mt-4"><Label>Digital Marketing Tools Used</Label><input className={inputCls} value={digital.digitalMarketing} onChange={e => setDigital(d => ({ ...d, digitalMarketing: e.target.value }))} placeholder="Meta Ads, Google Ads, WhatsApp Business, Mailchimp" /></div>
              </Card>

              <Card title="Operational Capacity">
                <div className="space-y-4">
                  <div><Label>Current Production / Service Capacity</Label><input className={inputCls} value={digital.productionCapacity} onChange={e => setDigital(d => ({ ...d, productionCapacity: e.target.value }))} placeholder="500 units/month or 200 clients/month" /></div>
                  <div><Label>Key Supply Chain Partners</Label><input className={inputCls} value={digital.supplyChain} onChange={e => setDigital(d => ({ ...d, supplyChain: e.target.value }))} placeholder="Suppliers, distributors, logistics" /></div>
                  <Grid>
                    <YesNo label="Quality Assurance Systems?" value={digital.qualityAssurance} onChange={v => setDigital(d => ({ ...d, qualityAssurance: v }))} />
                    <YesNo label="Standard Operating Procedures (SOPs)?" value={digital.sops} onChange={v => setDigital(d => ({ ...d, sops: v }))} />
                  </Grid>
                </div>
              </Card>

              <button onClick={() => { markDone("digital"); setActiveSection("funding"); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-xs font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all">
                Save and Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* FUNDING SECTION */}
          {activeSection === "funding" && (
            <div>
              <h2 className="text-white font-bold mb-2" style={{ fontSize: "1.1rem" }}>Funding and Investment</h2>
              <p className="text-white/50 text-xs mb-6">This section is unique to acceleration. Detail your capital requirements and investment history.</p>

              <Card title="Capital Requirements">
                <div className="space-y-4">
                  <Grid>
                    <div><Label required>Funding Amount Required (MK)</Label><input className={inputCls} value={funding.amountRequired} onChange={e => setFunding(f => ({ ...f, amountRequired: e.target.value }))} placeholder="MK 10,000,000" /></div>
                    <div>
                      <Label>Type of Funding Sought</Label>
                      <div className="relative">
                        <select className={selectCls} value={funding.fundingType} onChange={e => setFunding(f => ({ ...f, fundingType: e.target.value }))}>
                          <option value="">Select type</option>
                          <option>Grant (non-dilutive)</option>
                          <option>Equity investment</option>
                          <option>Debt financing</option>
                          <option>Convertible note</option>
                          <option>Mixed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                      </div>
                    </div>
                  </Grid>
                  <div><Label>Purpose of Funding</Label><textarea className={inputCls + " resize-none"} rows={2} value={funding.purpose} onChange={e => setFunding(f => ({ ...f, purpose: e.target.value }))} placeholder="How will you use this capital?" /></div>
                  <div>
                    <Label>Funding Timeline</Label>
                    <div className="flex gap-2 flex-wrap">
                      {["0–3 months", "3–6 months", "6–12 months", "12+ months"].map(v => (
                        <button key={v} type="button" onClick={() => setFunding(f => ({ ...f, timeline: v }))}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold border transition-all ${funding.timeline === v ? "border-[#4C808A] bg-[#4C808A]/20 text-[#4C808A]" : "border-white/20 text-white/50 hover:border-white/40"}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Previous Investment History">
                <Grid cols={3}>
                  <YesNo label="Previous grants received?" value={funding.previousGrants} onChange={v => setFunding(f => ({ ...f, previousGrants: v }))} />
                  <YesNo label="Angel investment?" value={funding.angelInvestment} onChange={v => setFunding(f => ({ ...f, angelInvestment: v }))} />
                  <YesNo label="Venture capital?" value={funding.ventureCapital} onChange={v => setFunding(f => ({ ...f, ventureCapital: v }))} />
                  <YesNo label="Bank loans?" value={funding.loans} onChange={v => setFunding(f => ({ ...f, loans: v }))} />
                  <YesNo label="Bootstrapped (self-funded)?" value={funding.bootstrapped} onChange={v => setFunding(f => ({ ...f, bootstrapped: v }))} />
                </Grid>
              </Card>

              <Card title="Valuation">
                <Grid>
                  <div><Label>Estimated Business Valuation (MK)</Label><input className={inputCls} value={funding.valuation} onChange={e => setFunding(f => ({ ...f, valuation: e.target.value }))} placeholder="MK 50,000,000" /></div>
                  <div><Label>Shareholding / Cap Table Summary</Label><input className={inputCls} value={funding.capTable} onChange={e => setFunding(f => ({ ...f, capTable: e.target.value }))} placeholder="Founder 70%, Co-founder 30%" /></div>
                </Grid>
              </Card>

              <button onClick={() => { markDone("funding"); setActiveSection("goals"); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-xs font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all">
                Save and Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* GOALS SECTION */}
          {activeSection === "goals" && (
            <div>
              <h2 className="text-white font-bold mb-2" style={{ fontSize: "1.1rem" }}>Growth Goals and Support Needs</h2>
              <p className="text-white/50 text-xs mb-6">Define what success looks like for you during this acceleration program.</p>

              <Card title="Measurable Growth Objectives">
                <p className="text-white/40 text-[10px] mb-4">State 3 specific, measurable goals you want to achieve during the program (e.g. Double revenue, Enter 2 new markets, Raise MK 10M)</p>
                <div className="space-y-3">
                  {["1", "2", "3"].map((n, i) => (
                    <div key={n} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#4C808A] flex items-center justify-center text-white text-[10px] font-bold shrink-0">{n}</div>
                      <input className={inputCls} value={[goals.objective1, goals.objective2, goals.objective3][i]}
                        onChange={e => setGoals(g => ({ ...g, [`objective${n}`]: e.target.value }))}
                        placeholder={`Goal ${n} — describe your target milestone`} />
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Growth Barriers — Select Your Top Challenges">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {barrierOptions.map(b => (
                    <button key={b} type="button"
                      onClick={() => setGoals(g => ({ ...g, growthBarriers: toggleArr(g.growthBarriers, b) }))}
                      className={`text-left p-2.5 rounded-md border text-[10px] font-semibold transition-all ${goals.growthBarriers.includes(b) ? "border-[#4C808A] bg-[#4C808A]/15 text-[#4C808A]" : "border-white/15 text-white/40 hover:border-white/30"}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </Card>

              <Card title="Support Needed — Rank Your Top Priorities">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {supportOptions.map(s => (
                    <button key={s} type="button"
                      onClick={() => setGoals(g => ({ ...g, supportNeeds: toggleArr(g.supportNeeds, s) }))}
                      className={`text-left p-2.5 rounded-md border text-[10px] font-semibold transition-all ${goals.supportNeeds.includes(s) ? "border-[#4C808A] bg-[#4C808A]/15 text-[#4C808A]" : "border-white/15 text-white/40 hover:border-white/30"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </Card>

              <Card title="Mentor Preferences">
                <p className="text-white/40 text-[10px] mb-3">Select areas where you want mentor expertise</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {mentorOptions.map(m => (
                    <button key={m} type="button"
                      onClick={() => setGoals(g => ({ ...g, mentorPreferences: toggleArr(g.mentorPreferences, m) }))}
                      className={`text-left p-2.5 rounded-md border text-[10px] font-semibold transition-all ${goals.mentorPreferences.includes(m) ? "border-[#4C808A] bg-[#4C808A]/15 text-[#4C808A]" : "border-white/15 text-white/40 hover:border-white/30"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </Card>

              <div className="bg-white/5 rounded-md border border-white/10 p-4 mb-5 text-center">
                <p className="text-white/40 text-[10px] leading-relaxed">
                  By submitting I confirm that all information is accurate. I understand that Emerge Livelihoods may request supporting documents including audited financials, bank statements and company registration certificates.
                </p>
              </div>

              {submitProblem && <p className="text-xs text-[#f59e0b] mb-3">{submitProblem}</p>}
              <button
                disabled={!!submitProblem}
                onClick={() => {
                  if (submitProblem) return;
                  const newId = `ACC-${Date.now()}`;
                  const rejected = onSubmitApplication?.({
                    id: newId,
                    name: founder.name,
                    district: "",
                    phone: founder.phone,
                    sector: company.sector || company.industry || "Other",
                    date: new Date().toISOString().split("T")[0],
                    status: "Pending",
                    score: 0,
                    program: "Acceleration",
                    isMockup: false,
                    email: founder.email,
                    nationalId: founder.nationalId,
                    businessName: company.name,
                    stage: stage ?? undefined,
                  }, account.password);
                  if (rejected) { setRejectedAtSubmit(rejected); setActiveSection("team"); return; } // duplicate: nothing was saved
                  markDone("goals");
                  setRefId(newId);
                  setSubmitted(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md text-sm font-bold bg-[#4C808A] text-white hover:bg-[#3d6b74] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Submit Application <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
