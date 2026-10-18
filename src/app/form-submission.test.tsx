import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IncubationApplicationForm } from "./components/IncubationApplicationForm";
import { MentorRegistrationForm } from "./components/MentorRegistrationForm";
import { setClock } from "./data/clock";
import type { EntrepreneurApplication, MentorApplication } from "./types";

afterEach(cleanup);
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); setClock("2026-10-10"); });

describe("entrepreneur application keeps everything that was filled in", () => {
  it("submits the demographics (PWD included), age group and the other sections, never the password", async () => {
    const onSubmit = vi.fn().mockReturnValue(null);
    render(<IncubationApplicationForm onBack={() => {}} onSubmitApplication={onSubmit} programId="shemerge-incubation" programName="Zantchito Incubation" />);
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
    await u.click(screen.getByLabelText("Person with disability"));
    await u.click(screen.getByLabelText("Youth-owned business (under 35)"));
    await next();
    for (let i = 0; i < 20 && !onSubmit.mock.calls.length; i++) {
      if (!screen.queryByRole("button", { name: /Submit Application/ })) { await next(); continue; }
      await next();
    }
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const app = onSubmit.mock.calls[0][0] as EntrepreneurApplication;
    expect(app).toMatchObject({ gender: "Female", ageGroup: "18-35", pwd: true, youthOwned: true, womanOwned: false, programId: "shemerge-incubation" });
    expect(app.submission).toMatchObject({ stages: ["idea"], personal: { firstName: "Esther", disability: true, ageGroup: "18-35" } });
    expect(JSON.stringify(app)).not.toContain("Sunrise2026");
  }, 30000);
});

describe("mentor registration", () => {
  it("asks the PWD question and submits it with the other sections, never the password", async () => {
    const onSubmit = vi.fn().mockReturnValue(null);
    render(<MentorRegistrationForm onBack={() => {}} onSubmitMentorApplication={onSubmit} projects={[{ id: "shemerge-incubation", name: "Zantchito Incubation" }]} />);
    const u = userEvent.setup();
    await u.type(screen.getByPlaceholderText("Grace"), "Tiyamike");
    await u.type(screen.getByPlaceholderText("Mwale"), "Jere");
    await u.selectOptions(screen.getByDisplayValue("Select gender"), "Male");
    await u.selectOptions(screen.getByDisplayValue("Select age group"), "35+");
    await u.type(screen.getByPlaceholderText("your@email.com"), "tiyamike.jere@example.com");
    await u.type(screen.getAllByPlaceholderText("+265 88 000 0000")[0], "0888 765 432");
    await u.type(screen.getByPlaceholderText("e.g. V32N6SM4"), "QW112233");
    await u.type(screen.getByPlaceholderText("Create a strong password"), "Sunrise2026!");
    await u.type(screen.getByPlaceholderText("Repeat your password"), "Sunrise2026!");
    await u.selectOptions(screen.getByDisplayValue("Select programme"), "Incubation");
    await u.selectOptions(screen.getByLabelText("Incubation project"), "shemerge-incubation");
    await u.click(screen.getByLabelText(/I am a person with a disability/));
    expect((screen.getByLabelText(/I am a person with a disability/) as HTMLInputElement).checked).toBe(true);
    for (let i = 0; i < 14 && !screen.queryByText(/13 \/ 13/); i++) await u.click(screen.getByRole("button", { name: /Continue/ }));
    await u.click(screen.getByRole("button", { name: /Submit/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const app = onSubmit.mock.calls[0][0] as MentorApplication;
    expect(app).toMatchObject({ gender: "Male", pwd: true, ageGroup: "35+", programId: "shemerge-incubation" });
    expect(app.submission).toMatchObject({ account: { firstName: "Tiyamike", pwd: true, ageGroup: "35+" } });
    expect(JSON.stringify(app)).not.toContain("Sunrise2026");
  }, 40000);
});
