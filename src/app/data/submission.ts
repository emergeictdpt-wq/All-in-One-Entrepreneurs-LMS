// Helpers for turning what an applicant typed into the stored application.

/** Keeps only the fields that were actually filled in, so the table fallbacks still apply to anything left blank. */
export function filled<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}
