import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

const NOW = new Date("2026-01-01T12:00:00.000Z");

function agoIso(msAgo: number): string {
  return new Date(NOW.getTime() - msAgo).toISOString();
}

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for anything under a minute", () => {
    expect(formatRelativeTime(agoIso(0))).toBe("just now");
    expect(formatRelativeTime(agoIso(45 * 1000))).toBe("just now");
  });

  it("formats minutes, singular and plural", () => {
    expect(formatRelativeTime(agoIso(60 * 1000))).toBe("1 minute ago");
    expect(formatRelativeTime(agoIso(5 * 60 * 1000))).toBe("5 minutes ago");
  });

  it("formats hours, singular and plural", () => {
    expect(formatRelativeTime(agoIso(60 * 60 * 1000))).toBe("1 hour ago");
    expect(formatRelativeTime(agoIso(3 * 60 * 60 * 1000))).toBe("3 hours ago");
  });

  it("formats days, singular and plural", () => {
    expect(formatRelativeTime(agoIso(24 * 60 * 60 * 1000))).toBe("1 day ago");
    expect(formatRelativeTime(agoIso(2 * 24 * 60 * 60 * 1000))).toBe("2 days ago");
  });
});
