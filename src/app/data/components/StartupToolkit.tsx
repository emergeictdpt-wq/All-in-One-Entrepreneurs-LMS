import { Download, FileText, BarChart2, LayoutGrid, TrendingUp, Search, PieChart } from "lucide-react";

const tools = [
  { icon: LayoutGrid, label: "Lean Canvas", desc: "Map your business model in one page.", tag: "PDF + Editable", downloads: "8,420" },
  { icon: FileText, label: "Business Model Canvas", desc: "Structured BMC with guidance notes.", tag: "PDF + Figma", downloads: "6,810" },
  { icon: BarChart2, label: "SWOT Analysis Template", desc: "Strategic self-assessment worksheet.", tag: "PDF + Excel", downloads: "5,230" },
  { icon: TrendingUp, label: "Pitch Deck Template", desc: "Investor-grade pitch structure with examples.", tag: "PowerPoint + PDF", downloads: "12,400" },
  { icon: PieChart, label: "Financial Model", desc: "P&L, cash flow and runway projections.", tag: "Excel", downloads: "4,180" },
  { icon: Search, label: "Market Research Kit", desc: "Research frameworks, survey templates, TAM/SAM/SOM calculator.", tag: "PDF + Excel", downloads: "3,640" },
];

export function StartupToolkit() {
  return (
    <section className="py-20 bg-[#f8f9fb]" id="resources">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A] mb-4">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Startup Toolkit</span>
          </div>
          <h2 className="text-[#3B4167] mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Free Resources for Founders
          </h2>
          <p className="text-[#6b7280] text-sm">
            Download essential startup templates, frameworks and tools completely free.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map(({ icon: Icon, label, desc, tag, downloads }) => (
            <div
              key={label}
              className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div className="w-10 h-10 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#4C808A]" />
              </div>
              <h3 className="text-[#3B4167] mb-1" style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                {label}
              </h3>
              <p className="text-[#6b7280] text-xs mb-3 flex-1">{desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-white bg-[#3B4167] px-2 py-1 rounded-md">
                  {tag}
                </span>
                <span className="text-[10px] text-[#6b7280]">{downloads} downloads</span>
              </div>
              <a
                href="#"
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#4C808A] text-white hover:bg-[#3d6870] text-xs font-bold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-white" /> Download Free
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
