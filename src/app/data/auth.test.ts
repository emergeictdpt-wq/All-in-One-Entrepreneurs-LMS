import { beforeEach, describe, expect, it } from "vitest";
import { authenticate, DEMO_PASSWORD, hasAccount, passwordProblem, registerCredential } from "./auth";
import { buildPeople } from "./directory";
import { MOCK_ENT_APPS, MOCK_MNT_APPS } from "../components/IncubationManagementPage";

const people = (overrides: Record<string, { status: string }> = {}, ent: any[] = [], mnt: any[] = []) =>
  buildPeople({ entApps: [...MOCK_ENT_APPS, ...ent], mntApps: [...MOCK_MNT_APPS, ...mnt], overrides });

beforeEach(() => localStorage.clear());

describe("sign-in", () => {
  it("rejects an unknown email and a wrong password with the same message", async () => {
    const a = await authenticate("mentee", "nobody@example.com", "whatever1", people().mentees);
    const b = await authenticate("mentee", "chisomo.banda@gmail.com", "wrong-pass1", people().mentees);
    expect(a).toMatchObject({ ok: false, code: "invalid" });
    expect(b).toMatchObject({ ok: false, code: "invalid" });
    expect((a as any).message).toBe((b as any).message);
  });

  it("identifies the right person, not a fixed demo user", async () => {
    const chisomo = await authenticate("mentee", "chisomo.banda@gmail.com", DEMO_PASSWORD, people().mentees);
    const kondwani = await authenticate("mentee", "Kondwani.Phiri@example.com", DEMO_PASSWORD, people().mentees);
    expect(chisomo.ok && chisomo.person.id).toBe("APP-001");
    expect(kondwani.ok && kondwani.person.name).toBe("Kondwani Phiri");
    const mentor = await authenticate("mentor", "patrick.likoswe@example.com", DEMO_PASSWORD, people().mentors);
    expect(mentor.ok && mentor.person.name).toBe("Prof. Patrick Likoswe");
  });

  it("keeps mentor and entrepreneur accounts apart", async () => {
    const r = await authenticate("mentor", "chisomo.banda@gmail.com", DEMO_PASSWORD, people().mentors);
    expect(r.ok).toBe(false);
  });

  it("blocks a Pending application even with the right password, and says why", async () => {
    const pending = MOCK_ENT_APPS.find(a => a.status === "Pending")!;
    const r = await authenticate("mentee", pending.email!, DEMO_PASSWORD, people().mentees);
    expect(r).toMatchObject({ ok: false, code: "pending" });
  });

  it("blocks rejected and dropped-out applicants, and follows the admin's latest decision", async () => {
    const some = MOCK_ENT_APPS.find(a => a.status === "Approved")!;
    const rejected = await authenticate("mentee", some.email!, DEMO_PASSWORD, people({ [some.id]: { status: "Rejected" } }).mentees);
    expect(rejected).toMatchObject({ ok: false, code: "rejected" });
    const dropped = await authenticate("mentee", some.email!, DEMO_PASSWORD, people({ [some.id]: { status: "Dropouts" } }).mentees);
    expect(dropped).toMatchObject({ ok: false, code: "dropped" });
    const pend = MOCK_ENT_APPS.find(a => a.status === "Pending")!;
    const promoted = await authenticate("mentee", pend.email!, DEMO_PASSWORD, people({ [pend.id]: { status: "Selected" } }).mentees);
    expect(promoted.ok).toBe(true);
  });

  it("lets someone who applied sign in as themselves with the password they chose", async () => {
    const app = { id: "APP-NEW1", name: "Esther Mhango", email: "esther@example.com", phone: "+265 1", district: "Salima", sector: "Agri", date: "2026-10-01", status: "Pending", isMockup: false, program: "Incubation", businessName: "Mhango Farms" };
    await registerCredential("mentee", app.email, app.id, "Sunrise2026");
    expect(hasAccount("mentee", "ESTHER@example.com")).toBe(true);
    // stored hashed, never as typed
    expect(localStorage.getItem("emerge.credentials.v1")).not.toContain("Sunrise2026");
    const early = await authenticate("mentee", app.email, "Sunrise2026", people({}, [app]).mentees);
    expect(early).toMatchObject({ ok: false, code: "pending" }); // right password, still under review
    const wrong = await authenticate("mentee", app.email, DEMO_PASSWORD, people({ [app.id]: { status: "Selected" } }, [app]).mentees);
    expect(wrong).toMatchObject({ ok: false, code: "invalid" }); // the shared demo password does not work for real applicants
    const ok = await authenticate("mentee", app.email, "Sunrise2026", people({ [app.id]: { status: "Selected" } }, [app]).mentees);
    expect(ok.ok && ok.person.name).toBe("Esther Mhango");
  });

  it("a newly registered mentor can sign in once approved", async () => {
    const m = { id: "MNT-NEW1", name: "Dr. Ruth Kaunda", email: "ruth@example.com", phone: "+265 2", district: "Mzuzu", expertise: "Finance", date: "2026-10-02", status: "Pending", isMockup: false, bio: "20 years in microfinance.", expertiseAreas: ["Finance", "Fundraising"], title: "Finance lead", employer: "Nkhata Bank", location: "Mzuzu, Malawi" };
    await registerCredential("mentor", m.email, m.id, "Mentor2026!");
    expect(await authenticate("mentor", m.email, "Mentor2026!", people({}, [], [m]).mentors)).toMatchObject({ ok: false, code: "pending" });
    const ok = await authenticate("mentor", m.email, "Mentor2026!", people({ [m.id]: { status: "Approved" } }, [], [m]).mentors);
    expect(ok.ok && ok.person).toMatchObject({ id: "MNT-NEW1", bio: "20 years in microfinance.", expertiseAreas: ["Finance", "Fundraising"] });
  });

  it("enforces a password policy", () => {
    expect(passwordProblem("short1")).toMatch(/8/);
    expect(passwordProblem("onlyletters")).toMatch(/number/);
    expect(passwordProblem("Good1234")).toBe("");
  });
});
