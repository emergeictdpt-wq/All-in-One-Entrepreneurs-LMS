import {
  Lightbulb,
  Rocket,
  UserCheck,
  TrendingUp,
  DollarSign,
  Users,
  Globe,
  BarChart2,
} from "lucide-react";

export function WhatWeOffer() {
  return (
    <section className="py-20 bg-[#f8f9fb]" id="offer">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#4C808A]/10 border border-[#4C808A] mb-4">
            <span className="text-[#4C808A] text-xs font-semibold tracking-widest uppercase">What We Offer</span>
          </div>
          <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Everything You Need to Build & Scale
          </h2>
          <p className="text-[#6b7280] text-sm max-w-2xl mx-auto">
            A fully integrated entrepreneurship platform combining nine powerful capabilities into one seamless experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Learning Academy card — commented out
          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4 group-hover:bg-[#4C808A] transition-all">
              <BookOpen className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-[#3B4167] mb-2" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Learning Academy</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-3">Entrepreneurship training, certifications and structured learning tracks built for founders at every stage.</p>
            <span className="inline-block px-2.5 py-1 rounded-md bg-[#3B4167]/5 text-[#3B4167] text-[10px] font-semibold tracking-wide">Courses · Certifications</span>
          </div>
          */}

          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4 group-hover:bg-[#4C808A] transition-all">
              <Lightbulb className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-[#3B4167] mb-2" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Incubation Programs</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-3">Structured support for idea-stage ventures — validation, co-working and expert facilitation.</p>
            {/* tag "Idea Stage · Validation" commented out
            <span className="inline-block px-2.5 py-1 rounded-md bg-[#3B4167]/5 text-[#3B4167] text-[10px] font-semibold tracking-wide">Idea Stage · Validation</span>
            */}
          </div>

          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4 group-hover:bg-[#4C808A] transition-all">
              <Rocket className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-[#3B4167] mb-2" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Acceleration Programs</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-3">Intensive growth-stage scaling programs with cohort-based curricula, mentors and investor exposure.</p>
            {/* tag "Growth Stage · Scale" commented out
            <span className="inline-block px-2.5 py-1 rounded-md bg-[#3B4167]/5 text-[#3B4167] text-[10px] font-semibold tracking-wide">Growth Stage · Scale</span>
            */}
          </div>

          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4 group-hover:bg-[#4C808A] transition-all">
              <UserCheck className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-[#3B4167] mb-2" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Mentorship</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-3">Expert guidance and coaching from seasoned entrepreneurs, industry leaders and sector specialists.</p>
            {/* tag "1:1 · Group · Coaching" commented out
            <span className="inline-block px-2.5 py-1 rounded-md bg-[#3B4167]/5 text-[#3B4167] text-[10px] font-semibold tracking-wide">1:1 · Group · Coaching</span>
            */}
          </div>

          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4 group-hover:bg-[#4C808A] transition-all">
              <TrendingUp className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-[#3B4167] mb-2" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Funding Readiness</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-3">Structured investor readiness tracks, pitch training, financial modeling and due diligence preparation.</p>
            {/* tag "Pitch · Financials" commented out
            <span className="inline-block px-2.5 py-1 rounded-md bg-[#3B4167]/5 text-[#3B4167] text-[10px] font-semibold tracking-wide">Pitch · Financials</span>
            */}
          </div>

          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4 group-hover:bg-[#4C808A] transition-all">
              <DollarSign className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-[#3B4167] mb-2" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Investor Access</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-3">Direct connections to vetted investors, donor networks and development finance institutions.</p>
            {/* tag "Angels · VCs · Grants" commented out
            <span className="inline-block px-2.5 py-1 rounded-md bg-[#3B4167]/5 text-[#3B4167] text-[10px] font-semibold tracking-wide">Angels · VCs · Grants</span>
            */}
          </div>

          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4 group-hover:bg-[#4C808A] transition-all">
              <Users className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-[#3B4167] mb-2" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Community & Networking</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-3">A vibrant founder community with discussion forums, peer groups, events and collaboration tools.</p>
            {/* tag "Founders · Alumni" commented out
            <span className="inline-block px-2.5 py-1 rounded-md bg-[#3B4167]/5 text-[#3B4167] text-[10px] font-semibold tracking-wide">Founders · Alumni</span>
            */}
          </div>

          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4 group-hover:bg-[#4C808A] transition-all">
              <Globe className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-[#3B4167] mb-2" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Market Access</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-3">Business development opportunities, procurement matchmaking and market expansion support.</p>
            {/* tag "B2B · Procurement" commented out
            <span className="inline-block px-2.5 py-1 rounded-md bg-[#3B4167]/5 text-[#3B4167] text-[10px] font-semibold tracking-wide">B2B · Procurement</span>
            */}
          </div>

          <div className="bg-white rounded-md p-6 border border-[#3B4167]/10 hover:border-[#4C808A]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-11 h-11 rounded-md bg-[#4C808A]/10 flex items-center justify-center mb-4 group-hover:bg-[#4C808A] transition-all">
              <BarChart2 className="w-5 h-5 text-[#4C808A] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-[#3B4167] mb-2" style={{ fontSize: "0.95rem", fontWeight: 700 }}>Monitoring & Impact</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-3">Built-in MEL dashboards to track business performance, program outcomes and ecosystem-level impact.</p>
            {/* tag "MEL · Reporting" commented out
            <span className="inline-block px-2.5 py-1 rounded-md bg-[#3B4167]/5 text-[#3B4167] text-[10px] font-semibold tracking-wide">MEL · Reporting</span>
            */}
          </div>

        </div>
      </div>
    </section>
  );
}
