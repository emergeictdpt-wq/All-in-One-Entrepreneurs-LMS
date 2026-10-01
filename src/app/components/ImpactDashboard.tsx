import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const areaData = [
  { month: "Jan", startups: 420, jobs: 8200, revenue: 8.2 },
  { month: "Feb", startups: 490, jobs: 9800, revenue: 11.4 },
  { month: "Mar", startups: 540, jobs: 12400, revenue: 14.8 },
  { month: "Apr", startups: 580, jobs: 15600, revenue: 18.2 },
  { month: "May", startups: 620, jobs: 20100, revenue: 22.6 },
  { month: "Jun", startups: 680, jobs: 28400, revenue: 28.4 },
];

const pieData = [
  { name: "Youth Employment", value: 45, color: "#4C808A" },
  { name: "Women Empowered", value: 30, color: "#6878c4" },
  { name: "Rural Entrepreneurs", value: 25, color: "#3B4167" },
];

const kpis = [
  { label: "Entrepreneurs Trained", value: "12,400+", category: "Output", color: "#4C808A" },
  { label: "Startups Supported", value: "1,020+", category: "Output", color: "#4C808A" },
  { label: "Revenue Growth (Avg)", value: "+280%", category: "Outcome", color: "#3B4167" },
  { label: "Jobs Created", value: "28,400+", category: "Outcome", color: "#3B4167" },
  { label: "Women Empowered", value: "4,800+", category: "Impact", color: "#6878c4" },
  { label: "Countries Reached", value: "38", category: "Impact", color: "#6878c4" },
];

export function ImpactDashboard() {
  return (
    <section className="py-20 bg-[#f8f9fb]" id="impact-dashboard">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#3B4167]/10 border border-[#3B4167]/20 mb-4">
            <span className="text-[#3B4167] text-xs font-semibold tracking-widest uppercase">Impact Dashboard</span>
          </div>
          <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Measuring Real-World Impact
          </h2>
          <p className="text-[#6b7280] text-sm max-w-2xl mx-auto">
            Transparent, data-driven reporting on outputs, outcomes and ecosystem-level economic impact.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-md p-4 border border-[#3B4167]/10 text-center">
              <div className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: k.color }}>
                {k.category}
              </div>
              <div className="font-bold mb-0.5" style={{ fontSize: "1.1rem", color: k.color }}>
                {k.value}
              </div>
              <div className="text-[#6b7280] text-[10px] leading-tight">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Area chart */}
          <div className="lg:col-span-2 bg-white rounded-md p-6 border border-[#3B4167]/10">
            <h3 className="text-[#3B4167] font-bold mb-1" style={{ fontSize: "0.875rem" }}>Growth Over Time</h3>
            <p className="text-[#6b7280] text-xs mb-5">Startups, jobs and revenue generated (2026)</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="teal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4C808A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4C808A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="navy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B4167" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B4167" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "white", border: "1px solid rgba(59,65,103,0.1)", borderRadius: 3, fontSize: 11 }}
                />
                <Area type="monotone" dataKey="startups" stroke="#4C808A" fill="url(#teal)" strokeWidth={2} name="Startups" />
                <Area type="monotone" dataKey="revenue" stroke="#3B4167" fill="url(#navy)" strokeWidth={2} name="Revenue ($M)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10">
            <h3 className="text-[#3B4167] font-bold mb-1" style={{ fontSize: "0.875rem" }}>Beneficiary Profile</h3>
            <p className="text-[#6b7280] text-xs mb-4">Ecosystem impact by demographic</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "1px solid rgba(59,65,103,0.1)", borderRadius: 3, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-md" style={{ background: d.color }} />
                    <span className="text-[#3B4167] text-xs">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: d.color }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
