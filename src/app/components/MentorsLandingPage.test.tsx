import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MentorsLandingPage } from "./MentorsLandingPage";
import { MENTOR_DRAFT_KEY, readMentorDraft, writeMentorDraft, clearMentorDraft } from "../data/mentorDraft";

beforeEach(() => {
  localStorage.clear();
  (globalThis as any).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
});

describe("mentor draft storage", () => {
  it("round-trips and clears a draft", () => {
    writeMentorDraft(4, { acct: { firstName: "Amina" } });
    expect(readMentorDraft()?.step).toBe(4);
    clearMentorDraft();
    expect(readMentorDraft()).toBeNull();
  });
  it("ignores corrupt and expired drafts", () => {
    localStorage.setItem(MENTOR_DRAFT_KEY, "{not json");
    expect(readMentorDraft()).toBeNull();
    localStorage.setItem(MENTOR_DRAFT_KEY, JSON.stringify({ savedAt: Date.now() - 31 * 864e5, step: 2, data: {} }));
    expect(readMentorDraft()).toBeNull();
  });
});

describe("MentorsLandingPage", () => {
  it("only lists opportunities that have not passed", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-12-10T08:00:00"));
    render(<MentorsLandingPage onBack={() => {}} />);
    expect(screen.queryByText("She Emerge Pitch Day 2026")).toBeNull();
    expect(screen.queryByText("AgriTech Innovation Bootcamp")).toBeNull();
    expect(screen.getByText("Emerge4Biz Core Cohort 8")).toBeTruthy();
    vi.useRealTimers();
  });

  it("Register Interest opens mentor registration", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-14T08:00:00"));
    const onApply = vi.fn();
    render(<MentorsLandingPage onBack={() => {}} onApplyMentor={onApply} />);
    fireEvent.click(screen.getAllByText("Register Interest")[0]);
    expect(onApply).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("has no dead Resources/Programs nav links and Contact points at the footer", () => {
    const { container } = render(<MentorsLandingPage onBack={() => {}} />);
    const hrefs = Array.from(container.querySelectorAll("nav a")).map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain("#resources");
    expect(hrefs).not.toContain("#programs");
    for (const h of hrefs) if (h) expect(container.querySelector(h), h).not.toBeNull();
  });

  it("expertise filter highlights matching mentors and shows fitting roles", () => {
    render(<MentorsLandingPage onBack={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Investment Readiness" }));
    expect(screen.getByText("Roles that fit:")).toBeTruthy();
    expect(screen.getByText(/Highlighting mentors with expertise in/)).toBeTruthy();
  });

  it("matching preview ranks the mentor who fits the startup first", () => {
    render(<MentorsLandingPage onBack={() => {}} />);
    const section = document.getElementById("matching")!;
    const [stage, sector, need] = Array.from(section.querySelectorAll("select")) as HTMLSelectElement[];
    fireEvent.change(stage, { target: { value: "Idea" } });
    fireEvent.change(sector, { target: { value: "Education" } });
    fireEvent.change(need, { target: { value: "Business Strategy" } });
    const first = within(section).getAllByRole("progressbar")[0];
    expect(first.getAttribute("aria-label")).toContain("Prof. James Banda");
    expect(first.getAttribute("aria-valuenow")).toBe("100");
  });

  it("offers to continue an unfinished application", () => {
    writeMentorDraft(3, { acct: { firstName: "Amina" } });
    render(<MentorsLandingPage onBack={() => {}} />);
    expect(screen.getAllByText("Continue Your Application").length).toBeGreaterThan(0);
  });
});
