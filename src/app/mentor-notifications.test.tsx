import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// MGR-001 champions the core Incubation project, where the sample mentors MNT-003 (Selected) and MNT-004 (Pending) sit.
async function openIncubation() {
  vi.resetModules(); sessionStorage.clear();
  sessionStorage.setItem("emerge.manager.v1", "MGR-001"); sessionStorage.setItem("emerge.page", "incubation-management");
  (await import("./data/clock")).setClock("2026-10-10");
  const { default: App } = await import("./App");
  render(<App />);
  return userEvent.setup();
}
afterEach(cleanup);
beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); localStorage.clear(); });

const unreadFor = (section: string) => screen.queryByLabelText(new RegExp(`unread notifications? in ${section}`));

describe("mentors follow the same stages as entrepreneurs, and raise notifications", () => {
  it("selecting a mentor lands in Selection, notifies in the tracker, and badges the section on the Mentors tab only", async () => {
    const u = await openIncubation();
    await u.click(await screen.findByRole("button", { name: /^Mentors/ }));
    await screen.findAllByText("Mr. Patrick Tembo");
    const row = screen.getAllByText("Mr. Patrick Tembo").map(e => e.closest("tbody tr")).find(Boolean)!; // not the column-filter options in the header
    await u.click(within(row).getByTitle("More actions"));
    await u.click(await screen.findByRole("button", { name: /Select$/ }));
    await u.click(await screen.findByRole("button", { name: /Confirm Select and Shortlist/ }));

    // the sidebar badge for Selection shows on the Mentors tab (the seeded mentor notification plus this one)
    expect(unreadFor("Selection")?.textContent).toBe("2");
    // and the tracker has a mentor-labelled entry
    await u.click(screen.getByTitle(/Incubation Activity Notifications/));
    await u.click(await screen.findByRole("button", { name: /^Mentors/, pressed: false })); // the tracker's own filter
    expect(await screen.findByText(/Mr\. Patrick Tembo \(MNT-004\) has been selected as an Incubation mentor/)).toBeTruthy();
    expect(screen.getAllByText("Mentor Selected").length).toBeGreaterThan(0);

    // the mentor now shows under Selection
    await u.click(screen.getAllByRole("button", { name: /^Selection/ })[0]);
    expect(await screen.findByText("Selected Mentor Applications")).toBeTruthy();
    expect(screen.getAllByText("Mr. Patrick Tembo").length).toBeGreaterThan(0);

    // switching to Entrepreneurs: that badge describes entrepreneurs, not the mentor notification
    await u.click(screen.getAllByRole("button", { name: /^Entrepreneurs/ })[0]);
    expect(unreadFor("Selection")?.textContent ?? "0").not.toBe("2");
  }, 40000);

  it("opening a mentor notification switches to the Mentors tab", async () => {
    const u = await openIncubation();
    // Entrepreneurs tab is the default
    expect(screen.getByText("Entrepreneur Applications")).toBeTruthy();
    await u.click(screen.getByTitle(/Incubation Activity Notifications/));
    await u.click(await screen.findByText(/Ms\. Rejoice Mwale \(MNT-003\) was selected as an Incubation mentor/));
    expect(await screen.findByText("Selected Mentor Applications")).toBeTruthy();
  }, 30000);
});
