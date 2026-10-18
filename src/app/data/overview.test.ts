import { describe, expect, it } from "vitest";
import { computeOverview } from "./overview";
import type { AdminProgram, EntrepreneurApplication, MentorApplication } from "../types";

const prog = (id: string, published = true): AdminProgram => ({ id, name: id, sector: "", description: "", status: "Active", coverUrl: "", duration: "", location: "", format: "", overview: "", timelineEntries: [], benefits: "", eligibility: "", published });
const ent = (o: Partial<EntrepreneurApplication>): EntrepreneurApplication => ({ id: Math.random().toString(), name: "x", district: "Lilongwe", phone: "", sector: "Agri", date: "", status: "Pending", score: 0, program: "Incubation", isMockup: false, gender: "Female", ...o });
const mnt = (o: Partial<MentorApplication>): MentorApplication => ({ id: Math.random().toString(), name: "m", district: "Zomba", phone: "", expertise: "", date: "", status: "Pending", score: 0, program: "Incubation", isMockup: false, employer: "Acme", ...o });

describe("computeOverview", () => {
  it("is all zeros with nothing set up", () => {
    const o = computeOverview([], [], []);
    expect(o).toMatchObject({ programs: 0, implemented: 0, entrepreneurs: 0, mentors: 0, districts: 0, sectors: 0, organisations: 0, female: 0, male: 0, otherGender: 0 });
    expect(o.topSectors).toEqual([]);
  });

  it("counts every program set up, and only published ones as implemented", () => {
    const o = computeOverview([prog("a"), prog("b", false)], [], []);
    expect(o.programs).toBe(2);
    expect(o.implemented).toBe(1);
  });

  it("derives people, geography, sectors and gender from the applications", () => {
    const o = computeOverview([prog("a"), prog("b")], [
      ent({ programId: "a", gender: "Female", district: "Lilongwe", sector: "Agri" }),
      ent({ programId: "a", gender: "male", district: "lilongwe", sector: "Tech" }),
      ent({ programId: "b", gender: "Non-binary", district: "Zomba", sector: "agri" }),
      ent({ programId: "b", gender: "", district: "Zomba", sector: "Agri" }),
    ], [mnt({ programId: "a", employer: "Acme" }), mnt({ programId: "b", employer: "acme" }), mnt({ employer: "Globex" })]);
    expect(o).toMatchObject({ entrepreneurs: 4, mentors: 3, districts: 2, sectors: 2, organisations: 2, female: 1, male: 1, otherGender: 2 });
    expect(o.topSectors[0]).toEqual({ name: "Agri", count: 3, pct: 75 });
    expect(o.topDistricts.map(d => [d.name, d.count])).toEqual([["Lilongwe", 2], ["Zomba", 2]]);
  });

  it("counts persons with disability, and youth by the tick-box or the 18-35 age group", () => {
    const o = computeOverview([prog("a")], [
      ent({ programId: "a", pwd: true }),
      ent({ programId: "a", youthOwned: true }),
      ent({ programId: "a", ageGroup: "18-35" }),
      ent({ programId: "a", ageGroup: "35+" }),
      ent({ programId: "a" }),
    ], []);
    expect(o.pwd).toBe(1);
    expect(o.youth).toBe(2);
  });

  it("leaves out records of a program that no longer exists, keeps ones that never chose a program", () => {
    const o = computeOverview([prog("a")], [ent({ programId: "a" }), ent({ programId: "deleted" }), ent({})], []);
    expect(o.entrepreneurs).toBe(2);
  });
});
