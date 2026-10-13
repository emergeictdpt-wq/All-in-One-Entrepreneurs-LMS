import { describe, expect, it } from "vitest";
import { authenticateManager, DEMO_PASSWORD } from "./auth";
import { SEED_MANAGERS, SEED_OWNERS, isUnassigned, manages, programsFor, withSeedOwners } from "./managers";
import { ALL_SCOPE, inScope, mentorInScope } from "./projectScope";
import type { AdminProgram } from "../types";

const prog = (id: string, managerIds?: string[]) => ({ id, name: id, published: true, managerIds } as unknown as AdminProgram);

describe("who champions which program", () => {
  it("gives the sample programs their managers and shares one between two managers", () => {
    const ps = withSeedOwners([prog("emerge4biz-core"), prog("shemerge-incubation"), prog("agri-incubation")]);
    expect(programsFor(ps, "MGR-001").map(p => p.id)).toEqual(["emerge4biz-core"]);
    expect(programsFor(ps, "MGR-002").map(p => p.id)).toEqual(["shemerge-incubation"]);
    expect(programsFor(ps, "MGR-003").map(p => p.id).sort()).toEqual(["agri-incubation", "emerge4biz-core"]);
    expect(Object.keys(SEED_OWNERS)).toHaveLength(3);
  });
  it("never shows a manager a program they do not champion, nor an unassigned one", () => {
    const ps = [prog("p-mine", ["MGR-001"]), prog("p-theirs", ["MGR-002"]), prog("p-old")];
    expect(programsFor(ps, "MGR-001").map(p => p.id)).toEqual(["p-mine"]);
    expect(isUnassigned(ps[2])).toBe(true);
    expect(manages(ps[2], "MGR-001")).toBe(false);
    expect(programsFor(ps, undefined)).toEqual([]);
  });
  it("keeps managers that were already saved on a program", () => {
    expect(withSeedOwners([prog("emerge4biz-core", ["MGR-002"])])[0].managerIds).toEqual(["MGR-002"]);
  });
});

describe("project scope for a manager", () => {
  const mine = { ...ALL_SCOPE, allowed: ["A"] };
  it("'All projects' means all of my projects, not everyone's", () => {
    expect(inScope(mine, { programId: "A" })).toBe(true);
    expect(inScope(mine, { programId: "B" })).toBe(false);
    expect(inScope(mine, {})).toBe(true);               // applied without choosing a project
    expect(inScope(ALL_SCOPE, { programId: "B" })).toBe(true); // no manager: unchanged
  });
  it("one chosen project narrows further; the mentor pool without a project stays visible", () => {
    const one = { projectId: "A", project: { id: "A" } as AdminProgram, allowed: ["A", "C"] };
    expect(inScope(one, { programId: "C" })).toBe(false);
    expect(mentorInScope(one, {})).toBe(true);
    expect(mentorInScope(mine, { programId: "B" })).toBe(false);
  });
});

describe("manager sign-in", () => {
  it("accepts a known manager with the demo password and nobody else", async () => {
    const ok = await authenticateManager("Chikondi.Mwale@emergelivelihoods.org", DEMO_PASSWORD, SEED_MANAGERS);
    expect(ok.ok && ok.manager.id).toBe("MGR-001");
    expect(await authenticateManager("chikondi.mwale@emergelivelihoods.org", "wrong1234", SEED_MANAGERS)).toMatchObject({ ok: false });
    expect(await authenticateManager("anyone@example.com", DEMO_PASSWORD, SEED_MANAGERS)).toMatchObject({ ok: false });
  });
});
