import { Doc } from "./_generated/dataModel";

// Time constants in milliseconds
export const DURATIONS = {
  TICKET_OFFER: 30 * 60 * 1000, // 30 minutes (Minimum Stripe allows for checkout expiry)
  GATE_QUEUE_TIMEOUT: 10 * 60 * 1000, // 10 minutes — release queue spot if not verified
  GATE_CURRENT_TIMEOUT: 3 * 60 * 1000, // 3 minutes — if current in line and not verified, deallocate
  ESTIMATED_WAIT_PER_PERSON: 5 * 60 * 1000, // 5 minutes estimated per person
} as const;

// Status types for better type safety
export const WAITING_LIST_STATUS: Record<string, Doc<"waitingList">["status"]> =
  {
    WAITING: "waiting",
    OFFERED: "offered",
    PURCHASED: "purchased",
    EXPIRED: "expired",
  } as const;

export const TICKET_STATUS: Record<string, Doc<"tickets">["status"]> = {
  VALID: "valid",
  USED: "used",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
} as const;

// Gate queue statuses
export const GATE_QUEUE_STATUS: Record<string, Doc<"gateQueue">["status"]> = {
  PENDING: "pending",
  CURRENT: "current",
  VERIFIED: "verified",
  EXPIRED: "expired",
  RELEASED: "released",
} as const;

// Default gates for events
export const DEFAULT_GATES = ["Gate A", "Gate B", "Gate C", "Gate D"] as const;