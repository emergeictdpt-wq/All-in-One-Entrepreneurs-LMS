// Evidence files attached to tasks.
//
// The programme store keeps only each file's details (name, size, who, when). The bytes live here, in
// IndexedDB, because the store is saved to localStorage (about 5 MB for everything): a few photos would
// fill it and silently stop all the programme data from saving. Where IndexedDB is unavailable (private
// windows, tests) the files are kept in memory for the life of the page.
//
// This is browser-only storage, so a file is visible to whoever uses the same browser (the demo's mentor
// and mentee views). A backend must replace saveEvidenceFile / getEvidenceFile / deleteEvidenceFile.

export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_MAX_PER_TASK = 5;
/** What a founder can reasonably attach as proof of work. */
export const EVIDENCE_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt"] as const;
export const EVIDENCE_ACCEPT = EVIDENCE_EXTENSIONS.map(e => `.${e}`).join(",");

export interface EvidenceCandidate { name: string; size: number }

/** Why a file can't be attached, or null when it can. `already` is how many files the task has. */
export function evidenceProblem(f: EvidenceCandidate, already: number): string | null {
  if (already >= EVIDENCE_MAX_PER_TASK) return `A task can hold ${EVIDENCE_MAX_PER_TASK} files. Remove one first.`;
  const ext = f.name.includes(".") ? f.name.split(".").pop()!.toLowerCase() : "";
  if (!(EVIDENCE_EXTENSIONS as readonly string[]).includes(ext)) return `${f.name}: this file type is not accepted. Use PDF, an image, an Office file, CSV or text.`;
  if (f.size <= 0) return `${f.name} is empty.`;
  if (f.size > EVIDENCE_MAX_BYTES) return `${f.name} is ${(f.size / 1048576).toFixed(1)} MB. The limit is ${EVIDENCE_MAX_BYTES / 1048576} MB.`;
  return null;
}

export const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);

const DB = "emerge.evidence", STORE = "files";
const memory = new Map<string, Blob>();

function openDb(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
}
function run<T>(db: IDBDatabase, mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE, mode), req = f(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = tx.onabort = () => resolve(undefined);
    } catch { resolve(undefined); }
  });
}

/** Keeps the bytes. Resolves false if they could not be kept anywhere. */
export async function saveEvidenceFile(id: string, blob: Blob): Promise<boolean> {
  const db = await openDb();
  if (db) {
    const ok = await new Promise<boolean>(resolve => {
      try {
        const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(blob, id);
        tx.oncomplete = () => resolve(true); tx.onerror = tx.onabort = () => resolve(false);
      } catch { resolve(false); }
    });
    db.close();
    if (ok) return true;
  }
  memory.set(id, blob); return true;
}
export async function getEvidenceFile(id: string): Promise<Blob | undefined> {
  if (memory.has(id)) return memory.get(id);
  const db = await openDb(); if (!db) return undefined;
  const r = await run<Blob>(db, "readonly", s => s.get(id) as IDBRequest<Blob>); db.close();
  return r;
}
export async function deleteEvidenceFile(id: string): Promise<void> {
  memory.delete(id);
  const db = await openDb(); if (!db) return;
  await run(db, "readwrite", s => s.delete(id)); db.close();
}

/** Opens or downloads a stored file. Resolves false when the bytes are not in this browser. */
export async function openEvidence(id: string, name: string, mode: "open" | "download" = "download"): Promise<boolean> {
  const blob = await getEvidenceFile(id); if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: mode === "download" ? name : "", target: mode === "open" ? "_blank" : "", rel: "noopener" });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
