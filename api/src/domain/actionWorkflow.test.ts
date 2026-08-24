import { describe, it, expect } from "vitest";
import { isValidTransition, NEXT_STATUS } from "./actionWorkflow";

describe("isValidTransition", () => {
  it("allows every step of the forward progression", () => {
    expect(isValidTransition("none", "flagged")).toBe(true);
    expect(isValidTransition("flagged", "acknowledged")).toBe(true);
    expect(isValidTransition("acknowledged", "resolved")).toBe(true);
  });

  it("allows reopening a resolved site", () => {
    expect(isValidTransition("resolved", "flagged")).toBe(true);
  });

  it("rejects repeating the current status", () => {
    expect(isValidTransition("flagged", "flagged")).toBe(false);
  });

  it("rejects skipping ahead", () => {
    expect(isValidTransition("flagged", "resolved")).toBe(false);
    expect(isValidTransition("none", "acknowledged")).toBe(false);
    expect(isValidTransition("none", "resolved")).toBe(false);
  });

  it("rejects moving backwards", () => {
    expect(isValidTransition("acknowledged", "flagged")).toBe(false);
    expect(isValidTransition("resolved", "acknowledged")).toBe(false);
  });

  it("rejects an unrecognized or missing status", () => {
    expect(isValidTransition("none", "bogus")).toBe(false);
    expect(isValidTransition("none", undefined)).toBe(false);
  });
});

describe("NEXT_STATUS", () => {
  it("has an entry for every state, including a way out of resolved", () => {
    expect(NEXT_STATUS.none).toBe("flagged");
    expect(NEXT_STATUS.flagged).toBe("acknowledged");
    expect(NEXT_STATUS.acknowledged).toBe("resolved");
    expect(NEXT_STATUS.resolved).toBe("flagged");
  });
});
