import { toast } from "sonner";
import { useProgramme, type Role } from "../data/programmeStore";
import { useDirectory } from "../data/directory";
import { DEMO_MODE } from "../data/auth";

/**
 * Sidebar block for the demo build only: switch which sample person this TAB is signed in as,
 * and wipe the saved data. Open the mentee portal in one tab and the mentor portal in another
 * to test the two-person flow; changes sync between tabs through localStorage.
 */
export function DemoTools({ role }: { role: Role }) {
  const P = useProgramme();
  const dir = useDirectory();
  if (!DEMO_MODE) return null;
  const me = P.currentUser?.id ?? "";
  // People who currently have a pairing, plus (for entrepreneurs) those still waiting, so the waiting screen can be previewed
  const people = role === "mentor"
    ? P.pairs.map(p => ({ id: p.mentorId ?? dir.mentor(undefined, p.mentor)?.id ?? p.mentor, name: p.mentor }))
    : [...P.pairs.map(p => ({ id: p.menteeId ?? dir.mentee(undefined, p.mentee)?.id ?? p.mentee, name: p.mentee })), ...P.waiting.map(w => ({ id: w.menteeId ?? w.mentee, name: `${w.mentee} (waiting)` }))];
  const options = [...new Map(people.map(o => [o.id, o])).values()];
  return (
    <div style={{ padding: "10px 16px 12px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, margin: "0 0 4px", letterSpacing: 0.5 }}>DEMO: VIEWING AS</p>
      <select aria-label="View as" value={me} onChange={e => { const o = options.find(x => x.id === e.target.value); if (!o) return; P.signIn({ role, id: o.id, name: o.name.replace(" (waiting)", "") }); toast.success(`Now viewing as ${o.name}`); }}
        style={{ width: "100%", fontSize: 10, padding: "4px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", color: "#fff" }}>
        {options.map(o => <option key={o.id} value={o.id} style={{ color: "#222" }}>{o.name}</option>)}
      </select>
      <button onClick={() => { if (window.confirm("Reset all demo data back to the original sample data?")) P.resetDemo(); }}
        style={{ marginTop: 6, width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 3, padding: "4px 6px", color: "rgba(255,255,255,0.75)", fontSize: 9, cursor: "pointer" }}>
        Reset demo data
      </button>
    </div>
  );
}
