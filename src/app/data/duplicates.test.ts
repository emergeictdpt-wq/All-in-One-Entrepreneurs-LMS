import { describe, expect, it } from "vitest";
import { findDuplicate, nationalIdProblem, normIdKey, normPhoneKey, phoneProblem } from "./duplicates";

const existing = [{ email: "Amina.Banda@Example.com", phone: "+265 991 234 567", nationalId: "KR 4821-39" }];

describe("duplicate applications", () => {
  it("accepts someone whose email, phone and National ID are all new", () => {
    expect(findDuplicate({ email: "new@example.com", phone: "0888 111 222", nationalId: "ZZ99887766" }, existing)).toBeNull();
  });

  it("rejects a matching email, ignoring case and spaces", () => {
    expect(findDuplicate({ email: "  amina.banda@example.com ", phone: "0888111222", nationalId: "ZZ99887766" }, existing)?.field).toBe("email");
  });

  it("rejects a matching phone however it is written", () => {
    for (const phone of ["+265991234567", "0991234567", "265 991 234 567", "00265-991-234-567", "991 234 567"])
      expect(findDuplicate({ email: "new@example.com", phone, nationalId: "ZZ99887766" }, existing)?.field).toBe("phone");
  });

  it("rejects a matching National ID, ignoring case, spaces and dashes", () => {
    expect(findDuplicate({ email: "new@example.com", phone: "0888111222", nationalId: "kr482139" }, existing)?.field).toBe("nationalId");
  });

  it("any single match is enough", () => {
    expect(findDuplicate({ email: "new@example.com", phone: "0991234567", nationalId: "ZZ99887766" }, existing)).not.toBeNull();
  });

  it("blank values never match each other", () => {
    expect(findDuplicate({ email: "", phone: "", nationalId: "" }, [{ email: "", phone: "", nationalId: "" }])).toBeNull();
    expect(findDuplicate({ email: "a@b.co" }, [{ email: "x@y.co", phone: "0991234567" }])).toBeNull();
  });

  it("normalises phones and IDs", () => {
    expect(normPhoneKey("+265 (0)88 000 0000")).toBe("880000000");
    expect(normIdKey("ab 12-34")).toBe("AB1234");
  });

  it("flags blank or implausible National IDs and phone numbers", () => {
    expect(nationalIdProblem("")).toMatch(/Enter your National ID/);
    expect(nationalIdProblem("12")).toMatch(/valid National ID/);
    expect(nationalIdProblem("KR482139")).toBe("");
    expect(nationalIdProblem("V32N6SM4")).toBe("");
    expect(nationalIdProblem("v32n 6sm4")).toBe("");
    expect(nationalIdProblem("V32N6SM")).toMatch(/8 letters and numbers/);
    expect(nationalIdProblem("V32N6SM44")).toMatch(/8 letters and numbers/);
    expect(nationalIdProblem("V32N6S#4")).toMatch(/8 letters and numbers/);
    expect(phoneProblem("")).toMatch(/Enter your phone/);
    expect(phoneProblem("12345")).toMatch(/valid phone/);
    expect(phoneProblem("+265 88 000 0000")).toBe("");
  });
});
