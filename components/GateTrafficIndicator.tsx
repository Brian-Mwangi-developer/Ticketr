"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Users, Zap } from "lucide-react";

function GateTrafficIndicator({
    eventId,
}: {
    eventId: Id<"events">;
}) {
    const traffic = useQuery(api.gateQueue.getGateTraffic, { eventId });
    const gates = useQuery(api.gateQueue.getEventGates, { eventId });

    if (!traffic || !gates) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Zap className="w-4 h-4" />
                <span>Live Gate Traffic</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {gates.map((gate) => {
                    const gateTraffic = traffic[gate] ?? { pending: 0, current: 0, verified: 0 };
                    const totalActive = gateTraffic.pending + gateTraffic.current;
                    const level =
                        totalActive === 0
                            ? "empty"
                            : totalActive <= 3
                                ? "low"
                                : totalActive <= 7
                                    ? "moderate"
                                    : "busy";

                    const colors = {
                        empty: "bg-gray-50 border-gray-200 text-gray-600",
                        low: "bg-gray-50 border-gray-200 text-gray-700",
                        moderate: "bg-amber-50 border-amber-200 text-amber-700",
                        busy: "bg-red-50 border-red-200 text-red-700",
                    };

                    return (
                        <div
                            key={gate}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between ${colors[level]}`}
                        >
                            <span>{gate}</span>
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {totalActive}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default GateTrafficIndicator;
