import { render, screen, cleanup, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PASSWORD = "Emerge@2025";
async function signIn(email: string) {
  vi.resetModules(); localStorage.clear(); sessionStorage.clear();
  sessionStorage.setItem("emerge.page", "login");
  const clock = await import("../data/clock"); clock.setClock("2026-10-10");
  const { default: App } = await import("../App");
  render(<App />);
  const u = userEvent.setup();
  await u.type(screen.getByPlaceholderText("your email"), email);
  await u.type(screen.getByPlaceholderText("Enter your password"), PASSWORD);
  await u.click(screen.getByRole("button", { name: /^Sign In/ }));
  await screen.findAllByText(/MENTEE PORTAL/);
  return u;
}
afterEach(cleanup);
beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); Element.prototype.scrollIntoView = vi.fn(); });

describe("mentee dashboard", () => {
  it("shows next steps on the overview", async () => {
    await signIn("chisomo.banda@gmail.com");
    expect(screen.getByText("Your next steps")).toBeTruthy();
  });

  it("explains the match from real profile data, not fixed percentages", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await u.click(screen.getByRole("button", { name: /^My Mentor/ }));
    expect(screen.getByText("Why you were matched")).toBeTruthy();
    expect(screen.queryByText("Working Style")).toBeNull();
    expect(screen.queryByText("95%")).toBeNull();
  });

  it("session prep uses this mentee's own blockers, never another founder's", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await u.click(screen.getByRole("button", { name: "Sessions" }));
    expect(screen.getByText("OPEN BLOCKERS")).toBeTruthy();
    expect(screen.queryByText(/Updated survey results \(38\/50 done\)/)).toBeNull();
  });

  it("a question for the mentor is sent as a message", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await u.click(screen.getByRole("button", { name: "Sessions" }));
    await u.type(screen.getByLabelText(/Questions for your mentor/), "How do I price my service?");
    await u.click(screen.getByRole("button", { name: "Send" }));
    await u.click(screen.getByRole("button", { name: /^My Mentor/ }));
    expect(await screen.findByText(/Question for our next session: How do I price my service\?/)).toBeTruthy();
  });

  it("profile does not invent venture facts", async () => {
    const u = await signIn("kondwani.phiri@example.com");
    await u.click(screen.getByRole("button", { name: "My Profile" }));
    expect(screen.queryByText("Year Started")).toBeNull();
    expect(screen.getByText("MWK 180,000")).toBeTruthy(); // Kondwani's real revenue figure
  });

  it("Message Mentor focuses the chat box", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await u.click(screen.getByRole("button", { name: /^My Mentor/ }));
    await u.click(screen.getByRole("button", { name: /Message Mentor/ }));
    expect(document.activeElement).toBe(screen.getByLabelText(/^Message /));
  });

  it("dialogs are labelled and close with Escape", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await u.click(screen.getByRole("button", { name: "Goals and Milestones" }));
    await u.click(screen.getByRole("button", { name: /New Goal/ }));
    expect(screen.getByRole("dialog", { name: "Propose a goal" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("goal rows can be opened from the keyboard", async () => {
    const u = await signIn("chisomo.banda@gmail.com");
    await u.click(screen.getByRole("button", { name: "Goals and Milestones" }));
    const row = screen.getAllByRole("button", { expanded: false }).find(b => b.getAttribute("tabindex") === "0")!;
    row.focus();
    await u.keyboard("{Enter}");
    expect(row.getAttribute("aria-expanded")).toBe("true");
  });
});
