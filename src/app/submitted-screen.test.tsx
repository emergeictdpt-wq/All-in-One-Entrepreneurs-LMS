import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IncubationApplicationForm } from "./components/IncubationApplicationForm";
import { setClock } from "./data/clock";

afterEach(cleanup);
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); setClock("2026-10-10"); });

describe("Application Submitted screen", () => {
  it("shows the confirmation, reference number, summary and both actions", async () => {
    const onTrack = vi.fn();
    const onBack = vi.fn();
    render(<IncubationApplicationForm onBack={onBack} onTrack={onTrack} onSubmitApplication={() => null} programId="p1" programName="P1" />);
    const u = userEvent.setup();
    const next = () => u.click(screen.getByRole("button", { name: /Continue|Submit Application/ }));
    await u.click(screen.getByText("Idea Stage"));
    await next();
    await u.type(screen.getByPlaceholderText("Amina"), "Esther");
    await u.type(screen.getByPlaceholderText("Banda"), "Zimba");
    await u.selectOptions(screen.getByDisplayValue("Select gender"), "Female");
    await u.selectOptions(screen.getByDisplayValue("Select age group"), "18-35");
    await u.type(screen.getByPlaceholderText("amina@example.com"), "esther.zimba@example.com");
    await u.type(screen.getByPlaceholderText(/At least 8/), "Sunrise2026");
    await u.type(screen.getByPlaceholderText("Repeat your password"), "Sunrise2026");
    await u.type(screen.getByPlaceholderText("+265 88 000 0000"), "0888 123 456");
    await u.type(screen.getByPlaceholderText("e.g. V32N6SM4"), "ZX445566");
    await next();
    for (let i = 0; i < 20 && !screen.queryByText("Application Submitted!"); i++) await next();

    expect(screen.getByText("Application Submitted!")).toBeTruthy();
    expect(screen.getByText("Reference number")).toBeTruthy();
    expect(screen.getByText("esther.zimba@example.com")).toBeTruthy();
    for (const label of ["Applicant", "Business Stage(s)", "Business", "Sector"]) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText("Esther Zimba")).toBeTruthy();
    await u.click(screen.getByRole("button", { name: "Track this application" }));
    expect(onTrack).toHaveBeenCalledTimes(1);
    await u.click(screen.getByRole("button", { name: "Return to Home" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
