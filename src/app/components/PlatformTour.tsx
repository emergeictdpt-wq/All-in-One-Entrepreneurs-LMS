import { useState } from "react";
import { BarChart2, BookOpen, Users, UserCheck, Settings, DollarSign, Activity } from "lucide-react";

const portals = [
  {
    id: "applicant",
    icon: Users,
    label: "Applicant Portal",
    desc: "Application tracking, document upload and interview scheduling.",
    preview: {
      title: "My Applications",
      items: [
        { name: "Founders Launchpad 2026", status: "Under Review", color: "#f59e0b", pct: 65 },
        { name: "GrowthScale Accelerator", status: "Shortlisted", color: "#10b981", pct: 80 },
        { name: "Women Tech Bootcamp", status: "Applied", color: "#6366f1", pct: 30 },
      ],
    },
  },
  {
    id: "entrepreneur",
    icon: BarChart2,
    label: "Entrepreneur Dashboard",
    desc: "Startup KPI tracking, milestone management and task boards.",
    preview: {
      title: "Startup Overview",
      items: [
        { name: "Revenue (MoM)", status: "+42%", color: "#10b981", pct: 72 },
        { name: "Burn Rate", status: "On Track", color: "#4C808A", pct: 55 },
        { name: "Milestones Done", status: "8 / 12", color: "#3B4167", pct: 67 },
      ],
    },
  },
  {
    id: "lms",
    icon: BookOpen,
    label: "LMS Dashboard",
    desc: "Learning progress, course completion, certifications and live sessions.",
    preview: {
      title: "Learning Progress",
      items: [
        { name: "Business Modeling", status: "Completed", color: "#10b981", pct: 100 },
        { name: "Fundraising 101", status: "In Progress", color: "#4C808A", pct: 60 },
        { name: "Marketing Strategy", status: "Not Started", color: "#d1d5db", pct: 0 },
      ],
    },
  },
  {
    id: "mentor",
    icon: UserCheck,
    label: "Mentor Portal",
    desc: "Mentee management, session scheduling and impact reporting.",
    preview: {
      title: "My Mentees",
      items: [
        { name: "PaySwift Africa — Daniel", status: "Session Today", color: "#f59e0b", pct: 85 },
        { name: "AgroFresh — Amina", status: "On Track", color: "#10b981", pct: 90 },
        { name: "MedConnect — Priya", status: "Needs Attention", color: "#ef4444", pct: 45 },
      ],
    },
  },
  {
    id: "manager",
    icon: Settings,
    label: "Program Manager",
    desc: "Cohort management, evaluation workflows and program analytics.",
    preview: {
      title: "Cohort Status",
      items: [
        { name: "Active Participants", status: "38 / 40", color: "#4C808A", pct: 95 },
        { name: "Milestone Achievement", status: "74%", color: "#3B4167", pct: 74 },
        { name: "Mentor Assignments", status: "All Matched", color: "#10b981", pct: 100 },
      ],
    },
  },
  {
    id: "investor",
    icon: DollarSign,
    label: "Investor Portal",
    desc: "Startup discovery, due diligence, deal flow and portfolio tracking.",
    preview: {
      title: "Deal Flow",
      items: [
        { name: "Watchlist Startups", status: "12 Active", color: "#4C808A", pct: 60 },
        { name: "Due Diligence Pending", status: "4 Startups", color: "#f59e0b", pct: 40 },
        { name: "Closed Investments", status: "3 Deals", color: "#10b981", pct: 100 },
      ],
    },
  },
  {
    id: "mel",
    icon: Activity,
    label: "MEL Dashboard",
    desc: "Monitoring, Evaluation & Learning — ecosystem-level impact reporting.",
    preview: {
      title: "Impact KPIs",
      items: [
        { name: "Entrepreneurs Trained", status: "12,400", color: "#4C808A", pct: 82 },
        { name: "Jobs Created", status: "28,400+", color: "#3B4167", pct: 90 },
        { name: "Funding Facilitated", status: "$48M+", color: "#10b981", pct: 76 },
      ],
    },
  },
];

export function PlatformTour() {
  const [active, setActive] = useState(0);
  const portal = portals[active];

  return (
    <section className="py-20 bg-[#3B4167]" id="platform">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A]/20 border border-[#4C808A]/30 mb-4">
            <span className="text-[#4C808A] text-xs font-semibold tracking-widest uppercase">Platform Tour</span>
          </div>
          <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            A Complete Ecosystem in One Platform
          </h2>
          <p className="text-white/60 text-sm max-w-2xl mx-auto">
            Seven purpose-built portals, each designed for a different role in the entrepreneurship ecosystem.
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Tab list */}
          <div className="space-y-2">
            {portals.map(({ id, icon: Icon, label }, i) => (
              <button
                key={id}
                onClick={() => setActive(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-all ${
                  active === i
                    ? "bg-[#4C808A] text-white shadow-lg"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>

          {/* Preview panel */}
          <div className="bg-white/5 rounded-md border border-white/10 overflow-hidden">
            {/* Fake browser chrome */}
            <div className="bg-white/10 px-4 py-2.5 flex items-center gap-2 border-b border-white/10">
              <div className="w-2.5 h-2.5 rounded-md bg-red-400/70" />
              <div className="w-2.5 h-2.5 rounded-md bg-yellow-400/70" />
              <div className="w-2.5 h-2.5 rounded-md bg-green-400/70" />
              <div className="ml-3 flex-1 bg-white/10 rounded-md h-5 flex items-center px-3">
                <span className="text-white/40 text-[10px]">https://platform.emergelivelihoods.org/{portal.id}</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-md bg-[#4C808A]/30 flex items-center justify-center">
                  <portal.icon className="w-4 h-4 text-[#4C808A]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">{portal.label}</h3>
                  <p className="text-white/50 text-xs">{portal.desc}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-md p-4 border border-white/10">
                <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-4">{portal.preview.title}</h4>
                <div className="space-y-4">
                  {portal.preview.items.map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white text-xs font-medium">{item.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: item.color + "30", color: item.color }}>
                          {item.status}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-md transition-all duration-700"
                          style={{ width: `${item.pct}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini chart mockup */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].slice(0, 3).map((d, i) => (
                  <div key={d} className="bg-white/5 rounded-md p-3 text-center border border-white/5">
                    <div className="text-[#4C808A] font-bold text-sm">{(i + 1) * 24 + 12}</div>
                    <div className="text-white/40 text-[10px]">Activity {d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
