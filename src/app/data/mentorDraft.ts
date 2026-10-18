// Saved-progress support for the mentor registration form ("continue later").
// Passwords, the National ID number, the profile photo and uploaded files are never stored.
export const MENTOR_DRAFT_KEY = "emerge.mentorRegistrationDraft.v1";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // drafts expire after 30 days

export interface MentorDraft { savedAt: number; step: number; data: Record<string, unknown>; }

export function readMentorDraft(): MentorDraft | null {
  try {
    const raw = localStorage.getItem(MENTOR_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as MentorDraft;
    if (!d || typeof d.savedAt !== "number" || typeof d.step !== "number" || typeof d.data !== "object" || d.data === null) return null;
    if (Date.now() - d.savedAt > MAX_AGE_MS) { localStorage.removeItem(MENTOR_DRAFT_KEY); return null; }
    return d;
  } catch { return null; }
}

export function writeMentorDraft(step: number, data: Record<string, unknown>): number | null {
  try {
    const savedAt = Date.now();
    localStorage.setItem(MENTOR_DRAFT_KEY, JSON.stringify({ savedAt, step, data } satisfies MentorDraft));
    return savedAt;
  } catch { return null; } // storage full or blocked: the form still works, it just can't be resumed
}

export function clearMentorDraft() {
  try { localStorage.removeItem(MENTOR_DRAFT_KEY); } catch { /* ignore */ }
}
