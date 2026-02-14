import { v } from "convex/values";
import { query } from "./_generated/server";

// Get all metrics for an event (only accessible conceptually by owner via UI)
export const getEventMetrics = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    return await ctx.db
      .query("eventMetrics")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
  },
});

// Get metrics summary for an event — total entries, per-gate breakdown
export const getEventMetricsSummary = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const metrics = await ctx.db
      .query("eventMetrics")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();

    const event = await ctx.db.get(eventId);
    if (!event) return null;

    const gates = event.gates ?? [];

    // Per-gate breakdown
    const gateBreakdown: Record<
      string,
      {
        totalEntries: number;
        recentEntries: { userName?: string; userEmail?: string; verifiedAt: number }[];
        hourlyFlow: Record<string, number>;
      }
    > = {};

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const gate of gates) {
      const gateMetrics = metrics.filter((m) => m.gateName === gate);

      // Hourly flow — group by hour
      const hourlyFlow: Record<string, number> = {};
      for (const m of gateMetrics) {
        const hour = new Date(m.verifiedAt).toISOString().substring(0, 13); // "2026-02-14T10"
        hourlyFlow[hour] = (hourlyFlow[hour] ?? 0) + 1;
      }

      // Recent entries (last hour)
      const recent = gateMetrics
        .filter((m) => m.verifiedAt >= oneHourAgo)
        .sort((a, b) => b.verifiedAt - a.verifiedAt);

      gateBreakdown[gate] = {
        totalEntries: gateMetrics.length,
        recentEntries: recent.map((m) => ({
          userName: m.userName,
          userEmail: m.userEmail,
          verifiedAt: m.verifiedAt,
        })),
        hourlyFlow,
      };
    }

    // Current flow = verified in last hour
    const currentFlowTotal = metrics.filter(
      (m) => m.verifiedAt >= oneHourAgo
    ).length;

    return {
      totalEntries: metrics.length,
      currentFlowPerHour: currentFlowTotal,
      gateBreakdown,
      gates,
    };
  },
});

// Get realtime gate flow — verified count in the last N minutes per gate
export const getRealtimeGateFlow = query({
  args: {
    eventId: v.id("events"),
    windowMinutes: v.optional(v.number()), // default 60
  },
  handler: async (ctx, { eventId, windowMinutes }) => {
    const window = (windowMinutes ?? 60) * 60 * 1000;
    const cutoff = Date.now() - window;

    const metrics = await ctx.db
      .query("eventMetrics")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();

    const event = await ctx.db.get(eventId);
    if (!event) return null;

    const gates = event.gates ?? [];
    const gateFlow: Record<string, number> = {};

    for (const gate of gates) {
      gateFlow[gate] = metrics.filter(
        (m) => m.gateName === gate && m.verifiedAt >= cutoff
      ).length;
    }

    return {
      windowMinutes: windowMinutes ?? 60,
      gateFlow,
      totalFlow: Object.values(gateFlow).reduce((a, b) => a + b, 0),
    };
  },
});
