import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

async function open(page: "mentor-register" | "incubation-apply" | "acceleration-apply") {
  vi.resetModules(); sessionStorage.clear(); sessionStorage.setItem("emerge.page", page);
  const { default: App } = await import("./App");
  render(<App />);
  return userEvent.setup();
}

describe("mentor registration rejects duplicates right away", () => {
  beforeEach(() => localStorage.clear());

  it("same email as an existing mentor", async () => {
    const u = await open("mentor-register");
    await u.type(screen.getByPlaceholderText("your@email.com"), "Tiwonge.Banda@example.com");
    expect((await screen.findByRole("alert")).textContent).toMatch(/email address has already been submitted/);
    await u.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText("Create Your Account")).toBeTruthy(); // did not move on
  });

  it("same National ID as an application already in the system, even with a new email and phone", async () => {
    localStorage.setItem("emerge.mentorApplications.v1", JSON.stringify([{ id: "MNT-1", name: "Old Applicant", district: "Lilongwe", phone: "+265 999 000 111", expertise: "Finance", date: "2026-10-01", status: "Pending", score: 50, program: "Incubation", isMockup: false, email: "old@example.com", nationalId: "KR482139" }]));
    const u = await open("mentor-register");
    await u.type(screen.getByPlaceholderText("your@email.com"), "different@example.com");
    await u.type(screen.getAllByPlaceholderText("+265 88 000 0000")[0], "0888 222 333");
    await u.type(screen.getByPlaceholderText("e.g. V32N6SM4"), "kr 482-139");
    expect((await screen.findByRole("alert")).textContent).toMatch(/National ID has already been submitted/);
  });

  it("same phone number written differently", async () => {
    const u = await open("mentor-register");
    await u.type(screen.getAllByPlaceholderText("+265 88 000 0000")[0], "0999017017"); // Dr. Tiwonge Banda: +265 999 017 017
    expect((await screen.findByRole("alert")).textContent).toMatch(/phone number has already been submitted/);
  });

  it("a new person is not blocked", async () => {
    const u = await open("mentor-register");
    await u.type(screen.getByPlaceholderText("your@email.com"), "brand.new@example.com");
    await u.type(screen.getAllByPlaceholderText("+265 88 000 0000")[0], "0888 555 666");
    await u.type(screen.getByPlaceholderText("e.g. V32N6SM4"), "NW778899");
    expect(screen.queryByRole("alert")).toBeNull();
    await u.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.queryByText("Create Your Account")).toBeNull();
  });

  it("asks for the National ID and phone before letting a blank step 1 continue", async () => {
    const u = await open("mentor-register");
    await u.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText("Create Your Account")).toBeTruthy();
    expect((await screen.findByRole("alert")).textContent).toMatch(/phone number|National ID/);
  });
});

describe("entrepreneur application rejects duplicates right away", () => {
  beforeEach(() => localStorage.clear());

  it("incubation: same phone as an existing entrepreneur stops the personal-details step", async () => {
    const u = await open("incubation-apply");
    await u.click(screen.getByText("Idea Stage"));
    await u.click(screen.getByRole("button", { name: /Continue/ }));
    await u.type(screen.getByPlaceholderText("amina@example.com"), "fresh@example.com");
    await u.type(screen.getByPlaceholderText("+265 88 000 0000"), "+265 999 125 025"); // Kondwani Phiri
    await u.type(screen.getByPlaceholderText("e.g. V32N6SM4"), "NW112233");
    expect((await screen.findByRole("alert")).textContent).toMatch(/phone number has already been submitted/);
    await u.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText("Personal Details")).toBeTruthy(); // did not move on
  });

  it("incubation: same National ID as a stored application", async () => {
    localStorage.setItem("emerge.applications.v1", JSON.stringify([{ id: "APP-1", name: "Earlier Applicant", district: "Zomba", phone: "+265 881 000 000", sector: "Retail", date: "2026-10-01", status: "Pending", score: 10, program: "Incubation", isMockup: false, email: "earlier@example.com", nationalId: "AB123456" }]));
    const u = await open("incubation-apply");
    await u.click(screen.getByText("Idea Stage"));
    await u.click(screen.getByRole("button", { name: /Continue/ }));
    await u.type(screen.getByPlaceholderText("amina@example.com"), "fresh@example.com");
    await u.type(screen.getByPlaceholderText("+265 88 000 0000"), "0888 777 666");
    await u.type(screen.getByPlaceholderText("e.g. V32N6SM4"), "ab-123 456");
    expect((await screen.findByRole("alert")).textContent).toMatch(/National ID has already been submitted/);
  });

  it("acceleration: collects phone and National ID, and flags a duplicate email", async () => {
    const u = await open("acceleration-apply");
    await u.click(screen.getAllByRole("button", { name: /Leadership Team/ })[0]); // desktop sidebar + mobile strip both render it
    await u.type(screen.getByPlaceholderText("you@company.com"), "kondwani.phiri@example.com");
    expect(screen.getByPlaceholderText("e.g. V32N6SM4")).toBeTruthy();
    expect(screen.getAllByPlaceholderText("+265 88 000 0000").length).toBeGreaterThan(0);
    expect((await screen.findByRole("alert")).textContent).toMatch(/email address has already been submitted/);
  });
});
