// `linkedin` = the partner's LinkedIn page; the logo links there. Leave "" to render the logo without a link.
const partnerLogos = [
  { name: "ACADES", linkedin: "", src: "/logos/ACADES-primary-Logo-scaled.png", cleanSrc: "/logos/ACADES-primary-Logo-scaled.png" },
  { name: "ADRA", linkedin: "https://www.linkedin.com/company/adra-malawi/", src: "/logos/ADRA.png", cleanSrc: "/logos/ADRA.png" },
  { name: "AfriLabs", linkedin: "https://www.linkedin.com/company/afrilabs/", src: "/logos/AFRI labs.png", cleanSrc: "/logos/AFRI_labs.png" },
  { name: "CRECCOM", linkedin: "", src: "/logos/CRECCOM.png", cleanSrc: "/logos/CRECCOM.jpg" },
  { name: "Dream Factory", linkedin: "", src: "/logos/DFF.png", cleanSrc: "/logos/DFF.png" },
  { name: "Digital Opportunity Trust", linkedin: "https://www.linkedin.com/company/digital-opportunity-trust/", src: "/logos/DOT.jpg", cleanSrc: "/logos/DOT.jpg" },
  { name: "GIZ", linkedin: "https://www.linkedin.com/company/giz-malawi/", src: "/logos/GIZ.png", cleanSrc: "/logos/GIZ.jpg" },
  { name: "GOPA AFC", linkedin: "https://www.linkedin.com/company/gopa-pro/", src: "/logos/GOPA AFC.png", cleanSrc: "/logos/GOPA_AFC.jpg" },
  { name: "Life Concern", linkedin: "", src: "/logos/life concern.png", cleanSrc: "/logos/life_concern.png" },
  { name: "Malawi Government", linkedin: "", src: "/logos/MW_Gov_logo.png", cleanSrc: "/logos/MW_Gov_logo.jpg" },
  { name: "Mzuzu University", linkedin: "https://www.linkedin.com/company/mzuzu-university/", src: "/logos/mzuni.png", cleanSrc: "/logos/mzuni.png" },
  { name: "Norad", linkedin: "https://www.linkedin.com/company/noradno/", src: "/logos/NORAD.png", cleanSrc: "/logos/NORAD.png" },
  { name: "PPPC", linkedin: "https://www.linkedin.com/company/public-private-partnership-commission/", src: "/logos/pppc-logo.png", cleanSrc: "/logos/pppc-logo.png" },
  { name: "Save the Children", linkedin: "https://www.linkedin.com/company/save-the-children-international/", src: "/logos/save-the-children.png", cleanSrc: "/logos/save-the-children.jpg" },
  { name: "Segal Family Foundation", linkedin: "https://www.linkedin.com/company/segal-family-foundation/", src: "/logos/SEGAL FF.png", cleanSrc: "/logos/SEGAL_FF.png" },
  { name: "TEVETA", linkedin: "https://www.linkedin.com/company/technical-entrepreneurial-and-vocational-education-and-training-authority-teveta/", src: "/logos/teveta.png", cleanSrc: "/logos/teveta.png" },
  { name: "UNDP", linkedin: "https://www.linkedin.com/company/undpmalawi/", src: "/logos/UNDP.jpg", cleanSrc: "/logos/UNDP.jpg" },
  { name: "Village Capital", linkedin: "https://www.linkedin.com/company/village-capital/", src: "/logos/Village_Capital.png", cleanSrc: "/logos/Village_Capital.jpg" },
  { name: "WUSC", linkedin: "https://www.linkedin.com/company/wusc-eumc/", src: "/logos/WUSC.png", cleanSrc: "/logos/WUSC.png" },
  { name: "Zantchito", linkedin: "", src: "/logos/zantchito logo.png", cleanSrc: "/logos/zantchito_logo.png" },
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
          className="flex gap-5 md:gap-8 whitespace-nowrap items-center hover:[animation-play-state:paused]"
          style={{
            animation: "partnerMarquee 45s linear infinite",
            width: "max-content",
          }}
        >
          {[...partnerLogos, ...partnerLogos].map((partner, index) => {
            const isLifeConcern = partner.name === "Life Concern";
            const logo = (
                <img
                  src={encodeURI(partner.src)}
                  alt={partner.name}
                  className={
                    isLifeConcern
                      ? "w-20 h-20 md:w-[88px] md:h-[88px] aspect-square object-contain transition-transform duration-300 hover:scale-105 shrink-0"
                      : "h-12 md:h-14 w-auto max-w-[200px] md:max-w-[220px] object-contain shrink-0 transition-transform duration-300 hover:scale-105"
                  }
                  loading="eager"
                  onError={(e) => {
                    const target = e.currentTarget;
                    // Try the fallback file once; never loop if it fails too.
                    if (partner.cleanSrc && !target.dataset.fallback) {
                      target.dataset.fallback = "1";
                      target.src = encodeURI(partner.cleanSrc);
                      // fallback files may have a white bg: blend it into the grey card
                      target.style.mixBlendMode = "multiply";
                    }
                  }}
                />
            );
            const cardClass =
              "flex items-center justify-center shrink-0 w-52 h-28 md:w-64 md:h-32 bg-[#f1f1f1] px-6 transition-colors duration-300 hover:bg-[#e8e8e8]";
            return partner.linkedin ? (
              <a
                key={`${partner.name}-${index}`}
                href={partner.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${partner.name} on LinkedIn`}
                title={partner.name}
                className={`${cardClass} cursor-pointer`}
              >
                {logo}
              </a>
            ) : (
              <div key={`${partner.name}-${index}`} title={partner.name} className={cardClass}>
                {logo}
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
