import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PASSWORD = "Emerge@2025";
async function openAs(managerId: string | null, page: "program-managers" | "incubation-management" | "login" = "program-managers") {
  vi.resetModules(); sessionStorage.clear();
  if (page === "login") localStorage.clear();
  if (managerId) sessionStorage.setItem("emerge.manager.v1", managerId);
  sessionStorage.setItem("emerge.page", page);
  (await import("./data/clock")).setClock("2026-10-10");
  const { default: App } = await import("./App");
  return render(<App />);
}
afterEach(cleanup);
beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); localStorage.clear(); });

describe("manager login", () => {
  it("rejects anyone who is not a manager, and signs a real manager in as themselves", async () => {
    await openAs(null, "login");
    const u = userEvent.setup();
    await u.click(screen.getAllByRole("button").find(b => /manager/i.test(b.textContent ?? "") && !/sign/i.test(b.textContent ?? ""))!);
    await u.type(screen.getByPlaceholderText("your email"), "random@example.com");
    await u.type(screen.getByPlaceholderText("Enter your password"), "whatever123");
    await u.click(screen.getByRole("button", { name: /^Sign In/ }));
    expect(await screen.findByText(/Incorrect email or password/)).toBeTruthy();
    await u.clear(screen.getByPlaceholderText("your email")); await u.clear(screen.getByPlaceholderText("Enter your password"));
    await u.type(screen.getByPlaceholderText("your email"), "thandiwe.kalua@emergelivelihoods.org");
    await u.type(screen.getByPlaceholderText("Enter your password"), PASSWORD);
    await u.click(screen.getByRole("button", { name: /^Sign In/ }));
    await screen.findByTestId("projects-directory");
    expect(document.body.textContent).toContain("Thandiwe Kalua");
  }, 15000);

  it("the manager pages are closed to someone who has not signed in", async () => {
    await openAs(null, "incubation-management");
    await waitFor(() => expect(screen.queryByTestId("projects-directory")).toBeNull());
    expect(await screen.findByPlaceholderText("your email")).toBeTruthy();
  });
});

describe("Program Managers page shows every project", () => {
  it("lists all projects to every manager, marking only the ones they champion", async () => {
    await openAs("MGR-002");
    const dir = await screen.findByTestId("projects-directory");
    for (const id of ["emerge4biz-core", "shemerge-incubation", "agri-incubation"]) expect(within(dir).getByTestId(`project-${id}`)).toBeTruthy();
    expect(within(screen.getByTestId("project-shemerge-incubation")).getByText("You champion this")).toBeTruthy();
    expect(within(screen.getByTestId("project-emerge4biz-core")).queryByText("You champion this")).toBeNull();
    expect(within(screen.getByTestId("project-emerge4biz-core")).getByText(/Managed by Chikondi Mwale, Yohane Phiri/)).toBeTruthy();
    expect(screen.getByText("You champion 1 of 3")).toBeTruthy();
  });
});

describe("Incubation Management shows only the manager's own projects", () => {
  const SWITCHER = /All my projects/;
  async function projectsInSwitcher() {
    const u = userEvent.setup();
    await u.click(await screen.findByRole("button", { name: SWITCHER }));
    const box = await screen.findByRole("listbox");
    return { u, text: box.textContent ?? "" };
  }

  it("one manager sees their program and nothing of another's, in the switcher and in the data", async () => {
    const { MOCK_ENT_APPS } = await import("./components/IncubationManagementPage");
    const sheNames = MOCK_ENT_APPS.filter(a => a.programId === "shemerge-incubation").map(a => a.name);
    const coreNames = MOCK_ENT_APPS.filter(a => a.programId === "emerge4biz-core").map(a => a.name);
    expect(sheNames.length).toBeGreaterThan(0); expect(coreNames.length).toBeGreaterThan(0);

    await openAs("MGR-001", "incubation-management");
    const { text } = await projectsInSwitcher();
    expect(text).toContain("Zantchito Incubation");
    expect(text).not.toContain("GJA&Y");
    expect(text).not.toContain("AgriInnovation");
    expect(document.body.textContent).toContain(coreNames[0]);
    for (const n of sheNames) expect(document.body.textContent).not.toContain(n);
    cleanup();

    await openAs("MGR-002", "incubation-management");
    const second = await projectsInSwitcher();
    expect(second.text).toContain("GJA&Y");
    expect(second.text).not.toContain("Zantchito Incubation");
    expect(document.body.textContent).toContain(sheNames[0]);
    for (const n of coreNames) expect(document.body.textContent).not.toContain(n);
  }, 30000);

  it("a manager who champions two programs sees both, and the shared one is shared", async () => {
    await openAs("MGR-003", "incubation-management");
    const { text } = await projectsInSwitcher();
    expect(text).toContain("Zantchito Incubation");
    expect(text).toContain("AgriInnovation Incubation");
    expect(text).not.toContain("GJA&Y");
  }, 15000);

  it("a program a manager creates appears in their Incubation Management, and not in another manager's", async () => {
    await openAs("MGR-002", "incubation-management");
    const u = userEvent.setup();
    await u.click((await screen.findAllByText("Programme Admin"))[0]);   // the section is collapsed by default
    await u.click((await screen.findAllByText("Program Setup"))[0]);
    await u.click(await screen.findByRole("button", { name: /Add New Program/ }));
    await u.type(await screen.findByPlaceholderText("Zantchito Incubation"), "Lake Youth Skills Lab");
    await u.click(screen.getByRole("button", { name: /Save Changes/ }));
    await u.click(screen.getByRole("button", { name: /Create Program/ }));
    const saved = JSON.parse(localStorage.getItem("emerge.programs.v1") ?? localStorage.getItem(Object.keys(localStorage).find(k => /program/i.test(k) && !/programme/i.test(k))!)!);
    const created = saved.find((p: any) => p.name === "Lake Youth Skills Lab");
    expect(created.managerIds).toEqual(["MGR-002"]);
    const { text } = await projectsInSwitcher();
    expect(text).toContain("Lake Youth Skills Lab");   // appears at once for its creator
    expect(text).toContain("GJA&Y");
    cleanup();

    await openAs("MGR-001", "incubation-management");  // another manager: not theirs
    expect((await projectsInSwitcher()).text).not.toContain("Lake Youth Skills Lab");
    cleanup();

    await openAs("MGR-001", "program-managers");        // ...but it is on the all-projects page
    expect(within(await screen.findByTestId(`project-${created.id}`)).getByText(/Managed by Thandiwe Kalua/)).toBeTruthy();
  }, 30000);

  it("the sample programs are saved with their managers", async () => {
    await openAs("MGR-001", "incubation-management");
    const key = Object.keys(localStorage).find(k => /program/i.test(k) && !/programme/i.test(k))!;
    expect(key).toBeTruthy();
    const before = JSON.parse(localStorage.getItem(key)!).find((p: any) => p.id === "emerge4biz-core");
    expect(before.managerIds).toEqual(["MGR-001", "MGR-003"]);
  });
});

describe("programs nobody champions yet", () => {
  it("are hidden from Incubation Management until a manager takes them on", async () => {
    vi.resetModules(); localStorage.clear(); sessionStorage.clear();
    const { legacyPrograms } = await import("./data/legacyPrograms");
    localStorage.setItem("emerge.programs.v1", JSON.stringify([...legacyPrograms, { ...legacyPrograms[0], id: "old-one", name: "Old Orphan Programme" }]));
    sessionStorage.setItem("emerge.manager.v1", "MGR-002"); sessionStorage.setItem("emerge.page", "program-managers");
    (await import("./data/clock")).setClock("2026-10-10");
    const { default: App } = await import("./App");
    render(<App />);
    const card = await screen.findByTestId("project-old-one");
    expect(within(card).getByText("No manager yet")).toBeTruthy();
    await userEvent.setup().click(within(card).getByRole("button", { name: "Take on this project" }));
    await waitFor(() => expect(within(screen.getByTestId("project-old-one")).getByText("You champion this")).toBeTruthy());
  }, 15000);
});
