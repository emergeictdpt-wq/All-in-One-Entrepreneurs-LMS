import journeyImg from "../../imports/Gemini_Generated_Image_1occdb1occdb1occ__2_-1.png";

export function EntrepreneurJourney() {
  return (
    <section className="py-20 bg-white" id="journey">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-[#4C808A]/30 mb-4" style={{ background: "#4C808A" }}>
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Entrepreneur Journey</span>
          </div>
          <h2 className="text-[#3B4167] mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700 }}>
            Your Roadmap from Idea to Impact
          </h2>
          <p className="text-[#6b7280] text-sm max-w-2xl mx-auto">
            A structured, milestone-driven pathway that takes you from first idea all the way to investment readiness, scaling and alumni leadership.
          </p>
        </div>

        {/* Journey infographic */}
        <div className="flex justify-center">
          <img
            src={journeyImg}
            alt="The Complete 8-Stage Startup Development Journey"
            className="w-full max-w-3xl rounded-md shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
