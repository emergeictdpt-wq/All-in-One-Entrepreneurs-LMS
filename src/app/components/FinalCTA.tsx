export function FinalCTA({ onApply }: { onApply?: () => void }) {
  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onApply) {
      onApply();
    }
    const section = document.getElementById("programs");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.hash = "programs";
    }
  };

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(155deg, #2a3054 0%, #3B4167 45%, #456f78 80%, #4C808A 100%)" }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      </svg>
      <div className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-6" style={{ background: "#4C808A" }}>
          <span className="text-white text-xs font-semibold tracking-widest uppercase">Get Started Today</span>
        </div>
        <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 700, lineHeight: 1.2 }}>
          Ready to Build, Grow and Scale
          <br />
          Your Venture?
        </h2>
        <p className="text-white/60 text-sm mb-10 max-w-2xl mx-auto leading-relaxed">
          Join over 12,000 entrepreneurs, 520 mentors and 180 investors building the future of business.
          Your journey starts with one click.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#programs"
            onClick={handleApply}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-[#4C808A] text-white font-bold hover:bg-[#3d6b74] transition-all shadow-lg shadow-[#4C808A]/30 text-sm"
          >
            Apply Now
          </a>
        </div>
      </div>
    </section>
  );
}
