import { render, screen, cleanup, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PASSWORD = "Emerge@2025";
const TODAY = "2026-10-10";

async function boot() {
  vi.resetModules();
  const clock = await import("../data/clock"); clock.setClock(TODAY);
  const { default: App } = await import("../App");
  return render(<App />);
}
async function signIn(email: string) {
  localStorage.clear(); sessionStorage.clear();
  sessionStorage.setItem("emerge.page", "login");
  await boot();
  const u = userEvent.setup();
  await u.type(screen.getByPlaceholderText("your email"), email);
  await u.type(screen.getByPlaceholderText("Enter your password"), PASSWORD);
  await u.click(screen.getByRole("button", { name: /^Sign In/ }));
  await screen.findAllByText(/MENTEE PORTAL/);
  return u;
}
/** Restart the app on the same saved data, after editing it. */
async function reboot(edit: (saved: any) => void) {
  cleanup();
  const saved = JSON.parse(localStorage.getItem("emerge.programme.v4")!);
  edit(saved);
  localStorage.setItem("emerge.programme.v4", JSON.stringify(saved));
  await boot();
}
const go = (u: ReturnType<typeof userEvent.setup>, name: string | RegExp) => u.click(screen.getByRole("button", { name }));

afterEach(cleanup);
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
  URL.createObjectURL = vi.fn(() => "blob:test"); URL.revokeObjectURL = vi.fn();
});

describe("programme length", () => {
  it("follows the cohort dates instead of a fixed 24 weeks", async () => {
    await signIn("tadala.chirwa@example.com"); // cohort 4: Aug 2025 to Jan 2026
    expect(document.body.textContent).toMatch(/Week \d+ of 27/);
    expect(document.body.textContent).not.toMatch(/of 24/);
  });
  it("a different cohort gives a different length", async () => {
    await signIn("chisomo.banda@gmail.com"); // cohort 1: Jan 2025 to Dec 2025
    expect(document.body.textContent).toMatch(/Week \d+ of 53/);
  });
  it("shows the week but no total or percentage when the cohort has no readable end date", async () => {
    await signIn("chisomo.banda@gmail.com");
    await reboot(s => { s.cohorts.find((c: any) => c.id === 1).endDate = "—"; });
    await screen.findAllByText(/MENTEE PORTAL/);
    expect(document.body.textContent).toMatch(/Week \d+/);
    expect(document.body.textContent).not.toMatch(/Week \d+ of \d+/);
    expect(screen.getByText("Cohort end date not set")).toBeTruthy();
  });
});

describe("overview sections from the spec", () => {
  it("shows the welcome, status, roadmap, learning, health, recommendations, announcements and stats", async () => {
    await signIn("chisomo.banda@gmail.com");
    expect(screen.getByRole("region", { name: "Welcome" }).textContent).toMatch(/Good (morning|afternoon|evening), Chisomo!/);
    expect(screen.getByRole("region", { name: "Welcome" }).textContent).toMatch(/You have completed \d+% of your journey/);
    const status = screen.getByRole("region", { name: "Programme status" });
    expect(within(status).getByText("Validation")).toBeTruthy(); // business stage
    expect(within(status).getByText("Dr. Tiwonge Banda")).toBeTruthy();
    expect(screen.getByRole("listitem", { name: "Market Validation: current stage" })).toBeTruthy();
    expect(screen.getByRole("listitem", { name: "Prototype: upcoming" })).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Learning progress" })).getByText("AgriFinance Fundamentals")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Business health score" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Smart recommendations" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Announcements" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Quick statistics" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Community highlights" })).toBeTruthy();
  });
  it("every next step has a priority, a due date and a status", async () => {
    await signIn("chisomo.banda@gmail.com");
    const steps = screen.getByRole("region", { name: "Your next steps" });
    expect(within(steps).getAllByText(/ priority$/).length).toBeGreaterThan(0);
    expect(within(steps).getAllByText(/^(Due |No due date)/).length).toBeGreaterThan(0);
    expect(within(steps).getAllByText(/^(Overdue|In progress|Not started|At \d|Needs your answer)/).length).toBeGreaterThan(0);
  });
  it("a founder with no data sees 'not enough data yet', not 0%", async () => {
    await signIn("tadala.chirwa@example.com");
    await reboot(s => { s.courses = []; s.tasks = []; s.goals = []; });
    await screen.findAllByText(/MENTEE PORTAL/);
    const health = screen.getByRole("region", { name: "Business health score" });
    expect(within(health).getAllByText("Not enough data yet").length).toBeGreaterThanOrEqual(3);
    expect(within(screen.getByRole("region", { name: "Learning progress" })).getByText(/No courses have been assigned yet/)).toBeTruthy();
  });
  it("quick actions move to the right place", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Apply for Funding");
    expect(await screen.findByRole("region", { name: "Funding opportunities" })).toBeTruthy();
  });
});

describe("certificates", () => {
  it("lists a finished course and downloads its certificate", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Tasks and Learning");
    const certs = screen.getByRole("region", { name: "Certificates" });
    expect(within(certs).getByText("Market Entry Strategy for AgriTech")).toBeTruthy();
    expect(within(certs).queryByText("AgriFinance Fundamentals")).toBeNull(); // 6 of 8 modules: not yet
    await u.click(within(certs).getByRole("button", { name: /Download certificate: Market Entry/ }));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
  it("finishing the last module earns the certificate", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Tasks and Learning");
    for (let i = 0; i < 2; i++) await u.click(screen.getAllByRole("button", { name: /Complete next module/ })[0]);
    expect(within(screen.getByRole("region", { name: "Certificates" })).getByText("AgriFinance Fundamentals")).toBeTruthy();
  });
});

describe("evidence uploads", () => {
  const taskName = "Draft tiered pricing deck (3 tiers)";
  const input = () => screen.getByLabelText(`Evidence file for: ${taskName}`) as HTMLInputElement;

  it("attaches a file to a task, shows it, and tells the mentor", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Tasks and Learning");
    await u.upload(input(), new File(["pricing"], "pricing-deck.pdf", { type: "application/pdf" }));
    expect(await screen.findByText("pricing-deck.pdf")).toBeTruthy();
    const saved = JSON.parse(localStorage.getItem("emerge.programme.v4")!);
    const t = saved.tasks.find((x: any) => x.title === taskName);
    expect(t.evidence).toHaveLength(1);
    expect(t.evidence[0]).toMatchObject({ name: "pricing-deck.pdf", size: 7 });
    expect(saved.events.some((e: any) => e.to === "mentor" && /attached evidence to: Draft tiered pricing deck/.test(e.text))).toBe(true);
    expect(JSON.stringify(saved)).not.toContain("pricing\""); // only details are saved, never the file's bytes
  });

  it("refuses a file type that is not accepted and one that is too large", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Tasks and Learning");
    fireEvent.change(input(), { target: { files: [new File(["x"], "virus.exe")] } });
    expect(await screen.findByText(/virus\.exe: this file type is not accepted/)).toBeTruthy();
    const big = new File(["x"], "scan.pdf"); Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    fireEvent.change(input(), { target: { files: [big] } });
    expect(await screen.findByText(/scan\.pdf is 6\.0 MB\. The limit is 5 MB/)).toBeTruthy();
    const saved = JSON.parse(localStorage.getItem("emerge.programme.v4")!);
    expect(saved.tasks.find((x: any) => x.title === taskName).evidence ?? []).toHaveLength(0);
  });

  it("stops at five files per task and lets the founder remove one", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Tasks and Learning");
    for (let i = 1; i <= 5; i++) await u.upload(input(), new File(["a"], `f${i}.pdf`, { type: "application/pdf" })).then(() => screen.findByText(`f${i}.pdf`));
    expect(screen.queryByLabelText(`Evidence file for: ${taskName}`)).toBeNull();
    await u.click(screen.getByRole("button", { name: "Remove f3.pdf" }));
    await waitFor(() => expect(screen.queryByText("f3.pdf")).toBeNull());
    expect(input()).toBeTruthy(); // room again
  });

  it("raises the documentation score only for finished tasks that have evidence", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Tasks and Learning");
    await u.click(screen.getByRole("button", { name: `Mark done: ${taskName}` }));
    await u.upload(input(), new File(["a"], "deck.pdf", { type: "application/pdf" }));
    await screen.findByText("deck.pdf");
    await go(u, "Overview");
    const doc = within(screen.getByRole("region", { name: "Business health score" })).getByRole("progressbar", { name: "Documentation" });
    expect(Number(doc.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  });

  it("the mentor sees the evidence on that mentee's task, read-only", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Tasks and Learning");
    await u.upload(input(), new File(["a"], "pricing-deck.pdf", { type: "application/pdf" }));
    await screen.findByText("pricing-deck.pdf");
    cleanup();
    sessionStorage.setItem("emerge.user.v3", JSON.stringify({ role: "mentor", id: "MNT-017", name: "Dr. Tiwonge Banda" }));
    sessionStorage.setItem("emerge.page", "mentor-dashboard");
    await boot();
    const mu = userEvent.setup();
    await mu.click(await screen.findByRole("button", { name: /^Tasks/ }));
    expect(await screen.findByText("pricing-deck.pdf")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download pricing-deck.pdf" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove pricing-deck.pdf" })).toBeNull();
    expect(screen.queryByLabelText(`Evidence file for: ${taskName}`)).toBeNull();
  });
});

describe("community and funding", () => {
  it("founders in a cohort post and reply; other cohorts do not see it", async () => {
    const u = await signIn("chisomo.banda@gmail.com"); // cohort 1
    await go(u, "Community");
    await u.type(screen.getByLabelText("Write a post"), "Which farmers' groups did you partner with?");
    await u.click(screen.getByRole("button", { name: "Post" }));
    const post = await screen.findByRole("article", { name: "Post by Chisomo Banda" });
    await u.click(within(post).getByRole("button", { name: "Reply" }));
    await u.type(within(post).getByLabelText("Reply to Chisomo Banda"), "Start with the district cooperatives{enter}");
    expect(await within(post).findByText(/Start with the district cooperatives/)).toBeTruthy();
    expect(within(post).getByText(/Chisomo Banda \(you\)/)).toBeTruthy();
    // a founder in another cohort (cohort 4) cannot see it
    cleanup(); sessionStorage.clear(); sessionStorage.setItem("emerge.page", "login");
    await boot();
    const u2 = userEvent.setup();
    await u2.type(screen.getByPlaceholderText("your email"), "tadala.chirwa@example.com");
    await u2.type(screen.getByPlaceholderText("Enter your password"), PASSWORD);
    await u2.click(screen.getByRole("button", { name: /^Sign In/ }));
    await screen.findAllByText(/MENTEE PORTAL/);
    await go(u2, "Community");
    expect(screen.queryByText(/Which farmers' groups/)).toBeNull();
  });
  it("an empty post is refused", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Community");
    await u.click(screen.getByRole("button", { name: "Post" }));
    expect(await screen.findByText("Write something first.")).toBeTruthy();
  });
  it("showing interest in a funding opportunity tells the mentor, and can be withdrawn", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await go(u, "Funding");
    const card = screen.getByRole("article", { name: "Seed Grant: Early-Stage Ventures" });
    await u.click(within(card).getByRole("button", { name: "I want to apply" }));
    expect(within(card).getByRole("button", { name: /Interest sent to your mentor/ }).getAttribute("aria-pressed")).toBe("true");
    let saved = JSON.parse(localStorage.getItem("emerge.programme.v4")!);
    expect(saved.fundingInterests).toHaveLength(1);
    expect(saved.events.some((e: any) => e.to === "mentor" && /wants to apply for: Seed Grant/.test(e.text))).toBe(true);
    await u.click(within(card).getByRole("button", { name: /Interest sent to your mentor/ }));
    saved = JSON.parse(localStorage.getItem("emerge.programme.v4")!);
    expect(saved.fundingInterests).toHaveLength(0);
  });
  it("downloading a resource is counted in the quick statistics", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    const stat = () => within(screen.getByRole("region", { name: "Quick statistics" })).getByText("Resources downloaded").previousSibling!.textContent;
    expect(stat()).toBe("0");
    await go(u, "Resources");
    await u.click(screen.getAllByRole("button", { name: /Download/ })[0]);
    await go(u, "Overview");
    expect(stat()).toBe("1");
  });
});
