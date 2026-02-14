import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    name: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(),
    price: v.number(),
    totalTickets: v.number(),
    userId: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()), // Vercel Blob image URL
    is_cancelled: v.optional(v.boolean()),
    // Gate names for this event (e.g. ["Gate A", "Gate B", "Gate C"])
    gates: v.optional(v.array(v.string())),
    gateCount: v.optional(v.number()), // Number of gates chosen by seller
  })
    .index("by_user", ["userId"]),
  tickets: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    purchasedAt: v.number(),
    status: v.union(
      v.literal("valid"),
      v.literal("used"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
    paymentIntentId: v.optional(v.string()),
    amount: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_user_event", ["userId", "eventId"])
    .index("by_payment_intent", ["paymentIntentId"]),
  waitingList: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("offered"),
      v.literal("purchased"),
      v.literal("expired")
    ),
    offerExpiresAt: v.optional(v.number()),
  })
    .index("by_event_status", ["eventId", "status"])
    .index("by_user_event", ["userId", "eventId"])
    .index("by_user", ["userId"]),
  // Gate queue entries — per-gate queue management
  gateQueue: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    gateName: v.string(),
    status: v.union(
      v.literal("pending"),    // waiting in line
      v.literal("current"),    // currently being served / at front
      v.literal("verified"),   // verified through gate
      v.literal("expired"),    // didn't verify in time, deallocated
      v.literal("released")    // user voluntarily released spot
    ),
    qrCode: v.string(),           // unique QR token for verification
    qrUsed: v.boolean(),          // whether QR has been scanned
    joinedAt: v.number(),
    expiresAt: v.optional(v.number()), // when the current spot expires (3 min for current, 10 min for pending)
    verifiedAt: v.optional(v.number()),
    estimatedWaitMinutes: v.optional(v.number()),
  })
    .index("by_event_gate_status", ["eventId", "gateName", "status"])
    .index("by_event_gate", ["eventId", "gateName"])
    .index("by_user_event", ["userId", "eventId"])
    .index("by_user", ["userId"])
    .index("by_qr", ["qrCode"]),
  // Event metrics — stores each gate verification entry for analytics
  eventMetrics: defineTable({
    eventId: v.id("events"),
    eventOwnerId: v.string(),       // seller userId for quick owner queries
    userId: v.string(),             // the user who was verified
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    gateName: v.string(),
    verifiedAt: v.number(),
    qrCode: v.string(),
    gateQueueEntryId: v.id("gateQueue"),
  })
    .index("by_event", ["eventId"])
    .index("by_event_gate", ["eventId", "gateName"])
    .index("by_event_owner", ["eventOwnerId"])
    .index("by_event_time", ["eventId", "verifiedAt"]),
  users: defineTable({
    name: v.string(),
    email: v.string(),
    userId: v.string(),
    stripeConnectId: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),
})