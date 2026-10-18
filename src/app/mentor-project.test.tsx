import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

async function openMentorForm() {
  vi.resetModules(); sessionStorage.clear(); sessionStorage.setItem("emerge.page", "mentor-register");
  const { default: App } = await import("./App");
  render(<App />);
  return userEvent.setup();
}
const programmeSelect = () =>
  screen.getAllByRole("combobox").find(el => within(el).queryByRole("option", { name: "Incubation" }))!;

describe("mentor registration asks which incubation project the mentor is applying to", () => {
  beforeEach(() => localStorage.clear());

  it("shows the project list only for the Incubation programme", async () => {
    const u = await openMentorForm();
    expect(screen.queryByLabelText("Incubation project")).toBeNull();
    await u.selectOptions(programmeSelect(), "Incubation");
    const project = screen.getByLabelText("Incubation project");
    expect(within(project).getByRole("option", { name: "Zantchito Incubation" })).toBeTruthy();
    await u.selectOptions(programmeSelect(), "Acceleration");
    expect(screen.queryByLabelText("Incubation project")).toBeNull();
  });

  it("will not continue until a project is chosen", async () => {
    const u = await openMentorForm();
    await u.type(screen.getByPlaceholderText("your@email.com"), "project.mentor@example.com");
    await u.type(screen.getAllByPlaceholderText("+265 88 000 0000")[0], "0888 777 111");
    await u.type(screen.getByPlaceholderText("e.g. V32N6SM4"), "PM112233");
    await u.selectOptions(programmeSelect(), "Incubation");
    await u.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText("Create Your Account")).toBeTruthy(); // stayed on step 1
    expect(screen.getByText(/Choose the incubation project/)).toBeTruthy();
    await u.selectOptions(screen.getByLabelText("Incubation project"), "Zantchito Incubation");
    await u.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.queryByText("Create Your Account")).toBeNull();
  });
});
