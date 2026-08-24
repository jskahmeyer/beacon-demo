import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActionBadge } from "./ActionBadge";

describe("ActionBadge", () => {
  it.each([
    ["flagged", "badge-flagged"],
    ["acknowledged", "badge-acknowledged"],
    ["resolved", "badge-resolved"],
  ] as const)(
    "renders %s status with the %s class and an uppercase label",
    (status, expectedClass) => {
      render(<ActionBadge status={status} />);
      const badge = screen.getByText(status.toUpperCase());
      expect(badge).toHaveClass("badge", expectedClass);
    }
  );
});
