import { fireEvent, render, screen, waitFor, within, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PASSWORD = "Emerge@2025";
const TODAY = "2026-10-10";

async function openApp(page: "login" | "mentor-login") {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear();
  sessionStorage.setItem("emerge.page", page);
  const clock = await import("./data/clock"); clock.setClock(TODAY);
  const { default: App } = await import("./App");
  const view = render(<App />);
  return { clock, ...view };
}
async function signInEntrepreneur(email: string, password = PASSWORD) {
  const u = userEvent.setup();
  await u.type(screen.getByPlaceholderText("your email"), email);
  await u.type(screen.getByPlaceholderText("Enter your password"), password);
  await u.click(screen.getByRole("button", { name: /^Sign In/ }));
  return u;
}
afterEach(cleanup);
beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); });

describe("entrepreneur login", () => {
  it("rejects any email/password that isn't a real account", async () => {
    await openApp("login");
    await signInEntrepreneur("anyone@example.com", "whatever123");
    expect(await screen.findByText(/Incorrect email or password/)).toBeTruthy();
    expect(screen.queryByText(/Chisomo/)).toBeNull();
  });

  it("signs a paired entrepreneur in as themselves, with their own contact details", async () => {
    await openApp("login");
    await signInEntrepreneur("kondwani.phiri@example.com");
    await screen.findAllByText(/Kondwani Phiri/);
    expect(screen.queryByText(/Chisomo Banda/, { selector: ":not(option)" })).toBeNull(); // (the demo selector lists everyone)
    expect(screen.queryByTestId("waiting-title")).toBeNull();
    expect(document.body.textContent).toContain("Patrick");   // their real mentor
    expect(document.body.textContent).not.toContain("Tiwonge");
    const u = userEvent.setup();
    await u.click(screen.getAllByText("My Profile")[0]);
    expect(await screen.findByText("kondwani.phiri@example.com")).toBeTruthy(); // their own contact details, not a demo constant
    expect(screen.getAllByText("Lilongwe").length).toBeGreaterThan(0); // Kondwani's own district
  });

  it("tells a Pending applicant their application is under review instead of letting them in", async () => {
    await openApp("login");
    const { MOCK_ENT_APPS } = await import("./components/IncubationManagementPage");
    await signInEntrepreneur(MOCK_ENT_APPS.find(a => a.status === "Pending")!.email!);
    expect(await screen.findByText(/still under review/)).toBeTruthy();
    expect(screen.queryByTestId("waiting-title")).toBeNull();
  });

  it("shows the waiting screen, with status and next steps, to someone not yet matched", async () => {
    await openApp("login");
    await signInEntrepreneur("madalitso.chiumia@example.com");
    const title = await screen.findByTestId("waiting-title");
    expect(title.textContent).toMatch(/Madalitso/);
    expect(screen.getByText("What happens next")).toBeTruthy();
    expect(screen.getAllByText("APP-029", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText("In mentor matching")).toBeTruthy();
    expect(screen.getByText(/Position 1 of/)).toBeTruthy();
    const current = within(screen.getByTestId("waiting-stages")).getAllByRole("listitem").find(li => li.getAttribute("aria-current") === "step")!;
    expect(current.textContent).toMatch(/Finding your mentor/);
    expect(screen.queryByText("Your mentor")).toBeNull();  // no placeholder dashboard
    expect(screen.queryByText("—")).toBeNull();
  });

  it("a selected-but-not-yet-matching applicant sees the earlier stage", async () => {
    await openApp("login");
    const { MOCK_ENT_APPS } = await import("./components/IncubationManagementPage");
    const sel = MOCK_ENT_APPS.find(a => a.status === "Selected")!;
    await signInEntrepreneur(sel.email!);
    await screen.findByTestId("waiting-title");
    const current = within(screen.getByTestId("waiting-stages")).getAllByRole("listitem").find(li => li.getAttribute("aria-current") === "step")!;
    expect(current.textContent).toMatch(/Selected/);
  });

  it("the waiting screen turns into the dashboard, live, once the admin pairs them", async () => {
    await openApp("login");
    await signInEntrepreneur("madalitso.chiumia@example.com");
    await screen.findByTestId("waiting-title");
    // The admin pairs them in another tab: the store there writes the new state, this tab gets a storage event.
    const KEY = "emerge.programme.v4";
    const saved = JSON.parse(localStorage.getItem(KEY)!);
    const w = saved.waiting.find((x: any) => x.menteeId === "APP-029");
    saved.waiting = saved.waiting.filter((x: any) => x !== w && x.menteeId !== "APP-029");
    saved.pairs = [...saved.pairs, { id: "p-new", menteeId: "APP-029", mentorId: "MNT-019", programId: w.programId, mentee: "Madalitso Chiumia", mentor: "Limbani Gondwe", venture: "FarmLink", sector: "AgriTech", stage: "Idea", expertise: "CleanEnergy and Hardware", matchScore: 82, cohortId: 1, startDate: TODAY, matchedAt: TODAY }];
    const next = JSON.stringify(saved); localStorage.setItem(KEY, next);
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: next })); });
    await waitFor(() => expect(screen.queryByTestId("waiting-title")).toBeNull());
    await waitFor(() => expect(document.body.textContent).toContain("Limbani"));
    const u = userEvent.setup();
    await u.click(screen.getAllByText("My Profile")[0]);
    expect(await screen.findByText("madalitso.chiumia@example.com")).toBeTruthy(); // their own contact details
  });

  it("signs out of the waiting screen back to the login page", async () => {
    await openApp("login");
    const u = await signInEntrepreneur("madalitso.chiumia@example.com");
    await screen.findByTestId("waiting-title");
    await u.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(await screen.findByPlaceholderText("your email")).toBeTruthy();
  });
});

describe("mentor login", () => {
  async function mentorSignIn(email: string, password = PASSWORD) {
    const u = userEvent.setup();
    await u.type(screen.getByPlaceholderText("Enter your email address or username"), email);
    await u.type(screen.getByPlaceholderText("Enter your password"), password);
    await u.click(screen.getByRole("button", { name: /Sign In/ }));
    return u;
  }
  it("rejects wrong credentials and counts the attempts", async () => {
    await openApp("mentor-login");
    await mentorSignIn("tiwonge.banda@example.com", "nope12345");
    expect(await screen.findByText(/Incorrect email or password\. 4 attempts remaining/)).toBeTruthy();
  });
  it("blocks a mentor whose application is still pending", async () => {
    await openApp("mentor-login");
    const { MOCK_MNT_APPS } = await import("./components/IncubationManagementPage");
    await mentorSignIn(MOCK_MNT_APPS.find(a => a.status === "Pending")!.email!);
    expect(await screen.findByText(/mentor application is still under review/)).toBeTruthy();
  });
});


async function signInMentor(email: string) {
  await openApp("mentor-login");
  const u = userEvent.setup();
  await u.type(screen.getByPlaceholderText("Enter your email address or username"), email);
  await u.type(screen.getByPlaceholderText("Enter your password"), PASSWORD);
  await u.click(screen.getByRole("button", { name: /Sign In/ }));
  for (let i = 0; i < 6; i++) fireEvent.change(document.getElementById(`mfa-${i}`)!, { target: { value: String(i + 1) } });
  await u.click(await screen.findByRole("button", { name: /Verify/ }));
  await screen.findByText("Welcome Back!");
  await waitFor(() => expect(screen.queryByText("Welcome Back!")).toBeNull(), { timeout: 8000 });
  return u;
}

describe("mentor dashboard", () => {
  it("opens as the mentor who signed in, with their own mentees and profile", async () => {
    await signInMentor("patrick.likoswe@example.com");
    await waitFor(() => expect(document.body.textContent).toContain("Patrick Likoswe"));
    expect(screen.queryByText(/Dr\. Tiwonge Banda/, { selector: ":not(option)" })).toBeNull();
    expect(document.body.textContent).toContain("Kondwani Phiri");
  }, 15000);

  it("a mentor with no mentees yet sees a clear notice, not someone else's data", async () => {
    const { MOCK_MNT_APPS } = await import("./components/IncubationManagementPage");
    await signInMentor(MOCK_MNT_APPS.find(a => a.id === "MNT-001")!.email!);
    expect(await screen.findByTestId("no-mentees")).toBeTruthy();
    expect(screen.getAllByText(/Dr\. Thoko Banda/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Kondwani Phiri|Chisomo Banda/, { selector: ":not(option)" })).toBeNull();
  }, 15000);

  it("logging a session through the form completes the scheduled booking and stamps the real date", async () => {
    const u = await signInMentor("tiwonge.banda@example.com");
    const clock = await import("./data/clock"); // after sign-in: the app's own module instance
    clock.setClock("2026-10-14"); // Chisomo's booking (13 Oct 10:00) is now in the past
    await u.click((await screen.findAllByText("Sessions"))[0]);
    // the slot that already took place is offered for logging
    const logBtn = await screen.findByRole("button", { name: "Log session" });
    await u.click(logBtn);
    const picker = (await screen.findByLabelText("Scheduled session")) as HTMLSelectElement;
    expect(picker.selectedOptions[0].textContent).toMatch(/Scheduled:/);
    await u.click(screen.getByRole("button", { name: /Save Session Log/ }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Log session" })).toBeNull());
    const saved = JSON.parse(localStorage.getItem("emerge.programme.v4")!);
    const booking = saved.bookings.find((b: any) => b.id === "b1");
    const session = saved.sessions.find((x: any) => x.bookingId === "b1");
    expect(booking.status).toBe("completed");
    expect(session.date).toBe("2026-10-13");
  }, 20000);

  it("reviewing a mentee's progress report through the UI", async () => {
    const u = await signInMentor("tiwonge.banda@example.com");
    // mentee reports progress (sets the store directly, as the mentee tab would)
    const KEY = "emerge.programme.v4"; const saved = JSON.parse(localStorage.getItem(KEY)!);
    const g = saved.goals.find((x: any) => x.pairId === "p1" && x.status === "on-track");
    g.pending = { pct: g.pct + 10, note: "Reached 12 new farmers", at: TODAY };
    const next = JSON.stringify(saved); localStorage.setItem(KEY, next);
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: next })); });
    await u.click((await screen.findAllByText(/Goals/))[0]);
    expect(await screen.findByText(/Reached 12 new farmers/)).toBeTruthy();
    await u.click(screen.getByRole("button", { name: `Confirm ${g.pct + 10}%` }));
    await waitFor(() => expect(screen.queryByText(/Reached 12 new farmers/)).toBeNull());
    const after = JSON.parse(localStorage.getItem(KEY)!).goals.find((x: any) => x.id === g.id);
    expect(after.pct).toBe(g.pct + 10);
    expect(after.pending).toBeUndefined();
  }, 20000);
});
