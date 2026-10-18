import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function openAsManager(id = "MGR-002") {
  vi.resetModules(); sessionStorage.clear();
  sessionStorage.setItem("emerge.manager.v1", id);
  sessionStorage.setItem("emerge.page", "program-managers");
  (await import("./data/clock")).setClock("2026-10-10");
  const { default: App } = await import("./App");
  return render(<App />);
}
const card = (label: string) => screen.getByText(label).parentElement as HTMLElement;
const numberIn = (el: HTMLElement) => Number((el.querySelector(".font-black")?.textContent ?? "").replace(/,/g, ""));

afterEach(cleanup);
beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); localStorage.clear(); });

describe("Projects Overview is computed, not hard-coded", () => {
  it("shows the real program and application counts, and moves when an application arrives", async () => {
    const { MOCK_ENT_APPS, MOCK_MNT_APPS } = await import("./components/IncubationManagementPage");
    const apps = [{ id: "APP-LIVE-1", name: "Live Person", district: "Karonga", phone: "1", sector: "Fishing", date: "2026-10-10", status: "Pending", score: 50, program: "Incubation", programId: "shemerge-incubation", isMockup: false, gender: "Female" }];
    localStorage.setItem("emerge.applications.v1", JSON.stringify(apps));
    await openAsManager();
    await screen.findByTestId("projects-directory");
    await waitFor(() => expect(numberIn(card("Total Programs"))).toBe(3), { timeout: 5000 });
    await waitFor(() => expect(numberIn(card("Entrepreneurs Reached"))).toBe(MOCK_ENT_APPS.length + 1), { timeout: 5000 });
    await waitFor(() => expect(numberIn(card("Mentors Reached"))).toBe(MOCK_MNT_APPS.length), { timeout: 5000 });
    await waitFor(() => expect(numberIn(card("Projects Implemented"))).toBe(3), { timeout: 5000 });
    // the live applicant's own district and sector are in the numbers
    const districts = new Set([...MOCK_ENT_APPS.map(a => a.district), "Karonga"]);
    await waitFor(() => expect(numberIn(card("Districts Reached"))).toBe(districts.size), { timeout: 5000 });
  }, 20000);
});

describe("notification bell", () => {
  it("lists notifications for the manager's projects, marks them read, and saves that where Incubation Management reads it", async () => {
    await openAsManager("MGR-002"); // champions shemerge-incubation
    await screen.findByTestId("projects-directory");
    const u = userEvent.setup();
    const bell = screen.getByTitle(/Incubation Activity Notifications \((\d+) unread\)/);
    const unread = Number(/\((\d+) unread\)/.exec(bell.getAttribute("title")!)![1]);
    expect(unread).toBeGreaterThan(0);
    await u.click(bell);
    await u.click(await screen.findByTitle("Mark all as read"));
    expect(screen.getByTitle("Incubation Activity Notifications (0 unread)")).toBeTruthy();
    // stored where Incubation Management reads them
    const saved = JSON.parse(localStorage.getItem("emerge.admin.decisions.v1")!);
    expect(saved.notifications.every((n: any) => n.read || n.programId !== "shemerge-incubation")).toBe(true);
  }, 20000);

  it("raises a notification when a new application arrives for a project the manager champions", async () => {
    await openAsManager("MGR-002");
    await screen.findByTestId("projects-directory");
    const app = { id: "APP-LIVE-2", name: "Newly Arrived", district: "Mzimba", phone: "2", sector: "Tea", date: "2026-10-10", status: "Pending", score: 60, program: "Incubation", programId: "shemerge-incubation", isMockup: false, gender: "Male" };
    await act(async () => {
      localStorage.setItem("emerge.applications.v1", JSON.stringify([app]));
      window.dispatchEvent(new StorageEvent("storage", { key: "emerge.applications.v1", newValue: JSON.stringify([app]) }));
    });
    const u = userEvent.setup();
    await u.click(screen.getByTitle(/Incubation Activity Notifications/));
    expect(await screen.findByText(/Newly Arrived submitted an Incubation application/)).toBeTruthy();
  }, 20000);
});
