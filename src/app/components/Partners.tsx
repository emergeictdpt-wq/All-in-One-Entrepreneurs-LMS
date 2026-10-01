const partnerLogos = [
  { name: "ACADES", src: "/logos/ACADES-primary-Logo-scaled.png", cleanSrc: "/logos/ACADES-primary-Logo-scaled.png" },
  { name: "ADRA", src: "/logos/ADRA.png", cleanSrc: "/logos/ADRA.png" },
  { name: "AfriLabs", src: "/logos/AFRI labs.png", cleanSrc: "/logos/AFRI_labs.png" },
  { name: "CRECCOM", src: "/logos/CRECCOM.jpg", cleanSrc: "/logos/CRECCOM.jpg" },
  { name: "Dream Factory", src: "/logos/DFF.png", cleanSrc: "/logos/DFF.png" },
  { name: "Digital Opportunity Trust", src: "/logos/DOT.jpg", cleanSrc: "/logos/DOT.jpg" },
  { name: "GIZ", src: "/logos/GIZ.jpg", cleanSrc: "/logos/GIZ.jpg" },
  { name: "GOPA AFC", src: "/logos/GOPA AFC.jpg", cleanSrc: "/logos/GOPA_AFC.jpg" },
  { name: "Life Concern", src: "/logos/life concern.png", cleanSrc: "/logos/life_concern.png" },
  { name: "Malawi Government", src: "/logos/MW Gov logo.jpg", cleanSrc: "/logos/MW_Gov_logo.jpg" },
  { name: "Mzuzu University", src: "/logos/mzuni.png", cleanSrc: "/logos/mzuni.png" },
  { name: "Norad", src: "/logos/NORAD.png", cleanSrc: "/logos/NORAD.png" },
  { name: "PPPC", src: "/logos/pppc-logo.png", cleanSrc: "/logos/pppc-logo.png" },
  { name: "Save the Children", src: "/logos/save-the-children.jpg", cleanSrc: "/logos/save-the-children.jpg" },
  { name: "Segal Family Foundation", src: "/logos/SEGAL FF.png", cleanSrc: "/logos/SEGAL_FF.png" },
  { name: "TEVETA", src: "/logos/teveta.png", cleanSrc: "/logos/teveta.png" },
  { name: "UNDP", src: "/logos/UNDP.jpg", cleanSrc: "/logos/UNDP.jpg" },
  { name: "Village Capital", src: "/logos/Village Capital.jpg", cleanSrc: "/logos/Village_Capital.jpg" },
  { name: "WUSC", src: "/logos/WUSC.png", cleanSrc: "/logos/WUSC.png" },
  { name: "Zantchito", src: "/logos/zantchito logo.png", cleanSrc: "/logos/zantchito_logo.png" },
];

export function Partners() {
  return (
    <section className="py-20 bg-white overflow-hidden" id="partners">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 mb-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A] mb-4" style={{ background: "#4C808A" }}>
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Our Partners</span>
          </div>
          <h2 className="text-[#3B4167]" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Trusted By Leading Institutions
          </h2>
        </div>
      </div>

      {/* Continuously moving marquee row (right to left) */}
      <div className="relative w-full overflow-hidden py-8 bg-white">
        {/* Subtle gradient fades on left and right edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-36 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-36 bg-gradient-to-l from-white to-transparent z-10" />

        <div
          className="flex gap-12 md:gap-16 whitespace-nowrap items-center hover:[animation-play-state:paused]"
          style={{
            animation: "partnerMarquee 45s linear infinite",
            width: "max-content",
          }}
        >
          {[...partnerLogos, ...partnerLogos].map((partner, index) => {
            const isLifeConcern = partner.name === "Life Concern";
            return (
              <div
                key={`${partner.name}-${index}`}
                className="flex items-center justify-center shrink-0 px-2"
                title={partner.name}
              >
                <img
                  src={encodeURI(partner.src)}
                  alt={partner.name}
                  className={
                    isLifeConcern
                      ? "w-20 h-20 md:w-[88px] md:h-[88px] aspect-square object-contain transition-transform duration-300 hover:scale-105 shrink-0"
                      : "h-12 md:h-14 max-w-[200px] w-auto object-contain transition-transform duration-300 hover:scale-105"
                  }
                  loading="eager"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (partner.cleanSrc && target.src !== partner.cleanSrc) {
                      target.src = partner.cleanSrc;
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes partnerMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
