import { Calendar, Clock, Users, ArrowRight } from "lucide-react";

const programs = [
  {
    name: "Founders Launchpad",
    type: "Incubation",
    duration: "6 Months",
    cohortDates: "Sep 2026 – Feb 2027",
    deadline: "Aug 15, 2026",
    slots: 40,
    color: "#4C808A",
    badge: "Accepting Applications",
  },
  {
    name: "GrowthScale Accelerator",
    type: "Acceleration",
    duration: "4 Months",
    cohortDates: "Oct 2026 – Jan 2027",
    deadline: "Sep 1, 2026",
    slots: 25,
    color: "#3B4167",
    badge: "Open",
  },
  {
    name: "Women in Tech Bootcamp",
    type: "Bootcamp",
    duration: "8 Weeks",
    cohortDates: "Jul 2026 – Aug 2026",
    deadline: "Jun 30, 2026",
    slots: 60,
    color: "#7a89c2",
    badge: "Closing Soon",
  },
  {
    name: "AgriInnovation Hub",
    type: "Incubation",
    duration: "5 Months",
    cohortDates: "Aug 2026 – Dec 2026",
    deadline: "Jul 20, 2026",
    slots: 30,
    color: "#4C808A",
    badge: "Open",
  },
  {
    name: "FinTech Frontier",
    type: "Acceleration",
    duration: "3 Months",
    cohortDates: "Sep 2026 – Nov 2026",
    deadline: "Aug 5, 2026",
    slots: 20,
    color: "#3B4167",
    badge: "Accepting Applications",
  },
  {
    name: "Climate Impact Ventures",
    type: "Incubation",
    duration: "6 Months",
    cohortDates: "Nov 2026 – Apr 2027",
    deadline: "Oct 1, 2026",
    slots: 35,
    color: "#4C808A",
    badge: "Coming Soon",
  },
];

export function FeaturedPrograms() {
  return (
    <section className="py-20 bg-[#f8f9fb]" id="programs">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A]/10 border border-[#4C808A]/20 mb-4">
              <span className="text-[#4C808A] text-xs font-semibold tracking-widest uppercase">Featured Programs</span>
            </div>
            <h2 className="text-[#3B4167]" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
              Active Cohorts & Programs
            </h2>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4C808A] hover:text-[#3d6b74] transition-colors"
          >
            View All Programs <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((p) => (
            <div
              key={p.name}
              className="bg-white rounded-md border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              {/* Top color bar */}
              <div className="h-1.5" style={{ background: p.color }} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide mb-2"
                      style={{ background: p.color + "18", color: p.color }}
                    >
                      {p.type}
                    </span>
                    <h3 className="text-[#3B4167]" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                      {p.name}
                    </h3>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest shrink-0 mt-1"
                    style={{
                      background: p.badge === "Closing Soon" ? "#fef3c7" : p.badge === "Coming Soon" ? "#f0f2f5" : "#dcfce7",
                      color: p.badge === "Closing Soon" ? "#92400e" : p.badge === "Coming Soon" ? "#6b7280" : "#166534",
                    }}
                  >
                    {p.badge}
                  </span>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Duration: <strong className="text-[#3B4167]">{p.duration}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Cohort: <strong className="text-[#3B4167]">{p.cohortDates}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "#d4183d" }} />
                    <span>Deadline: <strong className="text-[#d4183d]">{p.deadline}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <strong className="text-[#3B4167]">{p.slots}</strong> participants max
                    </span>
                  </div>
                </div>

                <a
                  href="#"
                  className="w-full block text-center py-2.5 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: p.badge === "Coming Soon" ? "transparent" : p.color,
                    color: p.badge === "Coming Soon" ? p.color : "white",
                    border: `1.5px solid ${p.color}`,
                  }}
                >
                  {p.badge === "Coming Soon" ? "Get Notified" : "Apply Now"}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
