import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it.each([
    ["low", "badge-low"],
    ["moderate", "badge-moderate"],
    ["high", "badge-high"],
  ] as const)("renders %s tier with the %s class and an uppercase label", (tier, expectedClass) => {
    render(<RiskBadge tier={tier} />);
    const badge = screen.getByText(tier.toUpperCase());
    expect(badge).toHaveClass("badge", expectedClass);
  });
});
