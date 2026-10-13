// Sign-in for entrepreneurs and mentors.
//
// IMPORTANT: this is a front-end-only prototype. Credentials live in this browser's localStorage,
// so anyone with access to the browser can read them. Passwords are salted and hashed (PBKDF2) so
// they are never stored as typed, but real security needs a server. When the backend exists, replace
// `authenticate` and `registerCredential` with API calls; callers don't change.
import type { Person } from "./directory";
import { IN_PROGRAMME } from "./directory";
import type { Manager } from "./managers";

/** Demo build: seeded sample people (the ones that ship with the app) sign in with this shared password. */
export const DEMO_MODE = true;
export const DEMO_PASSWORD = "Emerge@2025";

const CRED_KEY = "emerge.credentials.v1";
export type AccountRole = "mentee" | "mentor";
interface Credential { role: AccountRole; email: string; subjectId: string; salt: string; hash: string; alg: "pbkdf2" | "fallback"; createdAt: string }
type CredentialMap = Record<string, Credential>;

export const normEmail = (e: string) => e.trim().toLowerCase();
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const credKey = (role: AccountRole, email: string) => `${role}:${normEmail(email)}`;

function load(): CredentialMap {
  try { const v = JSON.parse(localStorage.getItem(CRED_KEY) ?? "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; }
}
function save(m: CredentialMap) { localStorage.setItem(CRED_KEY, JSON.stringify(m)); }

/** At least 8 characters with a letter and a number. Returns the problem, or "" when fine. */
export const passwordProblem = (pw: string) =>
  pw.length < 8 ? "Use at least 8 characters." : !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "Include at least one letter and one number." : "";

const toHex = (b: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(b as ArrayBuffer), x => x.toString(16).padStart(2, "0")).join("");
const newSalt = () => { const a = new Uint8Array(16); (globalThis.crypto ?? ({ getRandomValues: (x: Uint8Array) => x.map(() => Math.floor(Math.random() * 256)) } as Crypto)).getRandomValues(a); return toHex(a); };

async function derive(password: string, salt: string): Promise<{ hash: string; alg: Credential["alg"] }> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const key = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 100_000 }, key, 256);
    return { hash: toHex(bits), alg: "pbkdf2" };
  }
  // Insecure contexts (plain http on a non-localhost host) have no crypto.subtle. Weak but never plaintext.
  let h = 2166136261; const s = salt + password;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return { hash: h.toString(16).padStart(8, "0"), alg: "fallback" };
}
async function matches(c: Credential, password: string) {
  const d = await derive(password, c.salt);
  return d.alg === c.alg && d.hash === c.hash;
}

export const hasAccount = (role: AccountRole, email: string) => !!load()[credKey(role, email)];

/** Called when someone submits an application or mentor registration. Keeps an existing account's password. */
export async function registerCredential(role: AccountRole, email: string, subjectId: string, password: string) {
  const k = credKey(role, email); const all = load();
  if (all[k]) return false;
  const salt = newSalt(); const { hash, alg } = await derive(password, salt);
  all[k] = { role, email: normEmail(email), subjectId, salt, hash, alg, createdAt: new Date().toISOString() };
  save(all); return true;
}

export type AuthFailure = "invalid" | "no-password" | "pending" | "rejected" | "dropped" | "not-in-programme";
export type AuthResult = { ok: true; person: Person } | { ok: false; code: AuthFailure; message: string; person?: Person };

const RANK: Record<string, number> = { Matching: 5, Approved: 4, Selected: 3, Pending: 2, Dropouts: 1, Rejected: 0 };
/** Same email on several applications (e.g. applied twice): use the one furthest along. */
const pickPerson = (list: Person[]) => [...list].sort((a, b) => (RANK[b.status] ?? 0) - (RANK[a.status] ?? 0) || b.appliedOn.localeCompare(a.appliedOn))[0];

const GATE: Record<string, { code: AuthFailure; message: (who: "entrepreneur" | "mentor") => string }> = {
  Pending: { code: "pending", message: who => who === "mentor"
    ? "Your mentor application is still under review. You will be able to sign in once the programme team approves it. We will email you."
    : "Your application is still under review. You will be able to sign in once you are selected. You can follow its progress on the application tracker." },
  Rejected: { code: "rejected", message: who => `Your ${who === "mentor" ? "mentor " : ""}application was not successful this time, so there is no portal access. Check your email for the programme team's feedback.` },
  Dropouts: { code: "dropped", message: () => "This account has been closed because the place in the programme ended. Contact the programme team if you think this is a mistake." },
};

export async function authenticate(role: AccountRole, email: string, password: string, people: Person[]): Promise<AuthResult> {
  const invalid: AuthResult = { ok: false, code: "invalid", message: "Incorrect email or password." };
  if (!isEmail(email) || !password) return invalid;
  const person = pickPerson(people.filter(p => normEmail(p.email) === normEmail(email)));
  const cred = load()[credKey(role, email)];
  if (!person && !cred) return invalid;

  if (cred) { if (!(await matches(cred, password))) return invalid; }
  else if (person?.seeded && DEMO_MODE) { if (password !== DEMO_PASSWORD) return invalid; }
  else return { ok: false, code: "no-password", message: "No password is set for this application (it was submitted before sign-in existed). Please submit a new application, or ask the programme team for help." };

  if (!person) return invalid; // a credential whose application record is gone
  const who = role === "mentor" ? "mentor" : "entrepreneur";
  const gate = GATE[person.status];
  if (gate) return { ok: false, code: gate.code, message: gate.message(who), person };
  if (!IN_PROGRAMME.includes(person.status)) return { ok: false, code: "not-in-programme", message: "This account is not active in the programme yet.", person };
  return { ok: true, person };
}

/** Programme-manager sign-in (dummy accounts: they use the shared demo password until real accounts exist). */
export type ManagerAuthResult = { ok: true; manager: Manager } | { ok: false; code: "invalid"; message: string };
export async function authenticateManager(email: string, password: string, managers: Manager[]): Promise<ManagerAuthResult> {
  const invalid: ManagerAuthResult = { ok: false, code: "invalid", message: "Incorrect email or password." };
  if (!isEmail(email) || !password) return invalid;
  const manager = managers.find(m => normEmail(m.email) === normEmail(email));
  if (!manager || !DEMO_MODE || password !== DEMO_PASSWORD) return invalid;
  return { ok: true, manager };
}
