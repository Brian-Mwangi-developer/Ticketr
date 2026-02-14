"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
    AlertTriangle,
    DoorOpen,
    Loader2,
    ShieldCheck,
    Timer,
    Users,
    XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function GateQueueStatus({
    eventId,
    userId,
}: {
    eventId: Id<"events">;
    userId: string;
}) {
    const userEntry = useQuery(api.gateQueue.getUserGateEntry, {
        eventId,
        userId,
    });
    const releaseSpot = useMutation(api.gateQueue.releaseGateSpot);
    const [timeRemaining, setTimeRemaining] = useState("");
    const [isReleasing, setIsReleasing] = useState(false);

    const expiresAt = userEntry?.expiresAt ?? 0;

    useEffect(() => {
        if (!userEntry || !expiresAt) return;

        const calculateTime = () => {
            const diff = expiresAt - Date.now();
            if (diff <= 0) {
                setTimeRemaining("Expired");
                return;
            }
            const minutes = Math.floor(diff / 1000 / 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setTimeRemaining(
                `${minutes}:${seconds.toString().padStart(2, "0")}`
            );
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, userEntry]);

    if (!userEntry) return null;

    const handleRelease = async () => {
        if (!confirm("Are you sure you want to leave the queue?")) return;
        try {
            setIsReleasing(true);
            await releaseSpot({ entryId: userEntry._id });
            toast.success("Queue spot released");
        } catch (error) {
            console.error("Error releasing spot:", error);
            toast.error("Failed to release spot");
        } finally {
            setIsReleasing(false);
        }
    };

    const isCurrent = userEntry.status === "current";
    const isPending = userEntry.status === "pending";

    return (
        <div className="space-y-4">
            {/* Status Card */}
            <div
                className={`rounded-xl border-2 overflow-hidden ${isCurrent
                        ? "border-red-400 bg-red-50 animate-pulse-slow"
                        : "border-blue-300 bg-blue-50"
                    }`}
            >
                {/* Header */}
                <div
                    className={`px-4 py-3 flex items-center justify-between ${isCurrent
                            ? "bg-red-500 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <DoorOpen className="w-5 h-5" />
                        <span className="font-semibold">{userEntry.gateName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4" />
                        <span className="font-mono text-sm">{timeRemaining}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    {isCurrent && (
                        <div className="flex items-center gap-3 p-3 bg-red-100 rounded-lg border border-red-200">
                            <div className="relative">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
                                <div className="w-3 h-3 bg-red-500 rounded-full relative" />
                            </div>
                            <div>
                                <p className="font-semibold text-red-800">You&apos;re Up!</p>
                                <p className="text-sm text-red-600">
                                    Present your QR code for verification within{" "}
                                    <span className="font-mono font-bold">{timeRemaining}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {isPending && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                <div>
                                    <p className="font-semibold text-blue-800">
                                        {userEntry.peopleAhead === 0
                                            ? "You're next!"
                                            : `${userEntry.peopleAhead} person${userEntry.peopleAhead === 1 ? "" : "s"} ahead of you`}
                                    </p>
                                    <p className="text-sm text-blue-600">
                                        Estimated wait:{" "}
                                        <span className="font-semibold">
                                            ~{userEntry.estimatedWaitMinutes ?? 5} min
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Position indicator */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-blue-100 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.max(10, 100 - (userEntry.peopleAhead ?? 0) * 20)}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-blue-600 font-medium">
                                    #{userEntry.position}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* QR Code */}
                    <div className="flex flex-col items-center space-y-3 py-4">
                        <div
                            className={`p-4 bg-white rounded-xl shadow-lg border-2 ${isCurrent ? "border-red-300" : "border-gray-200"
                                }`}
                        >
                            <QRCodeSVG
                                value={`https://ticketr-henna.vercel.app/verify/${encodeURIComponent(userEntry.qrCode)}`}
                                size={180}
                                level="H"
                                includeMargin
                                bgColor="#ffffff"
                                fgColor={isCurrent ? "#dc2626" : "#1e40af"}
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 font-mono break-all max-w-[220px]">
                                {userEntry.qrCode.substring(0, 20)}...
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Unique • One-time use only
                            </p>
                        </div>
                    </div>

                    {/* Warning for current */}
                    {isCurrent && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">
                                If you don&apos;t verify within 3 minutes, your spot will be
                                automatically released to the next person in line.
                            </p>
                        </div>
                    )}

                    {/* Release button */}
                    <button
                        onClick={handleRelease}
                        disabled={isReleasing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-red-200"
                    >
                        <XCircle className="w-4 h-4" />
                        {isReleasing ? "Releasing..." : "Leave Queue"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function GateSelector({
    eventId,
    userId,
}: {
    eventId: Id<"events">;
    userId: string;
}) {
    const gates = useQuery(api.gateQueue.getEventGates, { eventId });
    const traffic = useQuery(api.gateQueue.getGateTraffic, { eventId });
    const joinQueue = useMutation(api.gateQueue.joinGateQueue);
    const [selectedGate, setSelectedGate] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    if (!gates || !traffic) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    const handleJoinGate = async (gateName: string) => {
        try {
            setIsJoining(true);
            setSelectedGate(gateName);
            const result = await joinQueue({ eventId, userId, gateName });
            if (result.success) {
                toast.success(result.message);
            }
        } catch (error: unknown) {
            console.error("Error joining gate queue:", error);
            toast.error(error instanceof Error ? error.message : "Failed to join gate queue");
        } finally {
            setIsJoining(false);
            setSelectedGate(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Select Your Gate</h3>
                <p className="text-sm text-gray-500">
                    Choose a gate to join the verification queue
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {gates.map((gate) => {
                    const gateTraffic = traffic[gate] ?? {
                        pending: 0,
                        current: 0,
                        verified: 0,
                    };
                    const totalActive = gateTraffic.pending + gateTraffic.current;
                    const estimatedWait = totalActive * 5;

                    const level =
                        totalActive === 0
                            ? "empty"
                            : totalActive <= 3
                                ? "low"
                                : totalActive <= 7
                                    ? "moderate"
                                    : "busy";

                    const levelConfig = {
                        empty: {
                            bg: "bg-gray-50 hover:bg-gray-100",
                            border: "border-gray-300",
                            text: "text-gray-700",
                            badge: "bg-gray-100 text-gray-700",
                            label: "No Wait",
                        },
                        low: {
                            bg: "bg-gray-50 hover:bg-gray-100",
                            border: "border-gray-300",
                            text: "text-gray-700",
                            badge: "bg-gray-100 text-gray-700",
                            label: "Short Wait",
                        },
                        moderate: {
                            bg: "bg-amber-50 hover:bg-amber-100",
                            border: "border-amber-300",
                            text: "text-amber-700",
                            badge: "bg-amber-100 text-amber-700",
                            label: "Moderate",
                        },
                        busy: {
                            bg: "bg-red-50 hover:bg-red-100",
                            border: "border-red-300",
                            text: "text-red-700",
                            badge: "bg-red-100 text-red-700",
                            label: "Busy",
                        },
                    };

                    const config = levelConfig[level];
                    const isLoading = isJoining && selectedGate === gate;

                    return (
                        <button
                            key={gate}
                            onClick={() => handleJoinGate(gate)}
                            disabled={isJoining}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${config.bg} ${config.border} disabled:opacity-60 disabled:cursor-not-allowed active:scale-95`}
                        >
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            )}
                            <div className="flex flex-col items-center space-y-2">
                                <DoorOpen className={`w-8 h-8 ${config.text}`} />
                                <span className={`font-bold text-sm ${config.text}`}>
                                    {gate}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Users className={`w-3.5 h-3.5 ${config.text}`} />
                                    <span className={`text-xs font-medium ${config.text}`}>
                                        {totalActive} in queue
                                    </span>
                                </div>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}
                                >
                                    {totalActive === 0
                                        ? "No Wait"
                                        : `~${estimatedWait} min`}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-2">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>Low</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Moderate</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span>Busy</span>
                </div>
            </div>
        </div>
    );
}

function VerifiedBadge({ gateName }: { gateName: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-xl border-2 border-green-300">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-800">Verified!</h3>
            <p className="text-sm text-green-600 mt-1">
                You passed through {gateName}
            </p>
        </div>
    );
}

export { GateQueueStatus, GateSelector, VerifiedBadge };
