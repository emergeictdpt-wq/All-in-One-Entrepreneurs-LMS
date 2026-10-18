import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AboutPage } from "./AboutPage";
import { Navbar } from "./Navbar";

beforeEach(() => {
  (globalThis as any).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
});

describe("AboutPage", () => {
  it("shows the vision, the impact figures and the 6 core values", () => {
    render(<AboutPage onNavigate={() => {}} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/self-reliance/i);
    expect(screen.getByText("25,620+")).toBeTruthy();
    for (const v of ["Innovation", "Collaboration", "Passion", "Visionary", "Inclusion", "Resilience"]) {
      expect(screen.getByRole("heading", { name: v })).toBeTruthy();
    }
  });

  it("sends visitors on to programs and mentorship", () => {
    const onNavigate = vi.fn();
    render(<AboutPage onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Explore programs"));
    expect(onNavigate).toHaveBeenLastCalledWith("incubation");
    fireEvent.click(screen.getByText("Become a mentor"));
    expect(onNavigate).toHaveBeenLastCalledWith("mentors");
  });
});

describe("Navbar → About Us", () => {
  it("About Us opens the about page instead of jumping to a hash", () => {
    const onNavigate = vi.fn();
    render(<Navbar onNavigate={onNavigate} />);
    fireEvent.click(screen.getAllByText("About Us")[0]);
    expect(onNavigate).toHaveBeenCalledWith("about");
  });
});
