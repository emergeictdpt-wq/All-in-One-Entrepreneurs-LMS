import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerCredential } from "./data/auth";
import { AccountFields, accountProblem } from "./components/AccountFields";

afterEach(cleanup);

function Harness({ email }: { email: string }) {
  const [v, set] = useState({ password: "", confirm: "" });
  return <div><AccountFields role="mentee" variant="light" email={email} password={v.password} confirm={v.confirm} onChange={set} />
    <output data-testid="problem">{accountProblem("mentee", email, v.password, v.confirm)}</output></div>;
}

describe("sign-up password fields", () => {
  it("block submission until the email is valid and the passwords are strong and match", async () => {
    localStorage.clear();
    const u = userEvent.setup();
    render(<Harness email="esther@example.com" />);
    expect(screen.getByTestId("problem").textContent).toMatch(/8 characters/);
    await u.type(screen.getByPlaceholderText(/At least 8/), "Sunrise2026");
    await u.type(screen.getByPlaceholderText("Repeat your password"), "Sunrise2025");
    expect(screen.getByTestId("problem").textContent).toMatch(/do not match/);
    await u.clear(screen.getByPlaceholderText("Repeat your password"));
    await u.type(screen.getByPlaceholderText("Repeat your password"), "Sunrise2026");
    expect(screen.getByTestId("problem").textContent).toBe("");
    expect(accountProblem("mentee", "not-an-email", "Sunrise2026", "Sunrise2026")).toMatch(/valid email/);
  });

  it("an existing account keeps its password instead of asking for a new one", async () => {
    localStorage.clear();
    await registerCredential("mentee", "esther@example.com", "APP-1", "Sunrise2026");
    render(<Harness email="Esther@Example.com" />);
    expect(screen.getByText(/account already exists/)).toBeTruthy();
    expect(screen.queryByPlaceholderText("Repeat your password")).toBeNull();
    expect(screen.getByTestId("problem").textContent).toBe("");
  });
});

describe("mentee reports progress, mentor confirms", () => {
  it("the report waits for the mentor and does not move the percentage", async () => {
    vi.resetModules(); localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem("emerge.page", "login");
    (await import("./data/clock")).setClock("2026-10-10");
    const { default: App } = await import("./App"); render(<App />);
    const u = userEvent.setup();
    await u.type(screen.getByPlaceholderText("your email"), "chisomo.banda@gmail.com");
    await u.type(screen.getByPlaceholderText("Enter your password"), "Emerge@2025");
    await u.click(screen.getByRole("button", { name: /^Sign In/ }));
    await u.click((await screen.findAllByText("Goals and Milestones"))[0]);
    const before = JSON.parse(localStorage.getItem("emerge.programme.v4")!).goals.find((g: any) => g.pairId === "p1" && g.status === "on-track");
    await u.click(await screen.findByText(before.title));
    await u.click(await screen.findByRole("button", { name: "Report progress" }));
    await u.click(screen.getByRole("button", { name: "Send for confirmation" }));      // no note yet
    expect(JSON.parse(localStorage.getItem("emerge.programme.v4")!).goals.find((g: any) => g.id === before.id).pending).toBeUndefined();
    await u.type(screen.getByLabelText("What changed"), "Signed up 5 new buyers");
    await u.click(screen.getByRole("button", { name: "Send for confirmation" }));
    await waitFor(() => {
      const g = JSON.parse(localStorage.getItem("emerge.programme.v4")!).goals.find((x: any) => x.id === before.id);
      expect(g.pending).toMatchObject({ pct: Math.min(99, before.pct + 10), note: "Signed up 5 new buyers" });
      expect(g.pct).toBe(before.pct);
    });
    expect(await screen.findByText(/Waiting for your mentor/)).toBeTruthy();
  }, 20000);
});
