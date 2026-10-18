import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function openDashboard() {
  vi.resetModules(); sessionStorage.clear();
  sessionStorage.setItem("emerge.manager.v1", "MGR-001"); sessionStorage.setItem("emerge.page", "incubation-management");
  (await import("./data/clock")).setClock("2026-10-10");
  const { default: App } = await import("./App");
  render(<App />);
  const u = userEvent.setup();
  await u.click((await screen.findAllByText("Email Dashboard"))[0]);
  return u;
}
afterEach(cleanup);
beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); localStorage.clear(); });

describe("Email Dashboard batch email", () => {
  it("emails everyone selected in one go and logs the campaign", async () => {
    const u = await openDashboard();
    await u.click(await screen.findByRole("button", { name: /Email all selected/ }));
    const dlg = await screen.findByRole("dialog", { name: "Send batch email" });
    expect(within(dlg).getByText(/recipient/)).toBeTruthy();
    expect(within(dlg).getAllByText(/Takondwa Mwale/).length).toBeGreaterThan(0);       // APP-003, Selected
    expect(within(dlg).queryByText(/Kondwani Tembo/)).toBeNull();          // APP-004, Rejected: not in this batch
    await u.click(within(dlg).getByRole("button", { name: /^Send to \d+/ }));
    expect(await within(dlg).findByText(/recorded/)).toBeTruthy();
    const link = within(dlg).getByRole("link", { name: /Open in mail app/ }) as HTMLAnchorElement;
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain("takondwa.mwale@gmail.com"); // the batch that was just sent, not an empty list
    const saved = JSON.parse(localStorage.getItem("emerge.emailCampaigns.v1")!);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ audience: "Selected", status: "Queued" });
    expect(saved[0].log.map((l: any) => l.name)).toContain("Takondwa Mwale");
    await u.click(within(dlg).getByRole("button", { name: "Done" }));
    expect((await screen.findAllByText("Queued")).length).toBeGreaterThan(0);
  }, 20000);

  it("emails everyone rejected, with their own reason in the preview", async () => {
    const u = await openDashboard();
    await u.click(await screen.findByRole("button", { name: /Email all rejected/ }));
    const dlg = await screen.findByRole("dialog", { name: "Send batch email" });
    expect(within(dlg).getAllByText(/Kondwani Tembo/).length).toBeGreaterThan(0);        // APP-004, Rejected
    expect(within(dlg).queryByText(/Takondwa Mwale/)).toBeNull();
    expect(within(dlg).getAllByText(/unable to take it forward/).length).toBeGreaterThan(0);
    await u.click(within(dlg).getByRole("button", { name: /^Send to \d+/ }));
    expect(JSON.parse(localStorage.getItem("emerge.emailCampaigns.v1")!)[0].audience).toBe("Rejected");
  }, 20000);

  it("does not email the same people the same decision twice", async () => {
    const u = await openDashboard();
    await u.click(await screen.findByRole("button", { name: /Email all selected/ }));
    let dlg = await screen.findByRole("dialog", { name: "Send batch email" });
    await u.click(within(dlg).getByRole("button", { name: /^Send to \d+/ }));
    await u.click(await within(dlg).findByRole("button", { name: "Done" }));
    await u.click(await screen.findByRole("button", { name: /Email all selected/ }));
    dlg = await screen.findByRole("dialog", { name: "Send batch email" });
    expect(within(dlg).getByText(/Nobody to send to/)).toBeTruthy();
    expect(within(dlg).getByRole("button", { name: /^Send to 0/ }).hasAttribute("disabled")).toBe(true);
  }, 25000);

  it("counts only real campaigns in the figures, labels the demo rows, and lets a Queued batch be marked as sent", async () => {
    const u = await openDashboard();
    const num = (label: string) => Number(within(screen.getAllByText(label).find(e => e.className.includes("tracking-wider"))!.parentElement!).getByText(/^\d+$|^—$|%$/).textContent!.replace("%", "").replace("—", "NaN"));
    expect(num("Queued")).toBe(0);
    expect(num("Sent")).toBe(0);
    expect(Number.isNaN(num("Avg. Open"))).toBe(true); // no mail service: no open rate, not the demo numbers
    expect(screen.getAllByText("Sample").length).toBeGreaterThan(0);
    await u.click(await screen.findByRole("button", { name: /Email all selected/ }));
    const dlg = await screen.findByRole("dialog", { name: "Send batch email" });
    await u.click(within(dlg).getByRole("button", { name: /^Send to \d+/ }));
    await u.click(await within(dlg).findByRole("button", { name: "Done" }));
    expect(num("Queued")).toBe(1);
    await u.click(await screen.findByRole("button", { name: "Mark as sent" }));
    expect(num("Queued")).toBe(0);
    expect(num("Sent")).toBe(1);
    expect(JSON.parse(localStorage.getItem("emerge.emailCampaigns.v1")!)[0].status).toBe("Sent");
  }, 25000);
});
