import { beforeEach, describe, expect, it, vi } from "vitest";
import { bccLinks, buildAudience, campaignVisible, defaultTemplate, loadCampaigns, mailMergeCsv, markCampaignSent, renderFor, sendCampaign, type AudienceOptions } from "./emailCampaigns";

const ent = [
  { id: "APP-1", name: "Amina Banda", email: "amina@example.com", status: "Selected", programId: "p1", selectionReason: "Strong traction." },
  { id: "APP-2", name: "Chikondi Phiri", email: "chikondi@example.com", status: "Matching", programId: "p1" },
  { id: "APP-3", name: "Dalitso Mvula", email: "dalitso@example.com", status: "Rejected", programId: "p1", rejectionReason: "Business not yet operating." },
  { id: "APP-4", name: "Esther Chirwa", email: "", status: "Rejected", programId: "p1" },
  { id: "APP-5", name: "Esther C.", email: "Dalitso@Example.com", status: "Rejected", programId: "p2" },
  { id: "APP-6", name: "Pending Person", email: "pending@example.com", status: "Pending" },
];
const mnt = [
  { id: "MNT-1", name: "Dr. Thoko Banda", email: "thoko@example.com", status: "Selected" },
  { id: "MNT-2", name: "Mrs. Faith Nyirenda", email: "faith@example.com", status: "Approved" },
];
const base: AudienceOptions = { audience: "Selected", includeEntrepreneurs: true, includeMentors: true, includeMovedOn: false, skipAlreadyEmailed: true };
beforeEach(() => localStorage.clear());

describe("batch email audience", () => {
  it("selected means status Selected, across entrepreneurs and mentors", () => {
    expect(buildAudience(ent, mnt, base, []).recipients.map(r => r.id)).toEqual(["APP-1", "MNT-1"]);
  });
  it("can include people who have since been approved or moved to matching", () => {
    expect(buildAudience(ent, mnt, { ...base, includeMovedOn: true }, []).recipients.map(r => r.id)).toEqual(["APP-1", "APP-2", "MNT-1", "MNT-2"]);
  });
  it("rejected means status Rejected; blanks and repeat addresses are counted, not mailed", () => {
    const r = buildAudience(ent, mnt, { ...base, audience: "Rejected" }, []);
    expect(r.recipients.map(x => x.id)).toEqual(["APP-3"]);
    expect(r.noEmail).toBe(1);
    expect(r.duplicates).toBe(1);
  });
  it("can be limited to one kind of applicant", () => {
    expect(buildAudience(ent, mnt, { ...base, includeMentors: false }, []).recipients.map(r => r.id)).toEqual(["APP-1"]);
    expect(buildAudience(ent, mnt, { ...base, includeEntrepreneurs: false }, []).recipients.map(r => r.id)).toEqual(["MNT-1"]);
  });
  it("skips people already emailed this decision, but not for a different decision", () => {
    const first = buildAudience(ent, mnt, base, []);
    const { all } = sendCampaign({ audience: "Selected", recipients: first.recipients, subject: "s", body: "b" }, []);
    expect(buildAudience(ent, mnt, base, all).recipients).toEqual([]);
    expect(buildAudience(ent, mnt, base, all).alreadyEmailed).toBe(2);
    expect(buildAudience(ent, mnt, { ...base, skipAlreadyEmailed: false }, all).recipients).toHaveLength(2);
    expect(buildAudience(ent, mnt, { ...base, audience: "Rejected" }, all).recipients).toHaveLength(1);
  });
});

describe("batch email content", () => {
  it("personalises each message and drops an empty reason paragraph", () => {
    const [a, , m] = [...buildAudience(ent, mnt, { ...base, includeMovedOn: true }, []).recipients];
    const withReason = renderFor(a, defaultTemplate("Selected"));
    expect(withReason.body).toContain("Dear Amina,");
    expect(withReason.body).toContain("reference APP-1");
    expect(withReason.body).toContain("Strong traction.");
    const noReason = renderFor(m, defaultTemplate("Selected"));
    expect(noReason.subject).toBe("Your Emerge Livelihoods mentor registration: selected");
    expect(noReason.body).toContain("Dear Thoko,"); // title removed
    expect(noReason.body).not.toMatch(/\n{3,}/);
    expect(noReason.body).not.toContain("{{");
  });
  it("includes the individual rejection reason", () => {
    const r = buildAudience(ent, mnt, { ...base, audience: "Rejected" }, []).recipients[0];
    expect(renderFor(r, defaultTemplate("Rejected")).body).toContain("Business not yet operating.");
  });
  it("splits a large BCC list across several mail links and loses nobody", () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ id: `A${i}`, name: "X", email: `person${i}@example.com`, kind: "entrepreneur" as const }));
    const links = bccLinks(many, "Subject", "Body");
    expect(links.length).toBeGreaterThan(1);
    expect(links.every(l => l.length <= 1900)).toBe(true);
    const got = links.flatMap(l => decodeURIComponent(l.split("bcc=")[1]).split(","));
    expect(got).toHaveLength(200);
  });
  it("writes a mail-merge CSV with quotes escaped", () => {
    const r = [{ id: "APP-9", name: 'Tom "T" Kalua', email: "tom@example.com", kind: "entrepreneur" as const }];
    const csv = mailMergeCsv(r, { subject: "Hi {{firstName}}", body: "Ref {{reference}}" });
    expect(csv.split("\r\n")[0]).toBe("email,name,reference,subject,message");
    expect(csv).toContain('"Tom ""T"" Kalua"');
    expect(csv).toContain('"Hi Tom"');
  });
});

describe("campaign log", () => {
  it("is saved and reloaded", () => {
    const rs = buildAudience(ent, mnt, base, []).recipients;
    const { campaign } = sendCampaign({ audience: "Selected", recipients: rs, subject: "s", body: "b" }, []);
    expect(campaign).toMatchObject({ status: "Queued", recipients: 2, opened: null, clicked: null, audience: "Selected" });
    expect(loadCampaigns()[0].id).toBe(campaign.id);
  });
  it("is hidden from a manager who does not champion every recipient's programme", () => {
    const rs = buildAudience(ent, mnt, { ...base, audience: "Rejected", skipAlreadyEmailed: false }, []).recipients;
    const { campaign } = sendCampaign({ audience: "Rejected", recipients: rs, subject: "s", body: "b" }, []);
    expect(campaign.programIds).toEqual(["p1"]);
    expect(campaignVisible(campaign, { project: null, allowed: ["p1"] })).toBe(true);
    expect(campaignVisible(campaign, { project: null, allowed: ["p2"] })).toBe(false);
    expect(campaignVisible(campaign, { project: { id: "p1" } })).toBe(true);
    expect(campaignVisible(campaign, { project: { id: "p2" } })).toBe(false);
  });
});

describe("marking a batch as sent, and saving", () => {
  const rs = [{ id: "APP-1", name: "Amina Banda", email: "amina@example.com", kind: "entrepreneur" as const }];
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it("moves a Queued batch to Sent with the date, and keeps it", () => {
    const { campaign, all } = sendCampaign({ audience: "Selected", recipients: rs, subject: "s", body: "b" }, []);
    expect(campaign.status).toBe("Queued");
    const r = markCampaignSent(campaign.id, all, "2026-10-17");
    expect(r.saved).toBe(true);
    expect(r.all[0]).toMatchObject({ status: "Sent", sentOn: "2026-10-17" });
    expect(loadCampaigns()[0].status).toBe("Sent");
  });

  it("says so when the browser will not store the batch, and leaves the list unchanged when marking fails", () => {
    const { campaign, all } = sendCampaign({ audience: "Selected", recipients: rs, subject: "s", body: "b" }, []);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
    expect(sendCampaign({ audience: "Rejected", recipients: rs, subject: "s", body: "b" }, all).saved).toBe(false);
    const r = markCampaignSent(campaign.id, all);
    expect(r.saved).toBe(false);
    expect(r.all).toBe(all);
    expect(all[0].status).toBe("Queued");
  });
});
