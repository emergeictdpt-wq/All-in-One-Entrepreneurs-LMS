import { toast } from "sonner";
import { useProgramme, type Role } from "../data/programmeStore";

/**
 * Sidebar block for the demo build only: switch which sample person this TAB is signed in as,
 * and wipe the saved data. Open the mentee portal in one tab and the mentor portal in another
 * to test the two-person flow; changes sync between tabs through localStorage.
 */
export function DemoTools({ role }: { role: Role }) {
  const P = useProgramme();
  const me = P.currentUser?.name ?? "";
  const options = [...new Set(P.pairs.map(p => (role === "mentor" ? p.mentor : p.mentee)))];
  return (
    <div style={{ padding: "10px 16px 12px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, margin: "0 0 4px", letterSpacing: 0.5 }}>DEMO: VIEWING AS</p>
      <select value={me} onChange={e => { P.signIn(role, e.target.value); toast.success(`Now viewing as ${e.target.value}`); }}
        style={{ width: "100%", fontSize: 10, padding: "4px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.12)", color: "#fff" }}>
        {options.map(o => <option key={o} value={o} style={{ color: "#222" }}>{o}</option>)}
      </select>
      <button onClick={() => { if (window.confirm("Reset all demo data back to the original sample data?")) P.resetDemo(); }}
        style={{ marginTop: 6, width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 3, padding: "4px 6px", color: "rgba(255,255,255,0.75)", fontSize: 9, cursor: "pointer" }}>
        Reset demo data
      </button>
    </div>
  );
}
