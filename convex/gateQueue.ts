import { internal } from "@/convex/_generated/api";
import { DEFAULT_GATES, DURATIONS, GATE_QUEUE_STATUS } from "@/convex/constants";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internalMutation, mutation, MutationCtx, query } from "./_generated/server";

// Generate a unique QR token
function generateQRToken(userId: string, eventId: string, gateName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `QR-${eventId}-${gateName}-${userId}-${timestamp}-${random}`;
}

// Get available gates for an event
export const getEventGates = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
        const event = await ctx.db.get(eventId);
        if (!event) throw new Error("Event not found");
        return event.gates ?? [...DEFAULT_GATES];
    },
});

// Get gate traffic — how many people are in each gate's queue
export const getGateTraffic = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, { eventId }) => {
        const event = await ctx.db.get(eventId);
        if (!event) throw new Error("Event not found");

        const gates = event.gates ?? [...DEFAULT_GATES];
        const traffic: Record<string, { pending: number; current: number; verified: number }> = {};

        for (const gate of gates) {
            const pendingEntries = await ctx.db
                .query("gateQueue")
                .withIndex("by_event_gate_status", (q) =>
                    q.eq("eventId", eventId).eq("gateName", gate).eq("status", GATE_QUEUE_STATUS.PENDING)
                )
                .collect();

            const currentEntries = await ctx.db
                .query("gateQueue")
                .withIndex("by_event_gate_status", (q) =>
                    q.eq("eventId", eventId).eq("gateName", gate).eq("status", GATE_QUEUE_STATUS.CURRENT)
                )
                .collect();

            const verifiedEntries = await ctx.db
                .query("gateQueue")
                .withIndex("by_event_gate_status", (q) =>
                    q.eq("eventId", eventId).eq("gateName", gate).eq("status", GATE_QUEUE_STATUS.VERIFIED)
                )
                .collect();

            traffic[gate] = {
                pending: pendingEntries.length,
                current: currentEntries.length,
                verified: verifiedEntries.length,
            };
        }

        return traffic;
    },
});

// Get a user's current gate queue entry for an event
export const getUserGateEntry = query({
    args: {
        eventId: v.id("events"),
        userId: v.string(),
    },
    handler: async (ctx, { eventId, userId }) => {
        // Find the user's active entry (not expired/released/verified)
        const entries = await ctx.db
            .query("gateQueue")
            .withIndex("by_user_event", (q) =>
                q.eq("userId", userId).eq("eventId", eventId)
            )
            .collect();

        // Return the active one (pending or current)
        const active = entries.find(
            (e) =>
                e.status === GATE_QUEUE_STATUS.PENDING ||
                e.status === GATE_QUEUE_STATUS.CURRENT
        );

        if (!active) return null;

        // Calculate position ahead
        const aheadEntries = await ctx.db
            .query("gateQueue")
            .withIndex("by_event_gate_status", (q) =>
                q.eq("eventId", eventId).eq("gateName", active.gateName).eq("status", GATE_QUEUE_STATUS.PENDING)
            )
            .collect();

        const currentEntries = await ctx.db
            .query("gateQueue")
            .withIndex("by_event_gate_status", (q) =>
                q.eq("eventId", eventId).eq("gateName", active.gateName).eq("status", GATE_QUEUE_STATUS.CURRENT)
            )
            .collect();

        // People ahead = those who joined before this user and are still pending or current
        const peopleAhead = [...aheadEntries, ...currentEntries].filter(
            (e) => e.joinedAt < active.joinedAt && e._id !== active._id
        ).length;

        const estimatedWaitMinutes = peopleAhead * 5; // 5 min per person

        return {
            ...active,
            position: peopleAhead + 1,
            peopleAhead,
            estimatedWaitMinutes,
        };
    },
});

// Join a specific gate's queue
export const joinGateQueue = mutation({
    args: {
        eventId: v.id("events"),
        userId: v.string(),
        gateName: v.string(),
    },
    handler: async (ctx, { eventId, userId, gateName }) => {
        // Check if user already has an active entry for this event
        const existingEntries = await ctx.db
            .query("gateQueue")
            .withIndex("by_user_event", (q) =>
                q.eq("userId", userId).eq("eventId", eventId)
            )
            .collect();

        const activeEntry = existingEntries.find(
            (e) =>
                e.status === GATE_QUEUE_STATUS.PENDING ||
                e.status === GATE_QUEUE_STATUS.CURRENT
        );

        if (activeEntry) {
            throw new Error("You already have an active queue entry for this event");
        }

        // Verify the event exists
        const event = await ctx.db.get(eventId);
        if (!event) throw new Error("Event not found");

        const gates = event.gates ?? [...DEFAULT_GATES];
        if (!gates.includes(gateName)) {
            throw new Error("Invalid gate selected");
        }

        const now = Date.now();
        const qrCode = generateQRToken(userId, eventId, gateName);

        // Check if there's currently someone being served at this gate
        const currentAtGate = await ctx.db
            .query("gateQueue")
            .withIndex("by_event_gate_status", (q) =>
                q.eq("eventId", eventId).eq("gateName", gateName).eq("status", GATE_QUEUE_STATUS.CURRENT)
            )
            .first();

        // Count pending users ahead
        const pendingAhead = await ctx.db
            .query("gateQueue")
            .withIndex("by_event_gate_status", (q) =>
                q.eq("eventId", eventId).eq("gateName", gateName).eq("status", GATE_QUEUE_STATUS.PENDING)
            )
            .collect();

        const isFirstInLine = !currentAtGate && pendingAhead.length === 0;

        // If first in line, make them current immediately
        const status = isFirstInLine ? GATE_QUEUE_STATUS.CURRENT : GATE_QUEUE_STATUS.PENDING;
        const expiresAt = isFirstInLine
            ? now + DURATIONS.GATE_CURRENT_TIMEOUT // 3 min to verify if current
            : now + DURATIONS.GATE_QUEUE_TIMEOUT;  // 10 min general timeout

        const entryId = await ctx.db.insert("gateQueue", {
            eventId,
            userId,
            gateName,
            status,
            qrCode,
            qrUsed: false,
            joinedAt: now,
            expiresAt,
            estimatedWaitMinutes: isFirstInLine ? 0 : pendingAhead.length * 5,
        });

        // Schedule expiry
        const timeout = isFirstInLine
            ? DURATIONS.GATE_CURRENT_TIMEOUT
            : DURATIONS.GATE_QUEUE_TIMEOUT;

        await ctx.scheduler.runAfter(timeout, internal.gateQueue.expireGateEntry, {
            entryId,
            eventId,
            gateName,
        });

        return {
            success: true,
            entryId,
            status,
            qrCode,
            position: isFirstInLine ? 1 : pendingAhead.length + 1 + (currentAtGate ? 1 : 0),
            message: isFirstInLine
                ? "You're up! Present your QR code for verification within 3 minutes."
                : `Joined ${gateName} queue. ${pendingAhead.length + (currentAtGate ? 1 : 0)} person(s) ahead of you.`,
        };
    },
});

// Verify a user's QR code at the gate
export const verifyQRCode = mutation({
    args: {
        qrCode: v.string(),
    },
    handler: async (ctx, { qrCode }) => {
        const entry = await ctx.db
            .query("gateQueue")
            .withIndex("by_qr", (q) => q.eq("qrCode", qrCode))
            .first();

        if (!entry) {
            return { success: false, message: "Invalid QR code" };
        }

        if (entry.qrUsed) {
            return { success: false, message: "This QR code has already been used" };
        }

        if (entry.status === GATE_QUEUE_STATUS.EXPIRED) {
            return { success: false, message: "This queue entry has expired" };
        }

        if (entry.status === GATE_QUEUE_STATUS.RELEASED) {
            return { success: false, message: "This queue entry was released" };
        }

        if (entry.status === GATE_QUEUE_STATUS.VERIFIED) {
            return { success: false, message: "Already verified" };
        }

        // Mark as verified
        await ctx.db.patch(entry._id, {
            status: GATE_QUEUE_STATUS.VERIFIED,
            qrUsed: true,
            verifiedAt: Date.now(),
        });

        // Promote next person in line for this gate
        await promoteNextInGate(ctx, entry.eventId, entry.gateName);

        return {
            success: true,
            message: "Verified successfully! Welcome through the gate.",
            gateName: entry.gateName,
        };
    },
});

// Release a queue spot voluntarily
export const releaseGateSpot = mutation({
    args: {
        entryId: v.id("gateQueue"),
    },
    handler: async (ctx, { entryId }) => {
        const entry = await ctx.db.get(entryId);
        if (!entry) throw new Error("Queue entry not found");

        if (
            entry.status !== GATE_QUEUE_STATUS.PENDING &&
            entry.status !== GATE_QUEUE_STATUS.CURRENT
        ) {
            throw new Error("Cannot release this queue entry");
        }

        await ctx.db.patch(entryId, {
            status: GATE_QUEUE_STATUS.RELEASED,
        });

        // If this was the current person, promote next
        if (entry.status === GATE_QUEUE_STATUS.CURRENT) {
            await promoteNextInGate(ctx, entry.eventId, entry.gateName);
        }

        return { success: true, message: "Queue spot released" };
    },
});

// Internal: expire a gate queue entry
export const expireGateEntry = internalMutation({
    args: {
        entryId: v.id("gateQueue"),
        eventId: v.id("events"),
        gateName: v.string(),
    },
    handler: async (ctx, { entryId, eventId, gateName }) => {
        const entry = await ctx.db.get(entryId);
        if (!entry) return;

        // Only expire if still pending or current
        if (
            entry.status !== GATE_QUEUE_STATUS.PENDING &&
            entry.status !== GATE_QUEUE_STATUS.CURRENT
        ) {
            return;
        }

        await ctx.db.patch(entryId, {
            status: GATE_QUEUE_STATUS.EXPIRED,
        });

        // If this was current, promote next
        if (entry.status === GATE_QUEUE_STATUS.CURRENT) {
            await promoteNextInGate(ctx, eventId, gateName);
        }
    },
});

// Internal: update estimated wait times for all pending entries at a gate
export const updateGateWaitTimes = internalMutation({
    args: {
        eventId: v.id("events"),
        gateName: v.string(),
    },
    handler: async (ctx, { eventId, gateName }) => {
        const pendingEntries = await ctx.db
            .query("gateQueue")
            .withIndex("by_event_gate_status", (q) =>
                q.eq("eventId", eventId).eq("gateName", gateName).eq("status", GATE_QUEUE_STATUS.PENDING)
            )
            .collect();

        // Sort by joinedAt
        pendingEntries.sort((a, b) => a.joinedAt - b.joinedAt);

        for (let i = 0; i < pendingEntries.length; i++) {
            await ctx.db.patch(pendingEntries[i]._id, {
                estimatedWaitMinutes: (i + 1) * 5, // 5 min per person
            });
        }
    },
});

// Helper: promote the next person in a gate's queue to "current"
async function promoteNextInGate(
    ctx: MutationCtx,
    eventId: Id<"events">,
    gateName: string
) {
    // Check if there's already someone current
    const currentEntry = await ctx.db
        .query("gateQueue")
        .withIndex("by_event_gate_status", (q) =>
            q.eq("eventId", eventId).eq("gateName", gateName).eq("status", GATE_QUEUE_STATUS.CURRENT)
        )
        .first();

    if (currentEntry) return; // Someone is already current

    // Get the next pending person (oldest joinedAt)
    const pendingEntries = await ctx.db
        .query("gateQueue")
        .withIndex("by_event_gate_status", (q) =>
            q.eq("eventId", eventId).eq("gateName", gateName).eq("status", GATE_QUEUE_STATUS.PENDING)
        )
        .collect();

    if (pendingEntries.length === 0) return;

    // Sort by joinedAt and pick the first
    pendingEntries.sort((a, b) => a.joinedAt - b.joinedAt);
    const next = pendingEntries[0];

    const now = Date.now();

    await ctx.db.patch(next._id, {
        status: GATE_QUEUE_STATUS.CURRENT,
        expiresAt: now + DURATIONS.GATE_CURRENT_TIMEOUT,
        estimatedWaitMinutes: 0,
    });

    // Schedule expiry for this new current entry (3 min to verify)
    await ctx.scheduler.runAfter(DURATIONS.GATE_CURRENT_TIMEOUT, internal.gateQueue.expireGateEntry, {
        entryId: next._id,
        eventId,
        gateName,
    });

    // Update wait times for remaining pending
    await ctx.scheduler.runAfter(0, internal.gateQueue.updateGateWaitTimes, {
        eventId,
        gateName,
    });
}
