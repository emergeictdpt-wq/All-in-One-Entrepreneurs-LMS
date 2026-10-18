import { useState } from "react";
import { ArrowLeft, Search, Check } from "lucide-react";
import { findApplication, stagesFor, isMentorApp, type AnyApplication, type TrackerResult } from "../data/applicationTracker";

const TEAL = "#4C808A";
const tones = { neutral: "#3B4167", good: "#2f7d4f", bad: "#b3403a", warn: "#a06a14" } as const;

export function ApplicationTrackerPage({ onBack, initialRef = "", seedApps = [] }: { onBack: () => void; initialRef?: string; seedApps?: AnyApplication[] }) {
  const [q, setQ] = useState(initialRef);
  // Arriving with a reference (from the "Track this application" button) shows the status straight away
  const [result, setResult] = useState<TrackerResult | null>(() => (initialRef ? findApplication(initialRef, seedApps) : null));
  const [searched, setSearched] = useState(!!initialRef);

  const run = () => { setResult(findApplication(q, seedApps)); setSearched(true); };
  const stages = result ? stagesFor(result.app) : [];
  const mentor = result ? isMentorApp(result.app) : false;

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="max-w-xl mx-auto px-5 py-10">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-[#3B4167] mb-6">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-xl font-bold text-[#3B4167] mb-1">Track your application</h1>
        <p className="text-xs text-[#6b7280] mb-5">Enter your reference number or the email you applied with.</p>
        <div className="flex gap-2 mb-6">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && run()}
            placeholder="Reference number or email address"
            className="flex-1 px-3 py-2.5 rounded-md border border-gray-300 text-xs bg-white"
          />
          <button onClick={run} className="flex items-center gap-1.5 px-4 py-2.5 rounded-md text-xs font-bold text-white" style={{ background: TEAL }}>
            <Search size={14} /> Track
          </button>
        </div>

        {searched && !result && (
          <p className="text-xs text-[#b3403a] bg-white rounded-md border border-red-200 p-4">
            No application found. Check the reference or email, and note applications are looked up in the browser they were submitted from.
          </p>
        )}

        {result && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold">{mentor ? "Mentor registration" : result.app.program}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280] font-semibold">{result.app.id}</p>
            </div>
            <p className="text-sm font-bold text-[#3B4167] mt-1">{mentor ? result.app.name : ("businessName" in result.app && result.app.businessName) || result.app.name}</p>
            <p className="text-lg font-bold mt-3" style={{ color: tones[result.tone] }}>{result.label}</p>
            <p className="text-xs text-[#4b5563] mt-1">{result.message}</p>
            {result.reason && <p className="text-xs text-[#4b5563]">{result.reason}</p>}

            <ol className="mt-5 space-y-3">
              {stages.map((s, i) => {
                const done = i < result.stageIndex || (!!result.complete && i === result.stageIndex), current = i === result.stageIndex && !result.complete;
                return (
                  <li key={s.id} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ background: done || current ? TEAL : "#e5e7eb", color: done || current ? "#fff" : "#9ca3af" }}>
                      {done ? <Check size={12} /> : i + 1}
                    </span>
                    <div>
                      <p className={`text-xs font-semibold ${current || (result.complete && i === result.stageIndex) ? "text-[#3B4167]" : done ? "text-[#4b5563]" : "text-[#9ca3af]"}`}>{s.label}</p>
                      {(current || (result.complete && i === result.stageIndex)) && <p className="text-[11px] text-[#6b7280]">{s.desc}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
