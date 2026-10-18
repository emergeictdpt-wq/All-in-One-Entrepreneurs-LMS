import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IncubationApplicationForm } from "./components/IncubationApplicationForm";
import { setClock } from "./data/clock";

afterEach(cleanup);
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); setClock("2026-10-10"); });

async function toSectorStep() {
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
  for (let i = 0; i < 6 && !screen.queryByDisplayValue("Select sector"); i++) await next();
  return screen.getByDisplayValue("Select sector") as HTMLSelectElement;
}

describe("sector choices on the entrepreneur application", () => {
  it("offers the standard list when the project has none of its own", async () => {
    render(<IncubationApplicationForm onBack={() => {}} programId="p1" programName="P1" />);
    const select = await toSectorStep();
    expect(Array.from(select.options).map(o => o.text)).toContain("Technology & ICT");
  });
  it("offers only the sectors the project's admin set", async () => {
    render(<IncubationApplicationForm onBack={() => {}} programId="p1" programName="P1" sectors={["Fisheries", "Aquaculture"]} />);
    const select = await toSectorStep();
    expect(Array.from(select.options).map(o => o.text)).toEqual(["Select sector", "Fisheries", "Aquaculture"]);
  });
});
