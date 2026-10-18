import { useRef, useState } from "react";
import { Download, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useProgramme, fmtDate, type Task } from "../data/programmeStore";
import { EVIDENCE_ACCEPT, EVIDENCE_MAX_BYTES, EVIDENCE_MAX_PER_TASK, fmtBytes, openEvidence } from "../data/evidenceFiles";

const TEAL = "#4C808A";
const NAVY = "#3B4167";

/** The files attached to a task, with download. `canEdit` adds attach and remove (the founder), without it the mentor only reads. */
export function EvidencePanel({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const P = useProgramme();
  const input = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const files = task.evidence ?? [];

  const pick = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    let added = 0;
    for (const f of Array.from(list)) {
      const r = await P.attachEvidence(task.id, f, note);
      if (!r.ok) { toast.error(r.reason); break; }
      added++;
    }
    setBusy(false);
    if (added) { toast.success(added === 1 ? "Evidence attached. Your mentor has been told." : `${added} files attached. Your mentor has been told.`); setNote(""); }
    if (input.current) input.current.value = "";
  };
  const get = async (id: string, name: string) => { if (!(await openEvidence(id, name))) toast.error("This file is not stored in this browser, so it cannot be opened here."); };

  if (!files.length && !canEdit) return null;
  return (
    <div style={{ marginTop: 8 }}>
      {files.map(e => (
        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#444", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 3, padding: "5px 8px", marginBottom: 4 }}>
          <Paperclip size={11} color={TEAL} aria-hidden="true" />
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.name}>{e.name}</span>
          <span style={{ color: "#777" }}>{fmtBytes(e.size)} · {fmtDate(e.at)}</span>
          {e.note && <span style={{ color: "#555", fontStyle: "italic", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.note}>"{e.note}"</span>}
          <button onClick={() => get(e.id, e.name)} aria-label={`Download ${e.name}`} style={{ background: "none", border: "none", cursor: "pointer", color: TEAL, display: "flex", padding: 2 }}><Download size={12} /></button>
          {canEdit && <button onClick={() => { P.removeEvidence(task.id, e.id); toast.success("Evidence removed"); }} aria-label={`Remove ${e.name}`} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", display: "flex", padding: 2 }}><Trash2 size={12} /></button>}
        </div>
      ))}
      {canEdit && files.length < EVIDENCE_MAX_PER_TASK && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input value={note} onChange={e => setNote(e.target.value)} aria-label={`Note for the evidence on: ${task.title}`} placeholder="Note for your mentor (optional)" maxLength={200} style={{ flex: 1, minWidth: 140, border: "1px solid #e0e0e0", borderRadius: 3, padding: "5px 8px", fontSize: 10 }} />
          <input ref={input} type="file" multiple hidden accept={EVIDENCE_ACCEPT} aria-label={`Evidence file for: ${task.title}`} onChange={e => pick(e.target.files)} />
          <button disabled={busy} onClick={() => input.current?.click()} style={{ display: "flex", alignItems: "center", gap: 5, background: `${TEAL}15`, border: "none", borderRadius: 3, padding: "5px 10px", fontSize: 10, color: TEAL, fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>
            <Paperclip size={11} aria-hidden="true" /> {busy ? "Attaching…" : files.length ? "Attach another" : "Attach evidence"}
          </button>
          {!files.length && <span style={{ fontSize: 9, color: "#777" }}>PDF, image, Office, CSV or text · up to {EVIDENCE_MAX_BYTES / 1048576} MB each · {EVIDENCE_MAX_PER_TASK} files</span>}
        </div>
      )}
      {canEdit && files.length >= EVIDENCE_MAX_PER_TASK && <p style={{ margin: 0, fontSize: 9, color: NAVY }}>This task has the maximum {EVIDENCE_MAX_PER_TASK} files.</p>}
    </div>
  );
}
