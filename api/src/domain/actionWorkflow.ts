import { SiteMetrics } from "../types";

export type ActionStatus = NonNullable<SiteMetrics["actionStatus"]>;
export type ActionState = ActionStatus | "none";

// Linear progression, with one exception: "resolved" cycles back to
// "flagged" rather than being a true dead end — a resolved site can
// always be reopened manually if new problems come up later, regardless
// of what the AI's most recent assessment currently says.
export const NEXT_STATUS: Record<ActionState, ActionStatus> = {
  none: "flagged",
  flagged: "acknowledged",
  acknowledged: "resolved",
  resolved: "flagged",
};

export function isValidTransition(
  current: ActionState,
  requested: string | undefined
): requested is ActionStatus {
  return requested === NEXT_STATUS[current];
}
