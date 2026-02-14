"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  DoorOpen,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

export default function EventMetricsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const eventId = params.id as Id<"events">;

  const event = useQuery(api.events.getById, { eventId });
  const summary = useQuery(api.eventMetrics.getEventMetricsSummary, { eventId });
  const realtimeFlow = useQuery(api.eventMetrics.getRealtimeGateFlow, {
    eventId,
    windowMinutes: 60,
  });
  const gateTraffic = useQuery(api.gateQueue.getGateTraffic, { eventId });

  if (event === undefined || summary === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Event not found</p>
      </div>
    );
  }

  // Only owner can see metrics
  if (user?.id !== event.userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-gray-600 text-lg">
            Only the event owner can view metrics
          </p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const gates = summary?.gates ?? event.gates ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href={`/event/${eventId}`}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Event Metrics
              </h1>
              <p className="text-gray-500 mt-1">{event.name}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.totalEntries ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Flow / Hour</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.currentFlowPerHour ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <DoorOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Gates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {gates.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Gate Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Gate Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gates.map((gate) => {
              const gateData = summary?.gateBreakdown?.[gate];
              const traffic = gateTraffic?.[gate];
              const flowCount = realtimeFlow?.gateFlow?.[gate] ?? 0;

              // Estimate wait: pending people * 5 min each
              const pendingCount = traffic?.pending ?? 0;
              const estimatedWait = pendingCount * 5;

              return (
                <div
                  key={gate}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-gray-500" />
                      {gate}
                    </h3>
                    <span className="text-sm font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {gateData?.totalEntries ?? 0} entries
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs">In Queue</p>
                      <p className="font-semibold text-gray-900">
                        {(traffic?.pending ?? 0) + (traffic?.current ?? 0)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs">Verified</p>
                      <p className="font-semibold text-gray-900">
                        {traffic?.verified ?? 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs">Flow / Hour</p>
                      <p className="font-semibold text-gray-900">{flowCount}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Est. Wait
                      </p>
                      <p className="font-semibold text-gray-900">
                        {estimatedWait === 0 ? "None" : `~${estimatedWait}m`}
                      </p>
                    </div>
                  </div>

                  {/* Recent entries */}
                  {gateData?.recentEntries && gateData.recentEntries.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Recent (last hour)
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {gateData.recentEntries.slice(0, 5).map((entry, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1"
                          >
                            <span className="text-gray-700 truncate max-w-[120px]">
                              {entry.userName ?? entry.userEmail ?? "Anonymous"}
                            </span>
                            <span className="text-gray-400">
                              {new Date(entry.verifiedAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Flow Chart (simple text-based) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Hourly Flow Timeline
          </h2>
          {summary && (() => {
            // Collect all hourly data across gates
            const allHours = new Set<string>();
            for (const gate of gates) {
              const gateData = summary.gateBreakdown?.[gate];
              if (gateData?.hourlyFlow) {
                for (const h of Object.keys(gateData.hourlyFlow)) {
                  allHours.add(h);
                }
              }
            }
            const sortedHours = Array.from(allHours).sort();

            if (sortedHours.length === 0) {
              return (
                <p className="text-gray-400 text-sm">
                  No entries yet. Data will appear here as people verify at gates.
                </p>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">
                        Hour
                      </th>
                      {gates.map((gate) => (
                        <th
                          key={gate}
                          className="text-center py-2 px-3 text-gray-500 font-medium"
                        >
                          {gate}
                        </th>
                      ))}
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHours.map((hour) => {
                      let rowTotal = 0;
                      return (
                        <tr key={hour} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-700 font-mono text-xs">
                            {hour.substring(11)}:00
                          </td>
                          {gates.map((gate) => {
                            const count =
                              summary.gateBreakdown?.[gate]?.hourlyFlow?.[hour] ?? 0;
                            rowTotal += count;
                            return (
                              <td
                                key={gate}
                                className="text-center py-2 px-3"
                              >
                                <span
                                  className={`inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium ${
                                    count === 0
                                      ? "text-gray-300"
                                      : count <= 3
                                        ? "bg-blue-50 text-blue-700"
                                        : count <= 7
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  {count}
                                </span>
                              </td>
                            );
                          })}
                          <td className="text-center py-2 px-3 font-semibold text-gray-900">
                            {rowTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
