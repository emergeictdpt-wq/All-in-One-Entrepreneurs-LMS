// Duplicate-application detection.
//
// An application is a duplicate when its email address, phone number OR national ID matches one that is
// already in the system for the same kind of applicant (entrepreneurs are checked against entrepreneurs,
// mentors against mentors). Values are normalised first, so "Amina@Example.com " matches "amina@example.com",
// and "+265 991 234 567", "0991234567" and "265991234567" are all the same phone number.
//
// IMPORTANT: front-end prototype. This runs in the browser against the applications this browser knows about.
// When the backend exists, enforce the same rule there with unique indexes on the three normalised values;
// the UI can then just show the error the API returns.

export type DuplicateField = "email" | "phone" | "nationalId";

export interface ApplicantIdentity { email?: string; phone?: string; nationalId?: string }
export interface DuplicateHit { field: DuplicateField; message: string }

export const normEmailKey = (v?: string) => (v ?? "").trim().toLowerCase();

/** Digits only, with the Malawi country code / trunk zero removed, so every common way of writing a number compares equal. */
export function normPhoneKey(v?: string) {
  let d = (v ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("265")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Letters and digits only, upper-cased: "ab 12-34" and "AB1234" are the same ID. */
export const normIdKey = (v?: string) => (v ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();

/** A National ID is exactly 8 letters/digits, e.g. V32N6SM4. Spaces and dashes are ignored; the letter/digit order is not enforced. */
export const NATIONAL_ID_LENGTH = 8;
export const nationalIdProblem = (v?: string) =>
  !v || !v.trim() ? "Enter your National ID number."
    : /[^A-Za-z0-9\s-]/.test(v) || normIdKey(v).length !== NATIONAL_ID_LENGTH ? "Enter a valid National ID: 8 letters and numbers, for example V32N6SM4." : "";

/** A phone number needs at least 9 digits after the country code / trunk zero (Malawi mobiles are 9). */
export const phoneProblem = (v?: string) =>
  !v || !v.trim() ? "Enter your phone number." : normPhoneKey(v).length < 9 ? "Enter a valid phone number, for example +265 88 000 0000." : "";

const MESSAGES: Record<DuplicateField, string> = {
  email: "An application with this email address has already been submitted. Duplicate applications are not accepted. Use the application tracker to check its progress.",
  phone: "An application with this phone number has already been submitted. Duplicate applications are not accepted. Use the application tracker to check its progress.",
  nationalId: "An application with this National ID has already been submitted. Duplicate applications are not accepted. Use the application tracker to check its progress.",
};

/** The first email / phone / national-ID match between `candidate` and anything in `existing`, or null when it is new. */
export function findDuplicate(candidate: ApplicantIdentity, existing: ApplicantIdentity[]): DuplicateHit | null {
  const email = normEmailKey(candidate.email), phone = normPhoneKey(candidate.phone), id = normIdKey(candidate.nationalId);
  const checks: [DuplicateField, string, (e: ApplicantIdentity) => string][] = [
    ["email", email, e => normEmailKey(e.email)],
    ["nationalId", id, e => normIdKey(e.nationalId)],
    ["phone", phone, e => normPhoneKey(e.phone)],
  ];
  for (const [field, value, read] of checks) {
    if (!value) continue; // a blank value never matches anything
    if (existing.some(e => read(e) === value)) return { field, message: MESSAGES[field] };
  }
  return null;
}
