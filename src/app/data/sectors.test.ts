import { describe, expect, it } from "vitest";
import { DEFAULT_APPLICATION_SECTORS, cleanSectors, sectorsFor } from "./sectors";

describe("application sectors", () => {
  it("falls back to the standard list when a project has none of its own", () => {
    expect(sectorsFor(undefined)).toEqual(DEFAULT_APPLICATION_SECTORS);
    expect(sectorsFor({})).toEqual(DEFAULT_APPLICATION_SECTORS);
    expect(sectorsFor({ applicationSectors: [] })).toEqual(DEFAULT_APPLICATION_SECTORS);
  });
  it("uses the project's own list in the order the admin set", () => {
    expect(sectorsFor({ applicationSectors: ["Fisheries", "Agriculture"] })).toEqual(["Fisheries", "Agriculture"]);
  });
  it("trims, drops blanks and removes repeats ignoring case", () => {
    expect(cleanSectors(["  Fisheries ", "", "fisheries", "Agri   business"])).toEqual(["Fisheries", "Agri business"]);
  });
});
