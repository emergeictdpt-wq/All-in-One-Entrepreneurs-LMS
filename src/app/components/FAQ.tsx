import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Who can apply to programs on this platform?",
    a: "Our programs are open to entrepreneurs, startup founders, MSMEs and innovators at various stages from idea-stage to growth-stage. Some programs have specific eligibility criteria like sector, geography and stage which are listed on each program page.",
  },
  {
    q: "Are the programs and courses free to access?",
    a: "Many of our learning resources, toolkits and community features are free. Specific incubation and acceleration programs may involve a selection process with no financial cost but may include equity arrangements or program fees depending on the funding partner. Details are listed per program.",
  },
  {
    q: "How are startups selected for incubation and acceleration?",
    a: "Selection is based on a structured process: application screening, scoring rubric evaluation, interviews and committee review. We assess problem clarity, market potential, team quality, traction and impact potential.",
  },
  {
    q: "What kind of support does a startup receive after selection?",
    a: "Selected startups receive access to structured curricula, assigned mentors, co-working resources, investor introductions, peer cohorts, pitch coaching and MEL support. The level of support varies by program type.",
  },
  {
    q: "How can experienced professionals become mentors?",
    a: "Apply through our Become a Mentor page. We review your experience, sector expertise and availability. Approved mentors are onboarded, trained on the platform and matched with mentees based on expertise and needs.",
  },
  {
    q: "Is the platform suitable for NGOs, governments and universities?",
    a: "Yes, the platform was specifically designed for program managers at NGOs, government entrepreneurship agencies, universities and development organizations. It supports multi-stakeholder program management, MEL reporting and cohort management.",
  },
  {
    q: "How does the platform handle impact measurement?",
    a: "Our built-in MEL Dashboard tracks KPIs at the entrepreneur, startup, program and ecosystem level. Program managers can configure custom indicators aligned to their donor reporting frameworks (e.g., SDGs, logframes).",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 bg-white" id="faq">
      <div className="max-w-3xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
            <span className="text-white text-xs font-semibold tracking-widest uppercase">FAQ</span>
          </div>
          <h2 className="text-[#3B4167] mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Frequently Asked Questions
          </h2>
          <p className="text-[#6b7280] text-sm">
            Everything you need to know before joining the ecosystem.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#f8f9fb] rounded-md border border-[#3B4167]/10 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-[#3B4167] text-sm font-semibold pr-4">{faq.q}</span>
                <div className="shrink-0 w-6 h-6 rounded-full bg-[#4C808A]/15 flex items-center justify-center">
                  {open === i ? (
                    <Minus className="w-3 h-3 text-[#4C808A]" />
                  ) : (
                    <Plus className="w-3 h-3 text-[#4C808A]" />
                  )}
                </div>
              </button>
              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-[#6b7280] text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
