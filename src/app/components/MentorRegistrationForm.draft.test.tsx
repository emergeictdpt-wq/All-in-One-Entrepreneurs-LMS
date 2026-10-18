import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { MentorRegistrationForm } from "./MentorRegistrationForm";
import { readMentorDraft } from "../data/mentorDraft";

beforeEach(() => { localStorage.clear(); window.HTMLElement.prototype.scrollIntoView = vi.fn(); });

describe("mentor registration saved progress", () => {
  it("saves progress, offers to continue, restores it, and never stores the password", async () => {
    vi.useFakeTimers();
    const first = render(<MentorRegistrationForm onBack={() => {}} />);
    const inputs = () => Array.from(first.container.querySelectorAll("input")) as HTMLInputElement[];
    const firstName = inputs().find(i => i.type === "text")!;
    fireEvent.change(firstName, { target: { value: "Amina" } });
    const pw = inputs().find(i => i.type === "password");
    if (pw) fireEvent.change(pw, { target: { value: "Secret-pass-123" } });
    await act(async () => { vi.advanceTimersByTime(1000); });
    const draft = readMentorDraft();
    expect(draft).not.toBeNull();
    expect((draft!.data as any).acct.firstName).toBe("Amina");
    expect(JSON.stringify(draft)).not.toContain("Secret-pass-123");
    first.unmount();

    render(<MentorRegistrationForm onBack={() => {}} />);
    expect(screen.getByText("You have an unfinished application")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("status")).getByText("Continue"));
    expect((document.querySelector("input[type=text]") as HTMLInputElement).value).toBe("Amina");
    expect(screen.queryByText("You have an unfinished application")).toBeNull();
    vi.useRealTimers();
  });

  it("Start over discards the saved draft", async () => {
    localStorage.setItem("emerge.mentorRegistrationDraft.v1", JSON.stringify({ savedAt: Date.now(), step: 2, data: { acct: { firstName: "Old" } } }));
    render(<MentorRegistrationForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Start over"));
    expect(readMentorDraft()).toBeNull();
  });
});
