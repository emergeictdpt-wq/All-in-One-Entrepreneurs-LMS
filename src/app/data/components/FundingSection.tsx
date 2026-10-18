import { DollarSign, Trophy, Users, ArrowRight, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fundingTypes = [
  { label: "Grants", count: 28, icon: DollarSign, color: "#4C808A", desc: "Non-dilutive funding from development partners and government agencies." },
  { label: "Angel Investors", count: 84, icon: Users, color: "#3B4167", desc: "Active angel investors seeking early-stage startup opportunities." },
  { label: "VC Firms", count: 32, icon: TrendingUp, color: "#7a89c2", desc: "Venture capital firms with active Africa and emerging market mandates." },
  { label: "Pitch Competitions", count: 12, icon: Trophy, color: "#4C808A", desc: "High-stakes competitions with cash prizes and investor exposure." },
];

const pipelineData = [
  { stage: "Exploring", count: 240, fill: "#e2e8f0" },
  { stage: "Applying", count: 180, fill: "#4C808A" },
  { stage: "Screening", count: 120, fill: "#3B4167" },
  { stage: "Due Diligence", count: 68, fill: "#4C808A" },
  { stage: "Term Sheet", count: 32, fill: "#3B4167" },
  { stage: "Closed", count: 18, fill: "#4C808A" },
];

export function FundingSection() {
  return (
    <section className="py-20 bg-[#3B4167]" id="funding">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A]/20 border border-[#4C808A]/30 mb-4">
            <span className="text-[#4C808A] text-xs font-semibold tracking-widest uppercase">Funding & Investment</span>
          </div>
          <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Funding & Investor Readiness
          </h2>
          <p className="text-white/60 text-sm max-w-2xl mx-auto">
            From grants to venture capital — our platform connects investment-ready startups with the right capital partners.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Funding types */}
          <div className="space-y-3">
            {fundingTypes.map(({ label, count, icon: Icon, color, desc }) => (
              <div
                key={label}
                className="flex items-start gap-4 bg-white/5 rounded-md p-4 border border-white/10 hover:border-[#4C808A]/40 transition-all"
              >
                <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ background: color + "25" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white text-sm font-bold">{label}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: color + "30", color }}>
                      {count} Active
                    </span>
                  </div>
                  <p className="text-white/50 text-xs">{desc}</p>
                </div>
              </div>
            ))}
            <a
              href="#"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-md bg-[#4C808A] text-white text-sm font-bold hover:bg-[#3d6b74] transition-all mt-2"
            >
              Explore All Funding Opportunities <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Right: Pipeline viz */}
          <div className="bg-white/5 rounded-md border border-white/10 p-6">
            <h3 className="text-white font-bold mb-1" style={{ fontSize: "0.95rem" }}>Investment Pipeline</h3>
            <p className="text-white/50 text-xs mb-6">Live deal flow across funding stages</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 0, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#2a2f4e", border: "1px solid rgba(76,128,138,0.3)", borderRadius: 3, color: "white", fontSize: 11 }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {pipelineData.map((entry, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#4C808A" : "#6878c4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Total Deal Flow", value: "$48M+" },
                { label: "Avg Ticket Size", value: "$320K" },
                { label: "Deals Closed", value: "18" },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 bg-white/5 rounded-md">
                  <div className="text-[#4C808A] font-bold" style={{ fontSize: "1.1rem" }}>{s.value}</div>
                  <div className="text-white/50 text-[10px]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
